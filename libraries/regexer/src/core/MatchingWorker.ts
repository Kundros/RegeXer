import { expose } from 'threads/worker';
import { RegexTypes } from '@core/RegexParser';
import { Stack } from '@regexer/structures/Stack';
import { ASTGroup, ASTIteration, ASTOption, NFAState, NFAStateList, NFAtype } from '../coreTypes/parserTypes';
import { MatchBuilder } from './MatchBuilder';
import { MatchResponse, NewData, ReturnAborted, ReturnBatch, ReturnMatch } from '../coreTypes/MatchWorkerTypes';
import { MatchAction, MatchFlags, MatchGroup } from '@regexer/coreTypes/MatchTypes';

let AST: RegexTypes.ASTRoot;
let NFA: RegexTypes.NFAtype[];
let flags : number | MatchFlags | undefined;

type matchingState = {transition: number, state: RegexTypes.NFAtype};

class MatcherInternal
{
    constructor() 
    {}

    public match(pid : number, matchString? : string, batchSize?: number)
    {
        // init data
        if(matchString !== undefined)
        {
            this.pid_ = pid;

            this.regexPosStack_ = new Stack([0]);
            this.stringPosStack_ = new Stack([0]);
            this.iterationCurrentStack_ = new Stack();
            this.statesStack_ = new Stack();
            this.popedGroupIndicesStack_ = new Stack();
            this.groupsStack_ = new Stack();
            this.iterationHistoryStack_ = new Stack();
            this.groupIndicesMap_ = new Map();

            this.matchBuilder_ = new MatchBuilder(flags, batchSize ?? -1);
            this.matchBuilder_.matchData.start = 0;
            this.batchSize_ = batchSize ?? -1;
            this.matchString_ = matchString;
            this.isMatching = true;
            delete(this.response);

            this.matchBuilder_.addState({
                type: RegexTypes.RegexStates.ROOT,
                regAt: [0, 0],
                strAt: [0, 0]
            });
        }

        if(this.pid_ !== pid)
            return null;

        // test abortion if is aborted then stop executing on this thread
        if(this.response === MatchResponse.ABORTED)
        {
            this.isMatching = false;
            this.abortResolve();
            return <ReturnAborted>{ type: this.response, pid: this.pid_, data: undefined };
        }
        else if(this.response !== undefined)
        {
            this.isMatching = false;
            if(this.response & MatchResponse.SUCCESS)
                this.matchBuilder_.success = true;
            return <ReturnMatch>{ type: this.response, pid: this.pid_, data: this.matchBuilder_.finalize() };
        }

        // main loop for matching
        while(true) 
        {
            const nfaState = NFA[this.regexPosStack_.top()] as NFAtype;

            /* If we are at the last nfa node aka. END we're done matching */
            if(nfaState?.ASTelement?.type === RegexTypes.RegexStates.END)
                break;
            
            if(this.matchBuilder_.isBatchReady())
                return <ReturnBatch>{ type: MatchResponse.BATCH, pid: this.pid_, data: this.matchBuilder_.getBatch() };

            /* 
                If the state isn't at the top of the stack we need to add it as new state
                    + we add starting transition position at 0
                otherwise we move transition position by 1
            */
            if(this.statesStack_.top()?.state !== nfaState)
                this.statesStack_.push({transition: 0, state: nfaState});
            else
                this.statesStack_.top().transition++;
            

            const ASTtype = this.statesStack_.top().state?.ASTelement?.type;

            /* if the state is list we transition differently */
            if(ASTtype & (RegexTypes.RegexStates.P_LIST | RegexTypes.RegexStates.N_LIST | RegexTypes.RegexStates.SPECIAL | RegexTypes.RegexStates.ANY)) 
            {
                const returned = this.handleSetTransition();
                if(returned !== null) return returned;
                continue;
            }
            else if((ASTtype & RegexTypes.RegexStates.END_STRING) && this.stringPosStack_.top() != this.matchString_.length) 
            {
                const returned = this.handleBacktracking();
                if(returned !== null) return returned;
                continue;
            }
            else if((ASTtype & RegexTypes.RegexStates.START_STRING) && this.stringPosStack_.top() != 0) 
            {
                const returned = this.handleBacktracking();
                if(returned !== null) return returned;
                continue;
            }

            if(nfaState.transitions instanceof Set) 
                continue;

            /*
                If we have no more transitions left, we backtrack
                + if we tried all paths and failed exit matching and send error message
            */ 
            const transitions = (nfaState as NFAState).transitions;
            if(transitions.length <= this.statesStack_.top().transition)
            {
                const returned = this.handleBacktracking();
                if(returned !== null) return returned;
                continue;
            }

            /* --- ------------------- --- */
            /* --- applying transition --- */
            /* --- ------------------- --- */

            let transition = transitions[this.statesStack_.top().transition];

            // handle null transition (without moving position in string)
            if(transition[0] === null)
            {
                // if the transition is end of iteration we check if we have moved in string since last iteration
                if(nfaState?.ASTelement?.type & RegexTypes.RegexStates.ITERATION_END)
                {
                    const currentPosition = this.stringPosStack_.top();
                    const currentIteration = this.iterationCurrentStack_.top();

                    // if we didn't move then proceed to first positive transition (move out of iteration)
                    if(currentIteration[2] === currentPosition)
                    {
                        const positive = transitions[0][1] > 0 ? 0 : 1;
                        this.statesStack_.top().transition = positive;
                        transition = transitions[positive];
                    }
                    // if iteration is still looping we update to current string position
                    else if(transition[1] < 0)
                    {
                        currentIteration[2] = currentPosition;
                    }

                    /*
                     Rules for updating iteration:
                      1. if iteration is about to loop check if loop count is lower than range end: current top + 1
                      2. if iteration is about to exit check if loop count is withing range: history push current pop + 1
                    */
                    if (transition[1] < 0) 
                    {

                        if (currentIteration[1] + 1 >= currentIteration[0].range[1])
                            continue;
                        currentIteration[1]++;
                    }
                    else 
                    {
                        if ((currentIteration[0].type & RegexTypes.RegexStates.ITERATION_RANGE) && (currentIteration[1] + 1 < currentIteration[0].range[0] || currentIteration[1] + 1 > currentIteration[0].range[1])) {
                            const returned = this.handleBacktracking();
                            if (returned !== null)
                                return returned;
                            continue;
                        }
                        currentIteration[1]++;
                        this.iterationHistoryStack_.push(this.iterationCurrentStack_.pop());
                    }
                }

                /* 
                 if the transition is iteration then: 
                  1. if iteration is forwarding to first state of iteration: current push new record
                  2. if iteration is forwarding to first state after iteration and check if range is from zero: history push new record
                */
                if(nfaState?.ASTelement?.type & (RegexTypes.RegexStates.ITERATION_ONE | RegexTypes.RegexStates.ITERATION_ZERO | RegexTypes.RegexStates.ITERATION_RANGE))
                {
                    if(transition[1] === 1) // 1
                    {
                        this.iterationCurrentStack_.push([<ASTIteration>nfaState?.ASTelement, 0, this.stringPosStack_.top()]);
                    }
                    else // 2
                    {
                        if ((nfaState?.ASTelement?.type & RegexTypes.RegexStates.ITERATION_RANGE) && (<ASTIteration>nfaState?.ASTelement)?.range[0] > 0) 
                        {
                            continue;
                        }
                        this.iterationHistoryStack_.push([<ASTIteration>nfaState?.ASTelement, 0, this.stringPosStack_.top()]);
                    }
                }

                // handle group stact
                this.handleGroupEnterOrLeave(nfaState);
                this.handleOptionTransitioning(nfaState);

                this.regexPosStack_.push(this.regexPosStack_.top() + transition[1]);
                this.stringPosStack_.push(this.stringPosStack_.top());

                let canAddToMatch = false;

                // handle different flags to mutate the final match structure data
                if((~flags & MatchFlags.IGNORE_OPTION_LEAVES) && (nfaState?.ASTelement?.type & RegexTypes.RegexStates.OPTION_END))
                    canAddToMatch = true;
                else if((~flags & MatchFlags.IGNORE_GROUP_ENTERS) && (nfaState?.ASTelement?.type & RegexTypes.RegexStates.GROUP))
                    canAddToMatch = true;
                else if((~flags & MatchFlags.IGNORE_GROUP_LEAVES) && (nfaState?.ASTelement?.type & RegexTypes.RegexStates.GROUP_END))
                    canAddToMatch = true;

                if(canAddToMatch)
                {
                    this.matchBuilder_.addState({
                        type: nfaState.ASTelement.type, 
                        regAt : [nfaState.ASTelement.start, nfaState.ASTelement.end],
                        strAt: [this.matchBuilder_.matchData.start ?? 0 ,this.stringPosStack_.top()]
                    });
                }

                continue;
            }

            /* we now try if we can transition into new state */
            if(this.matchString_[this.stringPosStack_.top()] === transition[0] && this.stringPosStack_.top() < this.matchString_.length)
            {
                this.regexPosStack_.push(this.regexPosStack_.top() + transition[1]);
                this.stringPosStack_.push(this.stringPosStack_.top() + 1);

                this.matchBuilder_.addState({ 
                    type: nfaState.ASTelement.type, 
                    regAt: [nfaState.ASTelement.start, nfaState.ASTelement.end], 
                    strAt: [this.matchBuilder_.matchData.start ?? 0 ,this.stringPosStack_.top()]
                });

                continue;
            }   
        }

        this.matchBuilder_.matchData.end = this.stringPosStack_.top();

        const regexEnd = (NFA[0] as NFAState)?.ASTelement?.end ?? 0;
        this.matchBuilder_.addState({
            type: RegexTypes.RegexStates.ROOT,
            regAt: [regexEnd, regexEnd],
            strAt: [this.matchBuilder_.matchData.start, this.matchBuilder_.matchData.end]
        });

        // send last batch
        if(this.batchSize_ > 0)
        {
            matcher.response = MatchResponse.SUCCESS; // save response
            return <ReturnBatch>{ type: MatchResponse.BATCH, pid: this.pid_, data: this.matchBuilder_.getFinalBatch() };
        }

        this.matchBuilder_.success = true;
        this.isMatching = false;
        return <ReturnMatch>{ type: MatchResponse.SUCCESS, pid: this.pid_, data: this.matchBuilder_.finalize() };
    }

