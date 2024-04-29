import { MatchBatchData, MatchData, MatchFlags, MatchGroup, MatchState } from "@regexer/coreTypes/MatchTypes";

export class RegexMatch
{
     constructor(matchData?: MatchData)
     {
          this.matchData_ = matchData ?? {
               states: [],
               success: false,
               statesCount: 0
          };
     }

     /** @description ability to add new batch to Match structure */
     public addBatch(batch : MatchBatchData)
     {
          this.matchData_.statesCount = batch.matchCurrentSize;
          this.matchData_.states.push(...batch.matchStates);
     }

     /** @description returns all groups matched */
     public get groups() : Map<number, MatchGroup> | undefined
     {
          return this.matchData_.groups;
     }

     /** @description mutate base information of match */
     public changeMatchInformation(match : MatchData)
     {
          this.matchData_.end = match.end;
          this.matchData_.start = match.start;
          this.matchData_.statesCount = match.statesCount;
          this.matchData_.success = match.success;
          this.matchData_.groups = match.groups;
     }

     public moveForward(num?: number) : null | MatchState
     {
          this.at_+= num !== undefined ? num : 1;
          if(this.at_ >= this.statesLength)
               this.at_ = this.statesLength;
          if(this.at_ < 0 || this.at_ >= this.statesLength)
               return null;
          return this.matchData_.states[this.at_];
     }

     public moveBackward(num?: number) : null | MatchState
     {
          this.at_-= num !== undefined ? num : 1;
          if(this.at_ < 0)
               this.at_ = -1;
          if(this.at_ < 0 || this.at_ >= this.statesLength)
               return null;
          return this.matchData_.states[this.at_];
     }

     public moveTo(num: number) : null | MatchState
     {
          this.at_= num;
          if(this.at_ < 0)
               this.at_ = -1;
          if(this.at_ >= this.statesLength)
               this.at_ = this.statesLength;
          if(this.at_ < 0 || this.at_ >= this.statesLength)
               return null;
          return this.matchData_.states[this.at_];
     }

     /** @description detection if match successfully found match in string */
     public get success() : boolean
     {
          return this.matchData_.success;
     }

     /** @description if match exists returns starting position in string. If not then returns undefined. */
     public get start() : number | undefined
     {
          return this.matchData_.start;
     }

     /** @description if match exists returns ending position in string. If not then returns undefined. */
     public get end() : number | undefined
     {
          return this.matchData_.end;
     }

     /** @description returns number of states (states count). */
     public get statesLength()
     {
          return this.matchData_.statesCount;
     }

     /** @description get current state if on current position is some state. */
     public get currentState() : null | MatchState
     {
          if(this.at_ < 0 || this.at_ >= this.statesLength)
               return null;
          return this.matchData_.states[this.at_];
     }

     /** @description get next state if on next position is some state. */
     public get nextState()
     {
          const next = this.at_ + 1;
          if(next < 0 || next >= this.statesLength)
               return null;
          return this.matchData_.states[next];
     }

     /** @description get before state if on beforehand position is some state. */
     public get beforeState()
     {
          const before = this.at_ - 1;
          if(before < 0 || before >= this.statesLength)
               return null;
          return this.matchData_.states[before];
     }

     /** @description returns number of states (states count). */
     public get statesCount()
     {
          return this.matchData_.statesCount;
     }

     private at_ : number = 0;
     private matchData_ : MatchData;
}