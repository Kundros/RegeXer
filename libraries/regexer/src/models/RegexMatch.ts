import { RegexTypes } from "./regexParser";

export class RegexMatch
{
     constructor(matchData : MatchData)
     {
          this.matchData_ = matchData;
     }

     public get start() : number | undefined
     {
          return this.matchData_.start;
     }

     public get end() : number | undefined
     {
          return this.matchData_.end;
     }

     private matchData_ : MatchData;
}

export type MatchData =
{
     states: MatchState[],
     start?: number,
     end?: number
}

export type MatchState =
{
     type: RegexTypes.RegexStates,
     regAt: [number, number],
     strAt?: [number, number],

     action?: MatchAction
}

export const MatchAction = 
{    
     BACKTRACKING: 0x1
}

export type MatchAction = typeof MatchAction[keyof typeof MatchAction];