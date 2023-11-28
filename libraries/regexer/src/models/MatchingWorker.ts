import { workerData, parentPort } from 'worker_threads';
import { RegexTypes } from './regexParser';
import { Stack } from '@regexer/structures/Stack';
import { RegexMatch } from './RegexMatch';
import { MatchStateType } from './MatchStateTypes';
import { ASTGroup } from './parserTypes';

const AST: RegexTypes.ASTRoot = workerData.AST;
const NFA: RegexTypes.NFAState[] = workerData.NFA;

parentPort.on("message", (message : { type: string, data: any }) => {
    switch(message.type)
    {
        case 'match':
        {
            if(typeof message.data !== "string") return;
            const matchString : string = message.data;

            //try{
                match(matchString);
            //} 
            //catch(e) {
            //    parentPort.postMessage({type: "error", data: "Unexpected error during matching."});
            //}

            break;
        }
    }
});

type matchingState = {transition: number, state: RegexTypes.NFAState};

/**
 * match the string if possible
 * @param matchString string that is run thru NFA
 */
function match(matchString) : void
{
    let stringPosStack = new Stack<number>([0]);

    let regexPosStack = new Stack<number>([0]);
    let statesStack = new Stack<matchingState>();

    let match = new RegexMatch();

    let isBacktracking = false;

    while(true) {
        const nfaState = NFA[regexPosStack.top()];
        
        if(!isBacktracking)
            handleMatchState(match, {transition: 0, state: nfaState}, stringPosStack.top());
        isBacktracking = false;

        /* If we are at the last nfa node aka. END we're done matching */
        if(nfaState?.ASTelement?.type === RegexTypes.RegexStates.END)
            break;

        const transitions = nfaState.transitions;

        /* 
            If the state isn't at the top of the stack we need to add it as new state
                + we add starting transition position at 0
            otherwise we move transition position by 1
         */
        if(statesStack.top()?.state !== nfaState)
        {
            statesStack.push({transition: 0, state: nfaState});
        }
        else
        {
            statesStack.top().transition++;
        }


        /*
            If we have no more transitions left, we backtrack
            + if we tried all paths and failed exit matching and send error message
        */
        if(transitions.length <= statesStack.top().transition)
        {
            statesStack.pop();
            regexPosStack.pop();

            /* match wasn't found from position (move by one) */
            if(statesStack.size() === 0)
            {
                /* no match from any position wasn't found */
                if(stringPosStack.top() + 1 >= matchString.length)
                {
                    parentPort.postMessage({type: "error", data: match });
                    return;
                }

                stringPosStack.push(stringPosStack.pop() + 1);
                regexPosStack.push(0);

                isBacktracking = true;
                continue; // backtracking
            }

            stringPosStack.pop();
            
            isBacktracking = true;
            continue; // backtracking
        }


        /* --- ------------------- --- */
        /* --- applying transition --- */
        /* --- ------------------- --- */

        const transition = transitions[statesStack.top().transition];

        // handle null transition (without moving position in string)
        if(transition[0] === null)
        {
            regexPosStack.push(regexPosStack.top() + transition[1]);
            stringPosStack.push(stringPosStack.top());
            continue;
        }

        /* we now try if we can transition into new state */
        if(matchString[stringPosStack.top()] === transition[0] && stringPosStack.top() < matchString.length)
        {
            regexPosStack.push(regexPosStack.top() + transition[1]);
            stringPosStack.push(stringPosStack.top() + 1);
            continue;
        }
    }

    parentPort.postMessage({ type: "success", data: match });
}

function handleMatchState(match : RegexMatch, matchingState : matchingState, stringPosition : number, action : number = 0) : void
{
    const localAST = matchingState?.state?.ASTelement;

    if(localAST === undefined) return;

    let state = {
        data: [localAST.type, localAST.start, localAST.end, stringPosition],
    } as MatchStateType;


    if(localAST.type & RegexTypes.RegexStates.GROUP)
    {
        const group = localAST as ASTGroup;

        if(group.detailedType === RegexTypes.GroupTypes.CAPTURING)
        {
            match.handleCapture(stringPosition);
        }
    }

    match.pushState(state);
}