import { RegexTypes } from "./RegexParser";

export class RegexMatch
{
     constructor(matchData : MatchData, flags?: MatchFlags)
     {
          this.matchData_ = matchData;
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

export type MatchData =
{
     states: MatchState[],
     start?: number,
     end?: number,
     statesCount: number
}

export type MatchState =
{
     type: RegexTypes.RegexStates,
     regAt: [number, number],
     strAt?: [number, number],

     action?: MatchAction,
     fromExact?: [number, number]
}

export const MatchAction = 
{    
     BACKTRACKING: 0x1
} as const;

export type MatchAction = typeof MatchAction[keyof typeof MatchAction];

/** 
 * Flags used to generate different instances of matched history (the end history length can differ too)
 * @property {number} SHORTEN_BACKTRACKING backtracking is shortened to closest non-completed path decision 
 * @property {number} BACKTRACKED_FROM_EXACT 
 *   used when shortened backtracking is used, otherwise has no efect \
 *   adds to backtracking information on where backtracking has started exactly
 * @property {number} IGNORE_GROUP_ENTERS if set all enterings to group will be ignored and not captured by match history
 * @property {number} IGNORE_GROUP_ENTERS if set all leavings from group will be ignored and not captured by match history
 */
export const MatchFlags = 
{
     NONE: 0x0,
     SHORTEN_BACKTRACKING: 0x1,
     BACKTRACKED_FROM_EXACT: 0x2,
     IGNORE_GROUP_ENTERS: 0x4,
     IGNORE_GROUP_LEAVES: 0x4
} as const;

/**
 * @readonly
 * @enum {number}
 */
export type MatchFlags = typeof MatchFlags[keyof typeof MatchFlags];