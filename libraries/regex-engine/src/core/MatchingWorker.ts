import { MatchBuilder } from './MatchBuilder';
import { Stack } from '@structures/Stack';

import { 
    ASTGroup, 
    ASTIteration, 
    ASTOption, 
    NFAState, 
    NFAStateList, 
    NFAtype, 
    ASTRoot, 
    RegexStates,
    NFATransition
} from '@coreTypes/parserTypes';

import { NewData, ReturnAborted, ReturnBatch, ReturnMatch } from '@coreTypes/MatchWorkerTypes';
import { MatchAction, MatchFlags, MatchGroup, MatchResponse } from '@coreTypes/MatchTypes';

import { expose } from 'threads/worker';

let AST: ASTRoot;
let NFA: NFAtype[];
let flags : number | MatchFlags = MatchFlags.NONE;

type matchingState = {transition: number, state: NFAtype};
type iterationState = [ASTIteration, number, number];

/*
    This file is worker for matching regular expressions and creating states output structure
    Notes:
        - Some variables that can contain number | undefined | null are type asserted to number, because some operations against them are resulting correct output
*/  

class MatcherInternal
{
    /** 
     * @description compute whole match or match in batches
     * @returns {ReturnMatch | ReturnBatch | ReturnAborted | null} structure containing whole match history or just batch of data or aborted information or null
     */
    public match(pid : number, matchString? : string, batchSize?: number) : ReturnMatch | ReturnBatch | ReturnAborted | null
    {
        // init data
        if(matchString !== undefined)
        {
            this.pid_ = pid;

            this.regexPosStack_ = new Stack([0]);
            this.stringPosStack_ = new Stack([0]);
            this.iterationCurrentStack_ = new Stack();
            this.statesStack_ = new Stack();
            this.iterationHistoryStack_ = new Stack();
            this.groupCurrentStack_ = new Stack();
            this.groupHistoryStack_ = new Stack();
            this.newestGroupsMapStack_ = new Map();

            this.matchBuilder_ = new MatchBuilder(flags, batchSize ?? -1);
            this.matchBuilder_.matchData.start = 0;
            this.batchSize_ = batchSize ?? -1;
            this.matchString_ = matchString;
            this.isMatching = true;
            delete(this.response);

            this.matchBuilder_.addState({
                type: RegexStates.ROOT,
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
            if(this.abortResolve)
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
            const nfaState = NFA[<number>this.regexPosStack_.top()] as NFAtype;

            if(nfaState === undefined)
                return <ReturnMatch>{ type: MatchResponse.ERROR, pid: this.pid_, data: [] };

            /* If we are at the last nfa node aka. END we're done matching */
            if(nfaState?.ASTelement?.type === RegexStates.END)
                break;
            
            /* If the batch size is filled, we can return current batch */
            if(this.matchBuilder_.isBatchReady())
                return <ReturnBatch>{ type: MatchResponse.BATCH, pid: this.pid_, data: this.matchBuilder_.getBatch() };

            /* 
                If the state isn't at the top of the stack we need to add it as new state
                    + we add starting transition position at 0
                otherwise we move transition position by 1
            */
            const topState = this.statesStack_.top();
            if(topState?.state !== nfaState)
                this.statesStack_.push({transition: 0, state: nfaState});
            else
                topState.transition++;
            

            const ASTtype = nfaState?.ASTelement?.type ?? 0;

            /* if the state has set transition, we handle it differently */
            if(ASTtype & (
                RegexStates.P_LIST | 
                RegexStates.N_LIST | 
                RegexStates.SPECIAL | 
                RegexStates.ANY
            )) 
            {
                const returned = this.handleSetTransition();
                if(returned !== null) return returned;
                continue;
            }
            /* Handle $ or End of String that is matched (must be end string) */
            else if((ASTtype & RegexStates.END_STRING) && this.stringPosStack_.top() != this.matchString_.length) 
            {
                const returned = this.handleBacktracking();
                if(returned !== null) return returned;
                continue;
            }
            /* Handle ^ or Start of String that is matched (must be start string) */
            else if((ASTtype & RegexStates.START_STRING) && this.stringPosStack_.top() != 0) 
            {
                const returned = this.handleBacktracking();
                if(returned !== null) return returned;
                continue;
            }

            // we already handeled Set and it shouldn't be set here, but just to be sure
            if(nfaState.transitions instanceof Set) 
                continue;

            /*
                If we have no more transitions left, we backtrack
                + if we tried all paths and failed exit matching and send error message
            */ 
            const transitions = (nfaState as NFAState).transitions;
            if(transitions.length <= <number>this.statesStack_.top()?.transition)
            {
                const returned = this.handleBacktracking();
                if(returned !== null) return returned;
                continue;
            }

            /* --- ------------------- --- */
            /* --- applying transition --- */
            /* --- ------------------- --- */

            let transition = transitions[<number>this.statesStack_.top()?.transition];

            // handle null transition (without moving position in string)
            if(transition[0] === null)
            {
                if(ASTtype & (RegexStates.ITERATION_ONE | RegexStates.ITERATION_ZERO | RegexStates.ITERATION_RANGE | RegexStates.ITERATION_END))
                {
                    const returnedIteration = this.handleIteration(nfaState, transitions);

                    if(typeof returnedIteration !== "boolean")
                        return returnedIteration;
                    else if(!returnedIteration)
                        continue;
                    
                    // update transition if was changed
                    transition = transitions[<number>this.statesStack_.top()?.transition];
                }

                // handle group
                this.handleGroup(nfaState, false);
                // handle option
                this.handleOptionTransitioning(nfaState);

                if(this.regexPosStack_.top() === undefined || this.stringPosStack_.top() === undefined)
                    return <ReturnMatch>{ type: MatchResponse.ERROR, pid: this.pid_, data: [] };

                this.regexPosStack_.push(<number>this.regexPosStack_.top() + transition[1]);
                this.stringPosStack_.push(<number>this.stringPosStack_.top());

                let canAddToMatch = false;

                // handle different flags to mutate the final match structure data
                if((~flags & MatchFlags.IGNORE_OPTION_LEAVES) && (ASTtype & RegexStates.OPTION_END))
                    canAddToMatch = true;
                else if((~flags & MatchFlags.IGNORE_GROUP_ENTERS) && (ASTtype & RegexStates.GROUP))
                    canAddToMatch = true;
                else if((~flags & MatchFlags.IGNORE_GROUP_LEAVES) && (ASTtype & RegexStates.GROUP_END))
                    canAddToMatch = true;

                if(canAddToMatch && nfaState?.ASTelement)
                {
                    this.matchBuilder_.addState({
                        type: nfaState.ASTelement.type, 
                        regAt : [nfaState.ASTelement.start, nfaState.ASTelement.end],
                        strAt: [this.matchBuilder_.matchData.start ?? 0 ,this.stringPosStack_.top() ?? 0]
                    });
                    this.matchBuilder_.newGroups(this.getGroups());
                }

                continue;
            }

            /* we now try if we can transition into new state */
            let currentStringPos = <number>this.stringPosStack_.top();
            if(this.matchString_[currentStringPos] === transition[0] && currentStringPos < this.matchString_.length)
            {
                if(this.regexPosStack_.top() === undefined || this.stringPosStack_.top() === undefined)
                    return <ReturnMatch>{ type: MatchResponse.ERROR, pid: this.pid_, data: [] };

                this.regexPosStack_.push(<number>this.regexPosStack_.top() + transition[1]);
                this.stringPosStack_.push(currentStringPos + 1);
                currentStringPos = <number>this.stringPosStack_.top();

                if(nfaState.ASTelement)
                {
                    this.matchBuilder_.addState({ 
                        type: nfaState.ASTelement.type, 
                        regAt: [nfaState.ASTelement.start, nfaState.ASTelement.end], 
                        strAt: [this.matchBuilder_.matchData.start ?? 0 ,currentStringPos]
                    });
                    this.matchBuilder_.newGroups(this.getGroups());
                }

                continue;
            }   
        }

        this.matchBuilder_.matchData.end = this.stringPosStack_.top();

        const regexEnd = (NFA[0] as NFAState)?.ASTelement?.end ?? 0;
        this.matchBuilder_.addState({
            type: RegexStates.ROOT,
            regAt: [regexEnd, regexEnd],
            strAt: [this.matchBuilder_.matchData.start ?? 0, this.matchBuilder_.matchData.end ?? 0],
        });
        this.matchBuilder_.newGroups(this.getGroups());

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

    /**
     * @description handle and process iteration related stuff
     * @returns {(boolean|ReturnBatch|ReturnMatch)} 
     * Match/Batch - when data is ready. \
     * false - can't continue in current loop (should invoke 'continue') \
     * true - can continue in current loop
     */
    private handleIteration(nfaState : NFAtype, transitions : NFATransition[]) : boolean | ReturnBatch | ReturnMatch
    {
        const topState = <matchingState>this.statesStack_.top();
        let transition = transitions[topState?.transition];
        const ASTtype = nfaState?.ASTelement?.type ?? 0;

        // if the transition is end of iteration we check if we have moved in string since last iteration
        if(ASTtype & RegexStates.ITERATION_END)
        {
            const currentPosition = this.stringPosStack_.top() ?? 0;
            const currentIteration = this.iterationCurrentStack_.top();

            if(!currentIteration)
            {
                return <ReturnMatch>{ type: MatchResponse.ERROR, pid: this.pid_, data: [] };
            }

            // if we didn't move then proceed to first positive transition (move out of iteration)
            if(currentIteration[2] === currentPosition)
            {
                const positive = transitions[0][1] > 0 ? 0 : 1;
                topState.transition = positive;
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

                if (currentIteration[1] + 1 >= <number>currentIteration[0].range[1])
                    return false;
                currentIteration[1]++;
            }
            else 
            {
                if ((currentIteration[0].type & RegexStates.ITERATION_RANGE) && (currentIteration[1] + 1 < currentIteration[0].range[0] || currentIteration[1] + 1 > <number>currentIteration[0].range[1])) 
                {
                    const returned = this.handleBacktracking();
                    if (returned !== null)
                        return returned;
                    return false;
                }
                currentIteration[1]++;
                this.iterationHistoryStack_.push(<iterationState>this.iterationCurrentStack_.pop());
            }
            
            return true;
        }

        /* 
         if the transition is iteration then: 
          1. if iteration is forwarding to first state of iteration: current push new record
          2. if iteration is forwarding to first state after iteration and check if range is from zero: history push new record
        */

        if(transition[1] === 1) // 1
        {
            this.iterationCurrentStack_.push([<ASTIteration>nfaState?.ASTelement, 0, this.stringPosStack_.top() ?? 0]);
        }
        else // 2
        {
            if ((ASTtype & RegexStates.ITERATION_RANGE) && (<ASTIteration>nfaState?.ASTelement)?.range[0] > 0) 
            {
                return false;
            }
            this.iterationHistoryStack_.push([<ASTIteration>nfaState?.ASTelement, 0, this.stringPosStack_.top() ?? 0]);
        }
    
        return true;
    }

    /** @description handle and process group related stuff */
    private handleGroup(nfaState : NFAtype, backtracking : boolean)
    {
        const ASTtype = nfaState?.ASTelement?.type ?? 0;
        const stringPosition = this.stringPosStack_.top() ?? 0;

        /*
         we follow these rules:
          1. if the state is 'group start' we save position in nfa and starting position in string
          2. if the state is 'group end' we pop the group info to history and update end position (we also add it to newest groups map for match structure)
          3. if the state is backtracked to 'group start' we pop the group from current stack (it was fully explored)
          4. if the state is backtracked to 'group end' we pop the group from history back to current stack (now isn't finished yet, but can be by different path)
                - we also pop the group from newest groups map
        */
        if(!backtracking)
        {
            if(ASTtype & RegexStates.GROUP) // 1
            {
                const regAt = this.regexPosStack_.top() ?? 0;

                this.groupCurrentStack_.push([regAt, stringPosition, null]);

                const topGroupNFACurrent = NFA[regAt];
                const topGroupASTCurrent = <ASTGroup>topGroupNFACurrent.ASTelement;

                // add nulls to positions inside current group to prevent keeping capture
                for (const groupStack of this.newestGroupsMapStack_) {
                    if(groupStack[0] === regAt)
                        continue;
                    const topGroupInfo = groupStack[1].top();

                    if (!topGroupInfo)
                        continue;

                    const topGroupNFA = NFA[groupStack[0]];
                    const topGroupAST = <ASTGroup>topGroupNFA?.ASTelement;

                    if (topGroupASTCurrent.start < topGroupAST.start && topGroupASTCurrent.end > topGroupAST.end && topGroupAST?.index !== null)
                        this.newestGroupsMapStack_.get(groupStack[0])?.push([null, topGroupAST.start, topGroupAST.end]);
                }
            }
            else if(ASTtype & RegexStates.GROUP_END) // 2
            {
                const popped = this.groupCurrentStack_.pop();

                if(!popped)
                    return;

                popped[2] = this.stringPosStack_.top() ?? 0;

                this.groupHistoryStack_.push(<[number, number, number]>popped);

                if(!this.newestGroupsMapStack_.has(popped[0]))
                    this.newestGroupsMapStack_.set(popped[0], new Stack());

                this.newestGroupsMapStack_.get(popped[0])?.push([popped[1], popped[2]]);
            }
        }
        else
        {
            if(ASTtype & RegexStates.GROUP) // 3
            {
                const popped = this.groupCurrentStack_.pop();

                if(!popped)
                    return;

                const topGroupNFA = NFA[popped[0]];
                const topGroupAST = topGroupNFA?.ASTelement;

                // pop nulls from the groups that are surrounded by this group
                for (const groupStack of this.newestGroupsMapStack_) {
                    if (popped[0] === groupStack[0])
                        continue;

                    const topGroupInfo = groupStack[1].top();

                    if (!topGroupInfo || topGroupInfo[0] !== null)
                        continue;

                    if (<number>topGroupAST?.start < topGroupInfo[1] && <number>topGroupAST?.end > topGroupInfo[2])
                        this.newestGroupsMapStack_.get(groupStack[0])?.pop();
                }
            }
            else if(ASTtype & RegexStates.GROUP_END) // 4
            {
                const popped = this.groupHistoryStack_.pop();

                if(!popped)
                    return;

                this.groupCurrentStack_.push(popped);
                this.newestGroupsMapStack_.get(popped[0])?.pop();
            }
        }
    }

    /**
     * @returns {Map<number, MatchGroup>} All current existing groups
     */
    private getGroups() : Map<number, MatchGroup>
    {
        const groupsMap = new Map<number, MatchGroup>();
        for(const groupStack of this.newestGroupsMapStack_)
        {
            const topGroupInfo = groupStack[1].top();

            if(!topGroupInfo || topGroupInfo[0] === null)
                continue;

            const topGroupNFA = NFA[groupStack[0]];
            const topGroupAST = <ASTGroup>topGroupNFA?.ASTelement;

            if((groupStack[0] + (topGroupAST.endNFA ?? 0)) < <number>this.regexPosStack_.top() && topGroupAST.index !== null)
                groupsMap.set(topGroupAST.index, {
                    name: topGroupAST.name,
                    regAt: [topGroupAST.start, topGroupAST.end],
                    strAt: [topGroupInfo[0], topGroupInfo[1]]
                });
        }

        return groupsMap;
    }

    /** @description handle and process option transitioning related stuff */
    private handleOptionTransitioning(nfaState : NFAtype)
    {
        const currentOption = nfaState?.ASTelement as ASTOption;
        const topState = this.statesStack_.top();
        const ASTtype = nfaState?.ASTelement?.type ?? 0;

        if(!(ASTtype & RegexStates.OPTION))
            return;

        if(topState?.state !== nfaState)
            return;

        if(topState.transition >= currentOption.children.length && topState.transition < 0)
            return;

        if((flags & MatchFlags.OPTION_SHOW_FIRST_ENTER) && this.statesStack_.top()?.transition === 0)
        {
            this.matchBuilder_.addState({
                type: ASTtype, 
                regAt: [currentOption.start, currentOption.end],
                strAt: [this.matchBuilder_.matchData.start ?? 0, this.stringPosStack_.top() ?? 0]
            });
            this.matchBuilder_.newGroups(this.getGroups());
        }

        if((flags & MatchFlags.OPTION_ENTERS_SHOW_ACTIVE))
        {
            const optionSelectedArr = currentOption.children[topState.transition];

            if(optionSelectedArr.length <= 0) return;

            this.matchBuilder_.addState({
                type: ASTtype, 
                regAt : [optionSelectedArr[0].start, optionSelectedArr[optionSelectedArr.length-1].end],
                strAt: [this.matchBuilder_.matchData.start ?? 0 ,this.stringPosStack_.top() ?? 0],
                action: MatchAction.SHOWCASE
            });
            this.matchBuilder_.newGroups(this.getGroups());
        }
    }

    /** @description handle and process different type of transition - Set() */
    private handleSetTransition() : ReturnMatch | ReturnBatch | null
    {
        const listState = this.statesStack_.top()?.state as NFAStateList;
        const stringPosition = this.stringPosStack_.top() ?? 0;

        if(stringPosition + 1 <= this.matchString_.length && listState.transitions.has(this.matchString_[stringPosition]))
        {
            this.regexPosStack_.push(<number>this.regexPosStack_.top() + 1);
            this.stringPosStack_.push(stringPosition + 1);

            const currentStringPos = <number>this.stringPosStack_.top();

            if(listState.ASTelement)
            {
                this.matchBuilder_.addState({ 
                    type: listState.ASTelement.type, 
                    regAt: [listState.ASTelement.start, listState.ASTelement.end], 
                    strAt: [this.matchBuilder_.matchData.start ?? 0 , currentStringPos]
                });
                this.matchBuilder_.newGroups(this.getGroups());
            }
        }
        else
            return this.handleBacktracking();

        return null;
    }

    /** @description handle and process backtracking related stuff */
    private handleBacktracking() : ReturnMatch | ReturnBatch | null
    {
        let lastRegexPos = this.regexPosStack_.pop();
        this.statesStack_.pop();

        const nfaState = NFA[<number>lastRegexPos];

        /* 
          If backtracking List or Special character has been processed thus we need to backtrack it too 
          Explanation: 
            Types in below loop are all containing set transition, which have no transition position,
            that means it has to be backtracked beforehand, to ensure correct evaluation 
        */
        while(<number>this.statesStack_.top()?.state?.ASTelement?.type & (
            RegexStates.P_LIST | 
            RegexStates.N_LIST | 
            RegexStates.SPECIAL | 
            RegexStates.ANY
        ))
        {
            lastRegexPos = this.regexPosStack_.pop();
            this.statesStack_.pop();
            this.stringPosStack_.pop();
        }

        let currentTopRegPos = <number>this.regexPosStack_.top();
        let currentStringPos = <number>this.stringPosStack_.top();

        const currentNfaState = NFA[currentTopRegPos];
        const currentASTtype = currentNfaState?.ASTelement?.type ?? 0;

        /*
         Backtracking iteration in 4 different ways:
          1. backtracking from first state after iteration 'end' to iteration 'end': current push history pop - 1 (decrease one successful iteration)
          2. backtracking from first state after iteration 'start' to iteration 'end': current top - 1 (decrease one successful iteration)
          3. backtracking from first state after iteration 'end' to iteration 'start': pop history
          4. backtracking from first state after iteration 'start' to iteration 'start': pop current
        */
        if(currentASTtype & RegexStates.ITERATION_END)
        {
            if (<number>lastRegexPos > currentTopRegPos)
                this.iterationCurrentStack_.push(<iterationState>this.iterationHistoryStack_.pop()); // 1
            
            (<iterationState>this.iterationCurrentStack_.top())[1]--; // 1, 2
        }
        else if(currentASTtype & (RegexStates.ITERATION_ONE | RegexStates.ITERATION_ZERO | RegexStates.ITERATION_RANGE))
        {
            if(<number>lastRegexPos - currentTopRegPos > 1)
                this.iterationHistoryStack_.pop(); // 3
            else
                this.iterationCurrentStack_.pop(); // 4
        } 

        // handle group stact
        this.handleGroup(nfaState, true);

        // Handle when all paths from current starting position were searched, and proceed to next position
        if(this.statesStack_.size() === 0)
        {
            /* match from any position wasn't found */
            if(currentStringPos + 1 >= this.matchString_.length)
            {
                delete this.matchBuilder_.matchData.start;
                delete this.matchBuilder_.matchData.end;

                this.matchBuilder_.addState({
                    type: RegexStates.ROOT,
                    regAt: [NFA[0]?.ASTelement?.end ?? 0, NFA[0]?.ASTelement?.end ?? 0],
                    strAt: [this.matchString_.length, this.matchString_.length]
                });
                this.matchBuilder_.newGroups(this.getGroups());

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
            this.stringPosStack_.push(currentStringPos + 1);
            currentStringPos = currentStringPos + 1;
            this.regexPosStack_.push(0);
            currentTopRegPos = 0;

            this.matchBuilder_.matchData.start = this.stringPosStack_.top();

            if(flags & MatchFlags.IGNORE_STR_START_POSITION_CHANGE || nfaState?.ASTelement?.type === undefined)
                return null;

            this.matchBuilder_.addState({
                type: nfaState.ASTelement.type, 
                regAt: [0, 0],
                strAt: [this.matchBuilder_.matchData.start ?? 0 ,currentStringPos],
                action: MatchAction.FORWARD_START
            });
            this.matchBuilder_.newGroups(this.getGroups());

            return null;
        }

        this.stringPosStack_.pop();

        if(nfaState?.ASTelement?.type === undefined)
            return null;

        this.matchBuilder_.addState({
            type: nfaState.ASTelement.type, 
            regAt: [nfaState.ASTelement.start, nfaState.ASTelement.end],
            strAt: [this.matchBuilder_.matchData.start ?? 0 ,<number>this.stringPosStack_.top()],
            action: MatchAction.BACKTRACKING
        });
        this.matchBuilder_.newGroups(this.getGroups());

        const optionElement = this.statesStack_.top()?.state?.ASTelement;
        if(optionElement?.type === RegexStates.OPTION)
            this.matchBuilder_.updateOption(optionElement.start);

        return null;
    }

    public pid_! : number;

    /* ----- Stacks for information for matching ----- */
    private stringPosStack_! : Stack<number>; // holds information about all positions in matching string (history)
    private regexPosStack_! : Stack<number>; // holds information about all positions in regex (history)
    private iterationCurrentStack_! : Stack<iterationState>; // holds information about current active iterations (non-completed loop): [which iterator it is in ast, current iteration count, last position in string]
    private iterationHistoryStack_! : Stack<iterationState>; // holds information about history of iteration for backtracking: same data as current iterations
    private statesStack_! : Stack<matchingState>; // holds information about states from NFA
    private groupCurrentStack_! : Stack<[number, number, number | null]>; // holds information about [nfa position, str start, str end]
    private groupHistoryStack_! : Stack<[number, number, number]>; // same as above except str end can be null
    private newestGroupsMapStack_! : Map<number, Stack<[number, number] | [null, number, number]>>; // history of all groups in map (to easily retrieve current groups): Map<nfa position, Stack<[str start, str end]>>

    private matchBuilder_! : MatchBuilder;
    private batchSize_! : number;
    private matchString_! : string;
    
    public isMatching ?: boolean;
    public response ?: MatchResponse;
    public abortResolve ?: (value?: unknown) => void
}

const matcher = new MatcherInternal();

/* ----- Visible interface from this worker file ----- */
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
        flags = newFlags;
    },

    async abort()
    {
        matcher.response = MatchResponse.ABORTED;
        await new Promise(resolve => { 
            matcher.abortResolve = resolve; 
            const interval = setInterval(() => {
                if(!matcher.isMatching)
                {
                    if(matcher.abortResolve)
                        matcher.abortResolve();
                    clearInterval(interval);
                }
            }, 1);
        });
    }
}

export type Matcher = typeof Matcher;
expose(Matcher);