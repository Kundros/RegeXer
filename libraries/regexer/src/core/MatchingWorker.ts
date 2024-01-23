import { expose } from 'threads/worker';
import { RegexTypes } from '@core/RegexParser';
import { Stack } from '@regexer/structures/Stack';
import { ASTGroup, ASTOption, NFAState, NFAStateList, NFAtype } from '../coreTypes/parserTypes';
import { MatchBuilder } from './MatchBuilder';
import { MatchResponse, NewData, ReturnAborted, ReturnBatch, ReturnMatch } from '../coreTypes/MatchWorkerTypes';
import { MatchAction, MatchFlags } from '@regexer/coreTypes/MatchTypes';

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
        if(matchString !== undefined)
        {
            this.pid = pid;
            this.regexPosStack = new Stack<number>([0]);
            this.stringPosStack = new Stack<number>([0]);
            this.statesStack = new Stack<matchingState>();
            this.matchBuilder = new MatchBuilder(flags, batchSize ?? -1);
            this.matchBuilder.matchData.start = 0;
            this.groups = new Stack<ASTGroup>();
            this.batchSize_ = batchSize ?? -1;
            this.matchString_ = matchString;
            this.isMatching = true;
            delete(this.response);

            this.matchBuilder.addState({
                type: RegexTypes.RegexStates.ROOT,
                regAt: [0, 0],
                strAt: [0, 0]
            });
        }

        if(this.pid !== pid)
            return null;

        if(this.response === MatchResponse.ABORTED)
        {
            this.isMatching = false;
            this.abortResolve();
            return <ReturnAborted>{ type: this.response, pid: this.pid, data: undefined };
        }
        else if(this.response !== undefined)
        {
            this.isMatching = false;
            if(this.response & MatchResponse.SUCCESS)
                this.matchBuilder.success = true;
            return <ReturnMatch>{ type: this.response, pid: this.pid, data: this.matchBuilder.finalize() };
        }


        while(true) 
        {
            const nfaState = NFA[this.regexPosStack.top()] as NFAtype;

            /* If we are at the last nfa node aka. END we're done matching */
            if(nfaState?.ASTelement?.type === RegexTypes.RegexStates.END)
                break;
            
            if(this.matchBuilder.isBatchReady())
                return <ReturnBatch>{ type: MatchResponse.BATCH, pid: this.pid, data: this.matchBuilder.getBatch() };

            /* 
                If the state isn't at the top of the stack we need to add it as new state
                    + we add starting transition position at 0
                otherwise we move transition position by 1
            */
            if(this.statesStack.top()?.state !== nfaState)
                this.statesStack.push({transition: 0, state: nfaState});
            else
                this.statesStack.top().transition++;
            

            const astState = this.statesStack.top().state?.ASTelement?.type;

            /* if the state is list we transition differently */
            if(astState & (RegexTypes.RegexStates.P_LIST | RegexTypes.RegexStates.N_LIST | RegexTypes.RegexStates.SPECIAL)) 
            {
                const returned = this.handleList();
                if(returned !== null) return returned;
                continue;
            }
            else if((astState & RegexTypes.RegexStates.END_STRING) && this.stringPosStack.top() != this.matchString_.length) 
            {
                const returned = this.handleBacktracking();
                if(returned !== null) return returned;
                continue;
            }
            else if((astState & RegexTypes.RegexStates.START_STRING) && this.stringPosStack.top() != 0) 
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
            if(transitions.length <= this.statesStack.top().transition)
            {
                const returned = this.handleBacktracking();
                if(returned !== null) return returned;
                continue;
            }

            /* --- ------------------- --- */
            /* --- applying transition --- */
            /* --- ------------------- --- */

            const transition = transitions[this.statesStack.top().transition];

            // handle null transition (without moving position in string)
            if(transition[0] === null)
            {
                this.regexPosStack.push(this.regexPosStack.top() + transition[1]);
                this.stringPosStack.push(this.stringPosStack.top());

                if(nfaState?.ASTelement?.type & RegexTypes.RegexStates.GROUP)
                    this.groups.push(<ASTGroup>nfaState?.ASTelement);


                let canAddToMatch = false;

                if((~flags & MatchFlags.IGNORE_OPTION_LEAVES) && (nfaState?.ASTelement?.type & RegexTypes.RegexStates.OPTION_END))
                    canAddToMatch = true;
                else if((~flags & MatchFlags.IGNORE_GROUP_ENTERS) && (nfaState?.ASTelement?.type & RegexTypes.RegexStates.GROUP))
                    canAddToMatch = true;
                else if((~flags & MatchFlags.IGNORE_GROUP_LEAVES) && (nfaState?.ASTelement?.type & RegexTypes.RegexStates.GROUP_END))
                    canAddToMatch = true;

                this.handleOptionTransitioning(nfaState);

                if(canAddToMatch)
                {
                    this.matchBuilder.addState({
                        type: nfaState.ASTelement.type, 
                        regAt : [nfaState.ASTelement.start, nfaState.ASTelement.end],
                        strAt: [this.matchBuilder.matchData.start ?? 0 ,this.stringPosStack.top()]
                    });
                }

                continue;
            }

            /* we now try if we can transition into new state */
            if(this.matchString_[this.stringPosStack.top()] === transition[0] && this.stringPosStack.top() < this.matchString_.length)
            {
                this.regexPosStack.push(this.regexPosStack.top() + transition[1]);
                this.stringPosStack.push(this.stringPosStack.top() + 1);

                this.matchBuilder.addState({ 
                    type: nfaState.ASTelement.type, 
                    regAt: [nfaState.ASTelement.start, nfaState.ASTelement.end], 
                    strAt: [this.matchBuilder.matchData.start ?? 0 ,this.stringPosStack.top()]
                });

                continue;
            }   
        }

        this.matchBuilder.matchData.end = this.stringPosStack.top();

        const regexEnd = (NFA[0] as NFAState)?.ASTelement?.end ?? 0;
        this.matchBuilder.addState({
            type: RegexTypes.RegexStates.ROOT,
            regAt: [regexEnd, regexEnd]
        });

        // send last batch
        if(this.batchSize_ > 0)
        {
            matcher.response = MatchResponse.SUCCESS; // save response
            return <ReturnBatch>{ type: MatchResponse.BATCH, pid: this.pid, data: this.matchBuilder.getFinalBatch() };
        }

        this.matchBuilder.success = true;
        this.isMatching = false;
        return <ReturnMatch>{ type: MatchResponse.SUCCESS, pid: this.pid, data: this.matchBuilder.finalize() };
    }

    private handleOptionTransitioning(nfaState : NFAtype)
    {
        const currentOption = nfaState?.ASTelement as ASTOption;
        const topState = this.statesStack.top();

        if(!(nfaState?.ASTelement?.type & RegexTypes.RegexStates.OPTION))
            return;

        if(topState?.state !== nfaState)
            return;

        if(topState.transition >= currentOption.children.length && topState.transition < 0)
            return;

        if((flags & MatchFlags.OPTION_SHOW_FIRST_ENTER) && this.statesStack.top()?.transition === 0)
            this.matchBuilder.addState({
                type: nfaState.ASTelement.type, 
                regAt: [nfaState.ASTelement.start, nfaState.ASTelement.end],
                strAt: [this.matchBuilder.matchData.start ?? 0 ,this.stringPosStack.top()]
            });

        if((flags & MatchFlags.OPTION_ENTERS_SHOW_ACTIVE))
        {
            const optionSelectedArr = currentOption.children[topState.transition];

            if(optionSelectedArr.length <= 0) return;

            this.matchBuilder.addState({
                type: nfaState.ASTelement.type, 
                regAt : [optionSelectedArr[0].start, optionSelectedArr[optionSelectedArr.length-1].end],
                strAt: [this.matchBuilder.matchData.start ?? 0 ,this.stringPosStack.top()],
                action: MatchAction.SHOWCASE
            });
        }
    }

    private handleList() : ReturnMatch | ReturnBatch | null
    {
        const listState = this.statesStack.top().state as NFAStateList;

        if(this.stringPosStack.top() + 1 <= this.matchString_.length && listState.transitions.has(this.matchString_[this.stringPosStack.top()]))
        {
            this.regexPosStack.push(this.regexPosStack.top() + 1);
            this.stringPosStack.push(this.stringPosStack.top() + 1);
        }
        else
            return this.handleBacktracking();

        return null;
    }

    private handleBacktracking() : ReturnMatch | ReturnBatch | null
    {
        const nfaState = NFA[this.regexPosStack.top()];
        this.statesStack.pop();
        this.regexPosStack.pop();

        /* If backtracking List or Special character has been processed thus we need to backtrack it too */
        while(this.statesStack.top()?.state?.ASTelement?.type & (RegexTypes.RegexStates.P_LIST | RegexTypes.RegexStates.N_LIST | RegexTypes.RegexStates.SPECIAL))
        {
            this.statesStack.pop();
            this.regexPosStack.pop();
        }

        if(this.statesStack.size() === 0)
        {
            /* match from any position wasn't found */
            if(this.stringPosStack.top() + 1 >= this.matchString_.length)
            {
                delete this.matchBuilder.matchData.start;
                delete this.matchBuilder.matchData.end;

                this.matchBuilder.addState({
                    type: RegexTypes.RegexStates.ROOT,
                    regAt: [0, 0],
                    strAt: [this.matchString_.length, this.matchString_.length]
                });

                // send last batch
                if(this.batchSize_ > 0)
                {
                    matcher.response = MatchResponse.NO_MATCH; // save response
                    return <ReturnBatch>{ type: MatchResponse.BATCH, pid: this.pid, data: this.matchBuilder.getFinalBatch() };
                }

                this.isMatching = false;
                return <ReturnMatch>{ type: MatchResponse.NO_MATCH, pid: this.pid, data: this.matchBuilder.finalize() };
            }

            this.stringPosStack.push(this.stringPosStack.pop() + 1);
            this.regexPosStack.push(0);

            this.matchBuilder.matchData.start = this.stringPosStack.top();

            if(flags & MatchFlags.IGNORE_STR_START_POSITION_CHANGE || nfaState?.ASTelement?.type === undefined)
                return null;

            this.matchBuilder.addState({
                type: nfaState.ASTelement.type, 
                regAt: [0, 0],
                strAt: [this.matchBuilder.matchData.start ?? 0 ,this.stringPosStack.top()],
                action: MatchAction.FORWARD_START
            });

            return null;
        }

        this.stringPosStack.pop();

        if(nfaState?.ASTelement?.type === undefined)
            return null;

        this.matchBuilder.addState({
            type: nfaState.ASTelement.type, 
            regAt: [nfaState.ASTelement.start, nfaState.ASTelement.end],
            strAt: [this.matchBuilder.matchData.start ?? 0 ,this.stringPosStack.top()],
            action: MatchAction.BACKTRACKING
        });

        const optionElement = this.statesStack.top()?.state?.ASTelement;
        if(optionElement?.type === RegexTypes.RegexStates.OPTION)
            this.matchBuilder.updateOption(optionElement.start, optionElement.end);

        return null;
    }

    public pid : number;
    private stringPosStack : Stack<number>;
    private regexPosStack : Stack<number>;
    private statesStack : Stack<matchingState>;
    private matchBuilder : MatchBuilder;
    private groups : Stack<ASTGroup>;
    private batchSize_ : number;
    
    public isMatching ?: boolean;
    public response ?: MatchResponse;
    public abortResolve ?: (value?: unknown) => void

    private matchString_ : string;
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