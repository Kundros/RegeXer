import { MatchData, MatchFlags, RegexMatch } from "../core/RegexMatch";
import { RegexTypes } from "../core/RegexParser";

export type MatchComplete = {success: boolean, matches: RegexMatch[]};
export type NewMessage = { type: string, pid: number, data: unknown };
export type ReturnMessage = NewMessage & { data: MatchData[] };
export type ReturnErrorMessage = NewMessage & { data: string };
export type NewData = { AST: RegexTypes.ASTRoot, NFA: RegexTypes.NFAtype[], flags?: number | MatchFlags};
export type NewFlags = { flags?: number | MatchFlags};