    private handleGroupEnterOrLeave(nfaState : NFAtype, backtracking: boolean = false)
    {
        if(nfaState?.ASTelement?.type & RegexTypes.RegexStates.GROUP)
        {
            if(backtracking)
            {
                const index = this.groupsStack_.top()?.name ?? this.groupsStack_.top()?.index ?? null;
                this.popedGroupIndicesStack_.push(index);

                // this is needed to test '*' iteration on backtracking
                if(index !== null)
                    this.matchBuilder_.pushNullGroupOnIndex(index);

                this.groupsStack_.pop();
            }
            else
            {
                const groupAST = <ASTGroup>nfaState?.ASTelement;

                if(groupAST.detailedType === 'NC')
                {
                    // null symbolizes non-capturing group (needed because event this type of group has state GROUP_END, to be poped)
                    this.groupsStack_.push(null); 
                }
                else{ // fallback for 'capturing' and 'named' group
                    if(!this.groupIndicesMap_.has(groupAST.start))
                        this.groupIndicesMap_.set(groupAST.start, this.groupIndicesMap_.size);
                    this.groupsStack_.push({index: this.groupIndicesMap_.get(groupAST.start), name: groupAST.name, strAt: [this.stringPosStack_.top(), 0], regAt: [groupAST.start, groupAST.end]});
                }
            }
        }
        else if(nfaState?.ASTelement?.type & RegexTypes.RegexStates.GROUP_END)
        {
            if(backtracking)
            {
                // prevention
                if(this.popedGroupIndicesStack_.size() <= 0)
                    return;
                
                //get last index of group and then get the stored group in match builder
                const popedIndex = this.popedGroupIndicesStack_.pop();
                if(popedIndex !== null)
                {
                    let group : MatchGroup | null;
                    // skip nulls
                    while((group = this.matchBuilder_.popGroup(popedIndex)) === null){};

                    if(group)
                        this.groupsStack_.push({index: group.index, strAt: group.strAt, regAt: group.regAt, name: group.name});
                }
                else
                {
                    this.groupsStack_.push(null);
                }
            }
            else
            {
                const currentGroup = this.groupsStack_.pop();
                if(!currentGroup)
                    return;

                if(nfaState)
                {
                    currentGroup.strAt[1] = this.stringPosStack_.top();
                    this.matchBuilder_.newIncomingGroup(currentGroup);
                }
            }
        }
    }

