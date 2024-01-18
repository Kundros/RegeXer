import { RegexTypes } from "../core/RegexParser";
import { MatchBatchData, MatchData, MatchFlags } from "./MatchTypes";

export const MatchWorkerResultTypes = 
{
    SUCCESS: 0x1,
    NO_MATCH: 0x2,
    ERROR: 0x4,
    ABORTED: 0x8,
    BATCH: 0x10
} as const;

export type MatchWorkerResultTypes = typeof MatchWorkerResultTypes[keyof typeof MatchWorkerResultTypes];

export type NewMessage = { type: MatchWorkerResultTypes, pid: number, data: unknown };
export type MessageWorkerRecieve = { type: string, pid: number, data: unknown, batchSize?: number };
export type ReturnMessage = NewMessage & { data: MatchData };
export type ReturnErrorMessage = NewMessage & { data: string };
export type ReturnBatch = NewMessage & {  data: MatchBatchData }
export type NewData = { AST: RegexTypes.ASTRoot, NFA: RegexTypes.NFAtype[], flags?: number | MatchFlags};
export type NewFlags = { flags?: number | MatchFlags};