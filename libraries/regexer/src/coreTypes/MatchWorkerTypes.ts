import { MatchData, MatchFlags, MatchState, RegexMatch } from "../core/RegexMatch";
import { RegexTypes } from "../core/RegexParser";

export const MatchResultsTypes = 
{
    SUCCESS: 0x1,
    NO_MATCH: 0x2,
    ERROR: 0x4,
    ABORTED: 0x8,
    BATCH: 0x10,
    BATCH_ONE_MATCH_COMPLETED: 0x20
} as const;

export type MatchResultsTypes = typeof MatchResultsTypes[keyof typeof MatchResultsTypes];

export type MatchComplete = { type: MatchResultsTypes, matches: RegexMatch[]};
export type NewMessage = { type: MatchResultsTypes, pid: number, data: unknown };
export type MessageWorkerRecieve = { type: string, pid: number, data: unknown, batchSize?: number };
export type ReturnMessage = NewMessage & { data: MatchData };
export type ReturnErrorMessage = NewMessage & { data: string };
export type ReturnBatch = NewMessage & {  data: MatchBatch }
export type NewData = { AST: RegexTypes.ASTRoot, NFA: RegexTypes.NFAtype[], flags?: number | MatchFlags};
export type NewFlags = { flags?: number | MatchFlags};

export type MatchBatch = {
    batchSize: number,
    matchCurrentSize: number,
    batchSpan : [number, number],
    matchStates : MatchState[],
    type?: MatchResultsTypes,
    matchData ?: MatchData // final match
}