    private handleOptionTransitioning(nfaState : NFAtype)
    {
        const currentOption = nfaState?.ASTelement as ASTOption;
        const topState = this.statesStack_.top();

        if(!(nfaState?.ASTelement?.type & RegexTypes.RegexStates.OPTION))
            return;

        if(topState?.state !== nfaState)
            return;

        if(topState.transition >= currentOption.children.length && topState.transition < 0)
            return;

        if((flags & MatchFlags.OPTION_SHOW_FIRST_ENTER) && this.statesStack_.top()?.transition === 0)
            this.matchBuilder_.addState({
                type: nfaState.ASTelement.type, 
                regAt: [nfaState.ASTelement.start, nfaState.ASTelement.end],
                strAt: [this.matchBuilder_.matchData.start ?? 0, this.stringPosStack_.top()]
            });

        if((flags & MatchFlags.OPTION_ENTERS_SHOW_ACTIVE))
        {
            const optionSelectedArr = currentOption.children[topState.transition];

            if(optionSelectedArr.length <= 0) return;

            this.matchBuilder_.addState({
                type: nfaState.ASTelement.type, 
                regAt : [optionSelectedArr[0].start, optionSelectedArr[optionSelectedArr.length-1].end],
                strAt: [this.matchBuilder_.matchData.start ?? 0 ,this.stringPosStack_.top()],
                action: MatchAction.SHOWCASE
            });
        }
    }

