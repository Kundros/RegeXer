import { workerData, parentPort } from 'worker_threads';
import { RegexTypes } from '@core/RegexParser';
import { Stack } from '@regexer/structures/Stack';
import { ASTGroup, ASTOption, ASTtype, NFAState, NFAStateList, NFAtype, RegexStates } from '../coreTypes/parserTypes';
import { MatchBuilder } from './MatchBuilder';
import { MatchAction, MatchFlags } from './RegexMatch';
import { NewData, NewFlags, NewMessage, ReturnErrorMessage, ReturnMessage } from '../coreTypes/MatchWorkerTypes';

let AST: RegexTypes.ASTRoot = workerData.AST;
let NFA: RegexTypes.NFAtype[] = workerData.NFA;
let flags : number | MatchFlags | undefined = workerData?.flags;

type matchingState = {transition: number, state: RegexTypes.NFAtype};

class Matcher
{
    constructor() 
    {}

    public match(matchString : string, pid : number)
    {
        this.pid = pid;
        this.regexPosStack = new Stack<number>([0]);
        this.stringPosStack = new Stack<number>([0]);
        this.statesStack = new Stack<matchingState>();
        this.matchBuilder = new MatchBuilder(flags);
        this.matchBuilder.matchData.start = 0;
        this.groups = new Stack<ASTGroup>();

        while(true) 
        {
            const nfaState = NFA[this.regexPosStack.top()] as NFAtype;

            /* If we are at the last nfa node aka. END we're done matching */
            if(nfaState?.ASTelement?.type === RegexTypes.RegexStates.END)
                break;
            

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

                if((~flags & MatchFlags.IGNORE_OPTION_ENTERS) && (nfaState?.ASTelement?.type & RegexTypes.RegexStates.OPTION))
                    canAddToMatch = true;
                if((~flags & MatchFlags.IGNORE_OPTION_LEAVES) && (nfaState?.ASTelement?.type & RegexTypes.RegexStates.OPTION_END))
                    canAddToMatch = true;
                else if((~flags & MatchFlags.IGNORE_GROUP_ENTERS) && (nfaState?.ASTelement?.type & RegexTypes.RegexStates.GROUP))
                    canAddToMatch = true;
                else if((~flags & MatchFlags.IGNORE_GROUP_LEAVES) && (nfaState?.ASTelement?.type & RegexTypes.RegexStates.GROUP_END))
                    canAddToMatch = true;

                let regAt : [number, number] = [nfaState.ASTelement.start, nfaState.ASTelement.end];

                if((flags & MatchFlags.OPTION_ENTERS_SHOW_ACTIVE) && (nfaState?.ASTelement?.type & RegexTypes.RegexStates.OPTION))
                {
                    const span = this.handleSingleOptionSpan(nfaState);
                    if(span != null)
                    {
                        if((flags & MatchFlags.OPTION_SHOW_FIRST_ENTER) && this.statesStack.top()?.transition === 0)
                            this.matchBuilder.addState({
                                type: nfaState.ASTelement.type, 
                                regAt
                            });
                        regAt = span;
                    }
                }

                if(canAddToMatch)
                {
                    this.matchBuilder.addState({
                        type: nfaState.ASTelement.type, 
                        regAt
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

        parentPort.postMessage(<ReturnMessage>{ type: "succeded", pid: this.pid, data: [this.matchBuilder.finalize((NFA[0] as NFAState)?.ASTelement?.end ?? 0)] });
    }

    private handleSingleOptionSpan(nfaState : NFAtype) : null | [number, number]
    {
        const currentOption = nfaState?.ASTelement as ASTOption;
        const topState = this.statesStack.top();

        if(topState?.state !== nfaState)
            return null;

        if(topState.transition >= currentOption.children.length && topState.transition < 0)
            return null;

        const optionSelectedArr = currentOption.children[topState.transition];

        if(optionSelectedArr.length <= 0)
            return null;

        return [optionSelectedArr[0].start, optionSelectedArr[optionSelectedArr.length-1].end];
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
                parentPort.postMessage(<ReturnMessage>{ type: "failed", pid: this.pid, data: [this.matchBuilder.finalize()] });

                return false;
            }

            this.stringPosStack.push(this.stringPosStack.pop() + 1);
            this.regexPosStack.push(0);

            this.matchBuilder.matchData.start = this.stringPosStack.top();

            if(flags & MatchFlags.IGNORE_STR_START_POSITION_CHANGE || nfaState?.ASTelement?.type === undefined || nfaState?.ASTelement?.type & RegexTypes.RegexStates.OPTION)
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

        if(nfaState?.ASTelement?.type === undefined || nfaState?.ASTelement?.type & RegexTypes.RegexStates.OPTION)
            return true;

        this.matchBuilder.addState({
            type: nfaState.ASTelement.type, 
            regAt: [nfaState.ASTelement.start, nfaState.ASTelement.end],
            strAt: [this.matchBuilder.matchData.start ?? 0 ,this.stringPosStack.top()],
            action: MatchAction.BACKTRACKING
        });

        return true;
    }

    private pid : number;
    private stringPosStack : Stack<number>;
    private regexPosStack : Stack<number>;
    private statesStack : Stack<matchingState>;
    private matchBuilder : MatchBuilder;
    private groups : Stack<ASTGroup>;
}

const matcher = new Matcher();

parentPort.on("message", (message : NewMessage) => {
    switch(message.type)
    {
        case 'match':
        {
            if(typeof message.data !== "string")
            {
                parentPort.postMessage(<ReturnErrorMessage>{type: "error", pid: message.pid, data: "Unexpected error during matching."});
                return;
            }

            const matchString : string = message.data;

            try{
                matcher.match(matchString, message.pid);
            } 
            catch(e) {
                parentPort.postMessage(<ReturnErrorMessage>{type: "error", pid: message.pid, data: "Unexpected error during matching."});
            }

            break;
        }
        case 'new_data':
        {
            let newData = message.data as NewData;
            AST = newData.AST;
            NFA = newData.NFA;
            flags = newData.flags

            break;
        }
        case 'new_flags':
        {
            let newData = message.data as NewFlags;
            flags = newData.flags

            break;
        }
    }
});