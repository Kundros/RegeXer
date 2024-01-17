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
        const top : MatchState | undefined = this.matchData.states[this.matchData.states.length-1];

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

        if((this.flags_ & MatchFlags.REMOVE_STATES_WO_EFFECT) && top !== undefined && this.isNoEffectState(state, top))
            return this;

        if(state?.strAt === undefined)
            state.strAt = top.strAt;
        
        this.matchData.statesCount++;
        this.matchData.states.push(state);

        return this;
    }

    public isNoEffectState(state1 : MatchState, state2 : MatchState) : boolean
    {
        if(state1.regAt[0] !== state2.regAt[0] || state1.regAt[1] !== state2.regAt[1])
            return false;
        if(state1.strAt?.[0] !== state2.strAt?.[0] || state1.regAt?.[1] !== state2.regAt?.[1])
            return false;
        if(state1.fromExact?.[0] !== state2.fromExact?.[0] || state1.fromExact?.[1] !== state2.fromExact?.[1])
            return false;
        if(state1.action !== state2.action)
            return false;
        return true;
    }

    public updateOption(optionStart: number, optionEnd: number)
    {
        const states = this.matchData.states;

        if(this.flags_ & MatchFlags.OPTION_NO_ERROR_RETURN)
        {
            const fromAt = states[states.length-1].fromExact ?? [optionStart, optionStart];
            states[states.length-1].regAt = [fromAt[0], fromAt[1]];
        }
        else
            states[states.length-1].regAt = [optionStart, optionStart];
    }

    public finalize() : MatchData
    {
        return this.matchData;
    }

    public matchData: MatchData;
    private flags_ ?: number | MatchFlags;
}