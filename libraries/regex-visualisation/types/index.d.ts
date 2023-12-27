import { RegexMatch } from "@kundros/regexer";
import { RegexTypes } from "@kundros/regexer/types/models/RegexParser";

declare module '*.html' {
    const content: string;
    export default content;
}

/* Message types */
export type Message = {
    type: string,
    data: unknown
} 

export type MessageRegexData = Message & {
    data: RegexData
}

export type MessageErrorRegex = Message & {
    data: RegexErrorData
}

export type MessageMatchData = Message & {
    data: MatchData
}

/* Message data types */
export type RegexData = {
    NFA: RegexTypes.NFAtype[],
    AST: RegexTypes.ASTRoot,
    text: string
}

export type RegexErrorData = {
    from: number,
    to: number,
    errorCode: RegexTypes.RegexParserErrors,
    errorMessage: string,
    text: string
}

export type MatchData = {
    success: boolean,
    match: RegexMatch,
    text: string
}

