import { MatchBatchData, MatchData, MatchFlags, MatchState } from "@regexer/coreTypes/MatchTypes";

export class RegexMatch
{
     constructor(matchData?: MatchData, flags?: MatchFlags)
     {
          this.matchData_ = matchData ?? {
               states: [],
               success: false,
               statesCount: 0
          };
     }

     public async addBatch(batch : MatchBatchData)
     {
          this.matchData_.statesCount = batch.matchCurrentSize;

          for(let i = 0; i < batch.matchStates.length ;i++)
          {
               await new Promise(resolve => setTimeout(resolve, 0));
               this.matchData_.states.push(batch.matchStates[i]);
          }
     }

     public changeMatchInformation(match : MatchData)
     {
          this.matchData_.end = match.end;
          this.matchData_.start = match.start;
          this.matchData_.statesCount = match.statesCount;
          this.matchData_.success = match.success;
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

     public get success() : boolean
     {
          return this.matchData_.success;
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

     public get statesCount()
     {
          return this.matchData_.statesCount;
     }

     private at_ : number = 0;
     private matchData_ : MatchData;
}