    private handleSetTransition() : ReturnMatch | ReturnBatch | null
    {
        const listState = this.statesStack_.top().state as NFAStateList;

        if(this.stringPosStack_.top() + 1 <= this.matchString_.length && listState.transitions.has(this.matchString_[this.stringPosStack_.top()]))
        {
            this.regexPosStack_.push(this.regexPosStack_.top() + 1);
            this.stringPosStack_.push(this.stringPosStack_.top() + 1);
        }
        else
            return this.handleBacktracking();

        return null;
    }

    private handleBacktracking() : ReturnMatch | ReturnBatch | null
    {
        let lastRegexPos = this.regexPosStack_.pop();
        let lastState = this.statesStack_.pop();
        const nfaState = NFA[lastRegexPos];

        /* 
          If backtracking List or Special character has been processed thus we need to backtrack it too 
          Explanation: 
            Types in below loop are all containing set transition, which have no transition position,
            that means it has to be backtracked beforehand, to ensure correct evaluation 
        */
        while(this.statesStack_.top()?.state?.ASTelement?.type & (RegexTypes.RegexStates.P_LIST | RegexTypes.RegexStates.N_LIST | RegexTypes.RegexStates.SPECIAL))
        {
            lastRegexPos = this.regexPosStack_.pop();
            lastState = this.statesStack_.pop();
            this.stringPosStack_.pop();
        }

        /*
         Backtracking iteration in 4 different ways:
          1. backtracking from first state after iteration 'end' to iteration 'end': current push history pop - 1 (decrease one successful iteration)
          2. backtracking from first state after iteration 'start' to iteration 'end': current top - 1 (decrease one successful iteration)
          3. backtracking from first state after iteration 'end' to iteration 'start': pop history
          4. backtracking from first state after iteration 'start' to iteration 'start': pop current
        */
        if(NFA[this.regexPosStack_.top()]?.ASTelement?.type & RegexTypes.RegexStates.ITERATION_END)
        {
            if (lastRegexPos > this.regexPosStack_.top())
                this.iterationCurrentStack_.push(this.iterationHistoryStack_.pop()); // 1
            
            this.iterationCurrentStack_.top()[1]--; // 1, 2
        }
        else if(NFA[this.regexPosStack_.top()]?.ASTelement?.type & (RegexTypes.RegexStates.ITERATION_ONE | RegexTypes.RegexStates.ITERATION_ZERO | RegexTypes.RegexStates.ITERATION_RANGE))
        {
            if(lastRegexPos - this.regexPosStack_.top() > 1)
                this.iterationHistoryStack_.pop(); // 3
            else
                this.iterationCurrentStack_.pop(); // 4
        } 

        // handle group stact
        this.handleGroupEnterOrLeave(nfaState, true);

        // Handle when all paths from current starting position were searched, and proceed to next position
        if(this.statesStack_.size() === 0)
        {
            /* clear groups because we start matching from zero in nfa */
            this.matchBuilder_.clearGroups();

            /* match from any position wasn't found */
            if(this.stringPosStack_.top() + 1 >= this.matchString_.length)
            {
                delete this.matchBuilder_.matchData.start;
                delete this.matchBuilder_.matchData.end;

                this.matchBuilder_.addState({
                    type: RegexTypes.RegexStates.ROOT,
                    regAt: [NFA[0]?.ASTelement?.end ?? 0, NFA[0]?.ASTelement?.end ?? 0],
                    strAt: [this.matchString_.length, this.matchString_.length]
                });

                // send last batch
                if(this.batchSize_ > 0)
                {
                    matcher.response = MatchResponse.NO_MATCH; // save response
                    return <ReturnBatch>{ type: MatchResponse.BATCH, pid: this.pid_, data: this.matchBuilder_.getFinalBatch() };
                }

                this.isMatching = false;
                return <ReturnMatch>{ type: MatchResponse.NO_MATCH, pid: this.pid_, data: this.matchBuilder_.finalize() };
            }

            // move to next starting position
            this.stringPosStack_.push(this.stringPosStack_.pop() + 1);
            this.regexPosStack_.push(0);

            this.matchBuilder_.matchData.start = this.stringPosStack_.top();

            if(flags & MatchFlags.IGNORE_STR_START_POSITION_CHANGE || nfaState?.ASTelement?.type === undefined)
                return null;

            this.matchBuilder_.addState({
                type: nfaState.ASTelement.type, 
                regAt: [0, 0],
                strAt: [this.matchBuilder_.matchData.start ?? 0 ,this.stringPosStack_.top()],
                action: MatchAction.FORWARD_START
            });

            return null;
        }

        this.stringPosStack_.pop();

        if(nfaState?.ASTelement?.type === undefined)
            return null;

        this.matchBuilder_.addState({
            type: nfaState.ASTelement.type, 
            regAt: [nfaState.ASTelement.start, nfaState.ASTelement.end],
            strAt: [this.matchBuilder_.matchData.start ?? 0 ,this.stringPosStack_.top()],
            action: MatchAction.BACKTRACKING
        });

        const optionElement = this.statesStack_.top()?.state?.ASTelement;
        if(optionElement?.type === RegexTypes.RegexStates.OPTION)
            this.matchBuilder_.updateOption(optionElement.start, optionElement.end);

        return null;
    }

