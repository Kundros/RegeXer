import { StringReader } from "@helpers/StringReader"
import { RegexMatch } from "@models/RegexMatch";
import { parse, RegexTypes } from "@models/regexParser"
import { RegCompileException } from "@exceptions/RegCompileException";
import { Stack } from "@regexer/structures/Stack";
import { RegMatchException } from "@regexer/exceptions/RegMatchException";

export class Regexer{
    constructor(regexString : string = "")
    {
        try{
            const data = parse(regexString);
            this.AST_ = data?.AST;
            this.NFA_ = data?.NFA;
        }
        catch(e) {
            console.log(e);
            throw new RegCompileException("unable to parse regex");
        }
    }

    public match(matchString : string) : RegexMatch
    {
        let stringPosStack = new Stack<number>([0]);
        let regexPosStack = new Stack<number>([0]);
        let transitionsPosStack = new Stack<number>();
        let statesStack = new Stack<RegexTypes.NFAState>();

        while(this.NFA_[regexPosStack.top()]?.ASTelement?.type !== RegexTypes.RegexStates.END) {
            const nfaState = this.NFA_[regexPosStack.top()];
            const transitions = nfaState.transitions;

            if(statesStack.top() !== nfaState)
            {
                statesStack.push(nfaState);
                transitionsPosStack.push(0);
            }
            else if(transitionsPosStack.top() !== undefined)
            {
                transitionsPosStack.push(transitionsPosStack.pop() + 1);
            }


            if(transitions.length <= transitionsPosStack.top())
            {
                transitionsPosStack.pop();
                statesStack.pop();
                regexPosStack.pop();

                if(transitionsPosStack.size() === 0)
                    throw new RegMatchException("Unable to match.");
                
                continue; // backtracking?
            }


            const transition = transitions[transitionsPosStack.top()];

            if(transition[0] === null)
            {
                regexPosStack.push(regexPosStack.top() + transition[1]);
                continue;
            }
            
            if(stringPosStack.top() >= matchString.length)
            {
                continue;
            }

            const compareChr = matchString[stringPosStack.top()];
            const transitionLength = transition[0].length;
            let compareSuccess = false;

            for(let i = 0 ; i < transitionLength ; i++)
            {
                if(compareChr === transition[0][i])
                {
                    compareSuccess = true;
                    break;
                }
            }

            if(!compareSuccess)
                continue;

            regexPosStack.push(regexPosStack.top() + transition[1]);
            stringPosStack.push(stringPosStack.pop() + 1);
        }

        return new RegexMatch();
    }

    private AST_: RegexTypes.ASTRoot;
    private NFA_: RegexTypes.NFAState[];
}