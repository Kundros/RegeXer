import { MatchData, MatchState } from "./RegexMatch";

export class MatchBuilder
{
    constructor()
    {
        this.matchData = {
            states: []
        }
    }

    public addState(state : MatchState) : MatchBuilder
    {
        this.matchData.states.push(state);
        return this;
    }

    public finalize() : MatchData
    {
        return this.matchData;
    }

    public matchData: MatchData;
}