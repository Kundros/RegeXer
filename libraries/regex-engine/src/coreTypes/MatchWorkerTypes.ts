import { ASTRoot, NFAtype } from "./parserTypes";
import { BatchData, MatchData, MatchFlags, MatchResponse } from "./MatchTypes";

/* ----- Possible messages ----- */
export type NewMessage = { type: MatchResponse, pid: number, data: unknown };
export type MessageWorkerRecieve = { type: string, pid: number, data: unknown, batchSize?: number };

/* ----- All possible returns from worker ----- */
export type ReturnAborted = NewMessage & { data: undefined };
export type ReturnMatch = NewMessage & { data: MatchData };
export type ReturnErrorMessage = NewMessage & { data: string };
export type ReturnBatch = NewMessage & {  data: BatchData };

export type NewData = { AST: ASTRoot, NFA: NFAtype[], flags?: number | MatchFlags};
export type NewFlags = { flags?: number | MatchFlags};