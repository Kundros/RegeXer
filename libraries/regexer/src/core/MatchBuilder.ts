import { MatchAction, MatchData, MatchFlags, MatchState } from "./RegexMatch";
import { RegexStates } from "../coreTypes/parserTypes";

export class MatchBuilder
{
    constructor(flags?: number | MatchFlags)
    {
        this.flags_ = flags;
        this.matchData = {
            states: [],
            statesCount: 0
        }
    }

    public addState(state : MatchState) : MatchBuilder
    {
        const top = this.matchData.states[this.matchData.states.length-1];

        this.matchData.statesCount++;

        if((this.flags_ & MatchFlags.SHORTEN_BACKTRACKING))
        {
            if(state?.action & MatchAction.BACKTRACKING)
            {
                if(this.flags_ & MatchFlags.BACKTRACKED_FROM_EXACT)
                    state.fromExact = top?.fromExact ?? [state.regAt[0], state.regAt[1]];

                if(top?.action & MatchAction.BACKTRACKING)
                {
                    this.matchData.states.pop();
                    this.matchData.statesCount--;
                }
            }
        }

        if((this.flags_ & MatchFlags.BACKTRACK_TRIM_POSITION) && (top?.action & MatchAction.BACKTRACKING))
            top.regAt[1] = top.regAt[0];
        
        this.matchData.states.push(state);

        return this;
    }

    public finalize(pos: number = 0) : MatchData
    {
        this.addState({
            type: RegexStates.END,
            regAt: [pos, pos]
        });
        return this.matchData;
    }

    public matchData: MatchData;
    private flags_ ?: number | MatchFlags;
}