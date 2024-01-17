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
/**
 * @property {number} BACKTRACKING signalize that the state is backtracking
 * @property {number} FORWARD_START signalize that the start of the match in string has moved forward
 * @property {number} SHOWCASE signalize that the state showcases some part of the regex
 */
export const MatchAction = 
{    
     BACKTRACKING: 0x1,
     FORWARD_START: 0x2,
     SHOWCASE: 0x4
} as const;

export type MatchAction = typeof MatchAction[keyof typeof MatchAction];

/** 
 * Flags used to generate different instances of matched history (the end history length can differ too)
 * @property {number} SHORTEN_BACKTRACKING backtracking is shortened to closest non-completed path decision 
 * @property {number} BACKTRACKED_FROM_EXACT 
 *   used when shortened backtracking is used, otherwise has no efect \
 *   adds to backtracking information on where backtracking has started exactly
 * @property {number} IGNORE_GROUP_ENTERS all enterings to group will be ignored and not captured by match history
 * @property {number} IGNORE_GROUP_ENTERS all leavings from group will be ignored and not captured by match history
 * @property {number} IGNORE_OPTION_LEAVES all leavings from option will be ignored and not captured by match history
 * @property {number} IGNORE_OPTION_LEAVES all enterings to option will be ignored and not captured by match history
 * @property {number} BACKTRACK_TRIM_POSITION the position that is backtracked to is trimed to first coordinate
 * @property {number} OPTION_ENTERS_SHOW_ACTIVE only current selected option will be highlighted
 * @property {number} IGNORE_STR_START_POSITION_CHANGE when starting position is changed then the new position isn't recorded by match history
 * @property {number} OPTION_SHOW_FIRST_ENTER is added aditional match state of first enter into option
 * @property {number} OPTION_NO_ERROR_RETURN 
 *   if single option cannot be matched the return of backtracking isn't updated to start of the regex option, \
 *   but stays at the same position just with action of backtracking set
 * @property {number} REMOVE_STATES_WO_EFFECT if 2 or more states share same regex position and string position, those will be reduced to single state 
 */
export const MatchFlags = 
{
     NONE: 0x0,
     SHORTEN_BACKTRACKING: 0x1,
     BACKTRACKED_FROM_EXACT: 0x2,
     IGNORE_GROUP_ENTERS: 0x4,
     IGNORE_GROUP_LEAVES: 0x8,
     IGNORE_OPTION_LEAVES: 0x10,
     IGNORE_OPTION_ENTERS: 0x20,
     BACKTRACK_TRIM_POSITION: 0x40,
     OPTION_ENTERS_SHOW_ACTIVE: 0x80,
     IGNORE_STR_START_POSITION_CHANGE: 0x100,
     OPTION_SHOW_FIRST_ENTER: 0x200,
     OPTION_NO_ERROR_RETURN: 0x400,
     REMOVE_STATES_WO_EFFECT: 0x800
} as const;

/**
 * @readonly
 * @enum {number}
 */
export type MatchFlags = typeof MatchFlags[keyof typeof MatchFlags];