    public pid_ : number;

    /* Stacks for information for matching */
    private stringPosStack_ : Stack<number>;
    private regexPosStack_ : Stack<number>;
    // holds information about current iteration: [which iterator it is in ast, current iteration count, last position in string]
    private iterationCurrentStack_ : Stack<[RegexTypes.ASTIteration, number, number]>; 
    // holds information about history of iteration for backtracking: same data as current iterations
    private iterationHistoryStack_ : Stack<[RegexTypes.ASTIteration, number, number]>; 
    private statesStack_ : Stack<matchingState>;
    private groupsStack_ : Stack<MatchGroup | null>;
    // capturing : number, named : string, non-capturing : null
    private popedGroupIndicesStack_ : Stack<number | string | null>;
    
    private groupIndicesMap_ : Map<number, number>;

    private matchBuilder_ : MatchBuilder;
    private batchSize_ : number;
    private matchString_ : string;
    
    public isMatching ?: boolean;
    public response ?: MatchResponse;
    public abortResolve ?: (value?: unknown) => void
}

const matcher = new MatcherInternal();

const Matcher = {
    match(pid : number, matchString : string, batchSize: number = -1) : ReturnMatch | ReturnBatch | ReturnAborted | null
    {
        if(AST === undefined || NFA === undefined)
            return null;
        return matcher.match(pid, matchString, batchSize)
    },

    nextBatch(pid : number) : ReturnMatch | ReturnBatch | ReturnAborted | null
    {
        if(AST === undefined || NFA === undefined)
            return null;
        return matcher.match(pid);
    },

    newData(newData : NewData)
    {
        AST = newData.AST;
        NFA = newData.NFA;
        if(newData.flags !== undefined)
            flags = newData.flags;
    },

    newFlags(newFlags : MatchFlags | number)
    {
        this.flags = newFlags;
    },

    async abort()
    {
        matcher.response = MatchResponse.ABORTED;
        await new Promise(resolve => { 
            matcher.abortResolve = resolve; 
            setInterval(() => {
                if(!matcher.isMatching)
                {
                    matcher.abortResolve();
                }
            }, 1);
        });
    }
}

export type Matcher = typeof Matcher;
expose(Matcher);