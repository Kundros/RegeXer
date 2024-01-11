import { MatchData, RegexMatch } from "./RegexMatch";
import { RegexTypes } from "./RegexParser";

export type MatchComplete = {success: boolean, matches: RegexMatch[]};
export type NewMessage = { type: string, pid: number, data: unknown };
export type ReturnMessage = NewMessage & { data: MatchData[] };
export type ReturnErrorMessage = NewMessage & { data: string };
export type NewData = { AST: RegexTypes.ASTRoot, NFA: RegexTypes.NFAtype[]};