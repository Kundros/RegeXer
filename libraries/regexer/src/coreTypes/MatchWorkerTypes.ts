import { RegexTypes } from "../core/RegexParser";
import { MatchBatchData, MatchData, MatchFlags } from "./MatchTypes";

export const MatchResponse = 
{
    SUCCESS: 0x1,
    NO_MATCH: 0x2,
    ERROR: 0x4,
    ABORTED: 0x8,
    BATCH: 0x10
} as const;

export type MatchResponse = typeof MatchResponse[keyof typeof MatchResponse];

export type NewMessage = { type: MatchResponse, pid: number, data: unknown };
export type MessageWorkerRecieve = { type: string, pid: number, data: unknown, batchSize?: number };

export type ReturnAborted = NewMessage & { data: undefined };
export type ReturnMatch = NewMessage & { data: MatchData };
export type ReturnErrorMessage = NewMessage & { data: string };
export type ReturnBatch = NewMessage & {  data: MatchBatchData };

export type NewData = { AST: RegexTypes.ASTRoot, NFA: RegexTypes.NFAtype[], flags?: number | MatchFlags};
export type NewFlags = { flags?: number | MatchFlags};