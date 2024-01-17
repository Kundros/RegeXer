import { MatchData, MatchFlags, RegexMatch } from "../core/RegexMatch";
import { RegexTypes } from "../core/RegexParser";

export const MatchResultsTypes = 
{
    SUCCESS: 0x1,
    NO_MATCH: 0x2,
    ERROR: 0x4,
    ABORTED: 0x8
} as const;

export type MatchResultsTypes = typeof MatchResultsTypes[keyof typeof MatchResultsTypes];

export type MatchComplete = { type: MatchResultsTypes, matches: RegexMatch[]};
export type NewMessage = { type: MatchResultsTypes, pid: number, data: unknown };
export type MessageWorkerRecieve = { type: string, pid: number, data: unknown };
export type ReturnMessage = NewMessage & { data: MatchData[] };
export type ReturnErrorMessage = NewMessage & { data: string };
export type NewData = { AST: RegexTypes.ASTRoot, NFA: RegexTypes.NFAtype[], flags?: number | MatchFlags};
export type NewFlags = { flags?: number | MatchFlags};