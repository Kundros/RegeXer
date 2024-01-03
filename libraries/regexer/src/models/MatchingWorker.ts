import { workerData, parentPort } from 'worker_threads';
import { RegexTypes } from '@models/RegexParser';
import { Stack } from '@regexer/structures/Stack';
import { NFAState, NFAStateList } from './parserTypes';
import { MatchBuilder } from './MatchBuilder';
import { MatchAction } from './RegexMatch';
import { MatchComplete, NewData, NewMessage, ReturnErrorMessage, ReturnMessage } from './MatchWorkerTypes';

let AST: RegexTypes.ASTRoot = workerData.AST;
let NFA: RegexTypes.NFAtype[] = workerData.NFA;

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
        this.matchBuilder = new MatchBuilder();
        this.matchBuilder.matchData.start = 0;

        while(true) 
        {
            const nfaState = NFA[this.regexPosStack.top()] as NFAState;

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

            /*
                If we have no more transitions left, we backtrack
                + if we tried all paths and failed exit matching and send error message
            */  
            const transitions = nfaState.transitions;
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

                if(nfaState?.ASTelement?.type & RegexTypes.RegexStates.OPTION_END)
                {
                    this.matchBuilder.addState({
                        type: nfaState.ASTelement.type, 
                        regAt: [nfaState.ASTelement.start, nfaState.ASTelement.end]
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

        parentPort.postMessage(<ReturnMessage>{ type: "succeded", pid: this.pid, data: [this.matchBuilder.finalize()] });
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

            if(nfaState?.ASTelement?.type !== undefined && this.statesStack.top()?.state?.ASTelement?.type & ~RegexTypes.RegexStates.OPTION)
            {
                this.matchBuilder.addState({
                    type: nfaState.ASTelement.type, 
                    regAt: [nfaState.ASTelement.start, nfaState.ASTelement.end],
                    action: MatchAction.BACKTRACKING
                });
            }

            return true;
        }

        this.stringPosStack.pop();

        if(nfaState?.ASTelement?.type !== undefined && this.statesStack.top()?.state?.ASTelement?.type !== RegexTypes.RegexStates.OPTION)
        {
            this.matchBuilder.addState({
                type: nfaState.ASTelement.type, 
                regAt: [nfaState.ASTelement.start, nfaState.ASTelement.end],
                action: MatchAction.BACKTRACKING
            });
        }

        return true;
    }

    private pid : number;
    private stringPosStack : Stack<number>;
    private regexPosStack : Stack<number>;
    private statesStack : Stack<matchingState>;
    private matchBuilder : MatchBuilder;
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

            break;
        }
    }
});