import { RegexTypes } from '@core/RegexParser';
import { Stack } from '@structures/Stack';
import { NFAState, NFAStateList } from '@core/parserTypes';
import { MatchBuilder } from '@core/MatchBuilder';
import { MatchAction } from '@core/RegexMatch';

let AST: RegexTypes.ASTRoot;
let NFA: RegexTypes.NFAtype[];

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
            

            /* if the state is list we transition differently */
            if(this.statesStack.top().state?.ASTelement?.type & (RegexTypes.RegexStates.P_LIST | RegexTypes.RegexStates.N_LIST)) 
            {
                if(!this.handleList(matchString)) return;
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

        postMessage({ type: "succeded", pid: this.pid, data: this.matchBuilder.finalize() });
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

        if(this.statesStack.size() === 0)
        {
            /* no match from any position wasn't found */
            if(this.stringPosStack.top() + 1 >= matchString.length)
            {
                delete this.matchBuilder.matchData.start;
                delete this.matchBuilder.matchData.end;
                postMessage({ type: "failed", pid: this.pid, data: this.matchBuilder.finalize() });

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

onmessage = (message : unknown) => {
    const data = message as { type: string, pid: number, data: any };
    
    switch(data.type)
    {
        case 'init':
        {
            const initData = data.data as { AST: RegexTypes.ASTRoot, NFA: RegexTypes.NFAtype[] };
            AST = initData.AST;
            NFA = initData.NFA;

            break;
        }
        case 'match':
        {
            if(typeof data.data !== "string")
            {
                postMessage({type: "error", pid: data.pid, data: "Unexpected error during matching."});
                return;
            }

            const matchString : string = data.data;

            //try{
                matcher.match(matchString, data.pid);
            //} 
            //catch(e) {
            //    parentPort.postMessage({type: "error", data: "Unexpected error during matching."});
            //}

            break;
        }
    }
};
