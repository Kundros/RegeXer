import { RegexTypes } from "./RegexParser";

export class RegexMatch
{
     constructor(matchData : MatchData)
     {
          this.matchData_ = matchData;
     }

     public moveForward() : null | MatchState
     {
          this.at_++;
          if(this.at_ < 0 || this.at_ >= this.statesLength)
               return null;
          return this.matchData_.states[this.at_];
     }

     public moveBackward() : null | MatchState
     {
          this.at_--;
          if(this.at_ < 0 || this.at_ >= this.statesLength)
               return null;
          return this.matchData_.states[this.at_];
     }

     public get start() : number | undefined
     {
          return this.matchData_.start;
     }

     public get end() : number | undefined
     {
          return this.matchData_.end;
     }

     public get statesLength()
     {
          return this.matchData_.states.length;
     }

     public get currentState() : null | MatchState
     {
          if(this.at_ < 0 || this.at_ >= this.statesLength)
               return null;
          return this.matchData_.states[this.at_];
     }

     public get nextState()
     {
          const next = this.at_ + 1;
          if(next < 0 || next >= this.statesLength)
               return null;
          return this.matchData_.states[next];
     }

     public get beforeState()
     {
          const before = this.at_ - 1;
          if(before < 0 || before >= this.statesLength)
               return null;
          return this.matchData_.states[before];
     }

     private at_ : number = 0;
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