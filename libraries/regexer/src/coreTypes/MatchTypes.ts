import { RegexTypes } from "@regexer/core/RegexParser"
import { MatchResponse } from "./MatchWorkerTypes"

export type MatchBatchData = {
    batchSize: number,
    matchCurrentSize: number,
    batchSpan : [number, number],
    matchStates : MatchState[]
}

export type BatchMatchOptions = 
{
    batchCallback: (matchBatch : MatchBatchData) => void | Promise<void>,
    matchCallback: (matchData : MatchData) => void | Promise<void>,
    completeCallback: (matchingCompleteResponse : MatchResponse) => void | Promise<void>,
    batchSize?: number,
    forceStopRunning?: boolean
}

export type MatchData =
{
     states: MatchState[],
     groups?: Map<number, MatchGroup>, 
     start?: number,
     end?: number,
     statesCount: number,
     success: boolean
}

export type MatchState =
{
     type: RegexTypes.RegexStates,
     regAt: [number, number],
     strAt: [number, number],
     groups?: Map<number, MatchGroup>,

     action?: MatchAction,
     fromExact?: [number, number]
}

export type MatchGroup =
{
     name?: string,
     regAt: [number, number],
     strAt: [number, number]
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
 * @property {number} ADD_GROUPS_TO_STATES all states that have at least one group will contain groups information
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
     REMOVE_STATES_WO_EFFECT: 0x800,
     ADD_GROUPS_TO_STATES: 0x1000
} as const;

/**
 * @readonly
 * @enum {number}
 */
export type MatchFlags = typeof MatchFlags[keyof typeof MatchFlags];