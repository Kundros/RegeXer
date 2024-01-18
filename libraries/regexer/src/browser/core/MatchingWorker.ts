import { RegexTypes } from '@core/RegexParser';
import { Stack } from '@structures/Stack';
import { ASTGroup, ASTOption, NFAState, NFAStateList, NFAtype } from '@regexer/coreTypes/parserTypes';
import { MatchBuilder } from '@core/MatchBuilder';
import { MatchAction, MatchFlags } from '@regexer/coreTypes/MatchTypes';
import { MatchWorkerResultTypes, MessageWorkerRecieve, NewData, NewFlags, ReturnBatch, ReturnErrorMessage, ReturnMessage } from '@regexer/coreTypes/MatchWorkerTypes';

let AST: RegexTypes.ASTRoot;
let NFA: RegexTypes.NFAtype[];
let flags : number | MatchFlags | undefined;

type matchingState = {transition: number, state: RegexTypes.NFAtype};

class Matcher
{
    constructor() 
    {}

    public match(matchString : string, pid : number, batchSize: number = -1)
    {
        this.pid = pid;
        this.regexPosStack = new Stack<number>([0]);
        this.stringPosStack = new Stack<number>([0]);
        this.statesStack = new Stack<matchingState>();
        this.matchBuilder = new MatchBuilder(flags, batchSize);
        this.matchBuilder.matchData.start = 0;
        this.groups = new Stack<ASTGroup>();
        this.batchSize_ = batchSize;

        this.matchBuilder.addState({
            type: RegexTypes.RegexStates.ROOT,
            regAt: [0, 0],
            strAt: [0, 0]
        });


        while(true) 
        {
            const nfaState = NFA[this.regexPosStack.top()] as NFAtype;

            /* If we are at the last nfa node aka. END we're done matching */
            if(nfaState?.ASTelement?.type === RegexTypes.RegexStates.END)
                break;
            
            if(this.matchBuilder.isBatchReady())
                postMessage(<ReturnBatch>{ type: MatchWorkerResultTypes.BATCH, pid: this.pid, data: this.matchBuilder.getBatch() });

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
                if(!this.handleList(matchString)) return;
                continue;
            }
            else if((astState & RegexTypes.RegexStates.END_STRING) && this.stringPosStack.top() != matchString.length) 
            {
                if(!this.handleBacktracking(matchString)) return;
                continue;
            }
            else if((astState & RegexTypes.RegexStates.START_STRING) && this.stringPosStack.top() != 0) 
            {
                if(!this.handleBacktracking(matchString)) return;
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
                if(!this.handleBacktracking(matchString)) return;
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
                        regAt : [nfaState.ASTelement.start, nfaState.ASTelement.end]
                    });
                }

                continue;
            }

            /* we now try if we can transition into new state */
            if(matchString[this.stringPosStack.top()] === transition[0] && this.stringPosStack.top() < matchString.length)
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

        if(this.batchSize_ > 0)
            postMessage(<ReturnBatch>{ type: MatchWorkerResultTypes.BATCH, pid: this.pid, data: this.matchBuilder.getFinalBatch() });
        this.matchBuilder.success = true;
        postMessage(<ReturnMessage>{ type: MatchWorkerResultTypes.SUCCESS, pid: this.pid, data: this.matchBuilder.finalize() });
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
                regAt: [nfaState.ASTelement.start, nfaState.ASTelement.end]
            });

        if((flags & MatchFlags.OPTION_ENTERS_SHOW_ACTIVE))
        {
            const optionSelectedArr = currentOption.children[topState.transition];

            if(optionSelectedArr.length <= 0) return;

            this.matchBuilder.addState({
                type: nfaState.ASTelement.type, 
                regAt : [optionSelectedArr[0].start, optionSelectedArr[optionSelectedArr.length-1].end],
                action: MatchAction.SHOWCASE
            });
        }
    }

    private handleList(matchString : string)
    {
        const listState = this.statesStack.top().state as NFAStateList;

        if(this.stringPosStack.top() + 1 <= matchString.length && listState.transitions.has(matchString[this.stringPosStack.top()]))
        {
            this.regexPosStack.push(this.regexPosStack.top() + 1);
            this.stringPosStack.push(this.stringPosStack.top() + 1);
        }
        else
            return this.handleBacktracking(matchString);

        return true;
    }

    private handleBacktracking(matchString : string) : boolean
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
            if(this.stringPosStack.top() + 1 >= matchString.length)
            {
                delete this.matchBuilder.matchData.start;
                delete this.matchBuilder.matchData.end;

                this.matchBuilder.addState({
                    type: RegexTypes.RegexStates.ROOT,
                    regAt: [0, 0],
                    strAt: [matchString.length, matchString.length]
                });

                if(this.batchSize_ > 0)
                    postMessage(<ReturnBatch>{ type: MatchWorkerResultTypes.BATCH, pid: this.pid, data: this.matchBuilder.getFinalBatch() });
                postMessage(<ReturnMessage>{ type: MatchWorkerResultTypes.NO_MATCH, pid: this.pid, data: this.matchBuilder.finalize() });

                return false;
            }

            this.stringPosStack.push(this.stringPosStack.pop() + 1);
            this.regexPosStack.push(0);

            this.matchBuilder.matchData.start = this.stringPosStack.top();

            if(flags & MatchFlags.IGNORE_STR_START_POSITION_CHANGE || nfaState?.ASTelement?.type === undefined)
                return true;

            this.matchBuilder.addState({
                type: nfaState.ASTelement.type, 
                regAt: [0, 0],
                strAt: [this.matchBuilder.matchData.start ?? 0 ,this.stringPosStack.top()],
                action: MatchAction.FORWARD_START
            });

            return true;
        }

        this.stringPosStack.pop();

        if(nfaState?.ASTelement?.type === undefined)
            return true;

        this.matchBuilder.addState({
            type: nfaState.ASTelement.type, 
            regAt: [nfaState.ASTelement.start, nfaState.ASTelement.end],
            strAt: [this.matchBuilder.matchData.start ?? 0 ,this.stringPosStack.top()],
            action: MatchAction.BACKTRACKING
        });

        const optionElement = this.statesStack.top()?.state?.ASTelement;
        if(optionElement?.type === RegexTypes.RegexStates.OPTION)
            this.matchBuilder.updateOption(optionElement.start, optionElement.end);

        return true;
    }

    public pid : number;
    private stringPosStack : Stack<number>;
    private regexPosStack : Stack<number>;
    private statesStack : Stack<matchingState>;
    private matchBuilder : MatchBuilder;
    private groups : Stack<ASTGroup>;
    private batchSize_ : number;
}

const matcher = new Matcher();

onmessage = (event : MessageEvent) => {
    const message = event.data as MessageWorkerRecieve;
    switch(message.type)
    {
        case 'match':
        {
            if(typeof message.data !== "string")
            {
                postMessage(<ReturnErrorMessage>{type: MatchWorkerResultTypes.ERROR, pid: message.pid, data: "Unexpected error during matching."});
                return;
            }

            const matchString : string = message.data;

            try{
                matcher.match(matchString, message.pid, message.batchSize ?? -1);
            } 
            catch(e) {
                postMessage(<ReturnErrorMessage>{type: MatchWorkerResultTypes.ERROR, pid: message.pid, data: "Unexpected error during matching."});
            }

            break;
        }
        case 'new_data':
        {
            let newData = message.data as NewData;
            AST = newData?.AST;
            NFA = newData?.NFA;
            flags = newData?.flags

            break;
        }
        case 'new_flags':
        {
            let newData = message.data as NewFlags;
            flags = newData.flags

            break;
        }
    }
};


