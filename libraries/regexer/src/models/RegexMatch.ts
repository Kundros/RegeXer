import { MatchStateType } from "@models/MatchStateTypes";
import { Stack } from "@regexer/structures/Stack";

export class RegexMatch
{
    constructor()
    {}

    public pushState(state : MatchStateType)
    {
        this.matchStates_.push(state);
    }

    public handleCapture(position: number, starting: boolean = true)
    {
        if(starting)
        {
            this.capturingStack.push([position, 0]);
            return;
        }

        this.capturingStack.top()[1] = position;
        this.captures_.push(this.capturingStack.pop());
    }

    private matchStates_ : MatchStateType[] = [];
    private match_?: [number, number];
    private captures_ : [number, number][];

    /* parsing variables */
    private capturingStack = new Stack<[number, number]>();
}