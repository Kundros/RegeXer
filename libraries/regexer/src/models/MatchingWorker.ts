import { workerData, parentPort } from 'worker_threads';
import { RegexTypes } from './regexParser';
import { Stack } from '@regexer/structures/Stack';
import { RegexMatch } from './RegexMatch';

const AST: RegexTypes.ASTRoot = workerData.AST;
const NFA: RegexTypes.NFAState[] = workerData.NFA;

parentPort.on("message", (message : { type: string, data: any }) => {
    switch(message.type)
    {
        case 'match':
        {
            if(typeof message.data !== "string") return;
            const matchString : string = message.data;

            try{
                match(matchString);
            } 
            catch(e) {
                parentPort.postMessage({type: "error", data: "Unable to match string."});
            }

            break;
        }
    }
});

function match(matchString) : void
{
    let stringPosStack = new Stack<number>([0]);
    let regexPosStack = new Stack<number>([0]);
    let transitionsPosStack = new Stack<number>();
    let statesStack = new Stack<RegexTypes.NFAState>();


    while(true) {
        const nfaState = NFA[regexPosStack.top()];

        /* If we are at the last nfa node aka. END we're done matching */
        if(nfaState?.ASTelement?.type === RegexTypes.RegexStates.END)
            break;

        const transitions = nfaState.transitions;

        /* 
            If the state isn't at the top of the stack we need to add it as new state
            + we add starting transition position at 0
            otherwise we move transition position by 1
         */
        if(statesStack.top() !== nfaState)
        {
            statesStack.push(nfaState);
            transitionsPosStack.push(0);
        }
        else
        {
            transitionsPosStack.push(transitionsPosStack.pop() + 1);
        }

        /*
            If we have no more transitions left, we backtrack
            + if we tried all paths and failed exit matching and send error message
        */
        if(transitions.length <= transitionsPosStack.top())
        {
            transitionsPosStack.pop();
            statesStack.pop();
            regexPosStack.pop();

            /* no more left paths */
            if(transitionsPosStack.size() === 0)
            {
                parentPort.postMessage({type: "error", data: "Unable to match string."});
                return;
            }
            
            continue; // backtracking
        }

        /*
            If we're at the end of the matching string, without successful match
            we need to backtrack (aka pop all stacks)
        */
        if(stringPosStack.top() >= matchString.length)
        {
            stringPosStack.pop();
            transitionsPosStack.pop();
            statesStack.pop();
            regexPosStack.pop();
            continue; // backtracking
        }
        /* --- ------------------- --- */
        /* --- applying transition --- */
        /* --- ------------------- --- */

        const transition = transitions[transitionsPosStack.top()];

        // handle null transition (without moving position in string)
        if(transition[0] === null)
        {
            regexPosStack.push(regexPosStack.top() + transition[1]);
            continue;
        }

        /* we now try if we can transition into new state */
        if(matchString[stringPosStack.top()] === transition[0])
        {
            regexPosStack.push(regexPosStack.top() + transition[1]);
            stringPosStack.push(stringPosStack.top() + 1);

            continue;
        }
    }

    parentPort.postMessage({ type: "success", data: [] });
}