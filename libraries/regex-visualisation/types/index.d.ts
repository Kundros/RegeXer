import { MatchBatchData, MatchData, RegexMatch } from "@kundros/regexer";
import { RegexTypes } from "@kundros/regexer/types/core/RegexParser";

declare module '*.html' {
    const content: string;
    export default content;
}

declare module '*.svg' {
    const content: string;
    export default content;
}

/* Message types */
export type Message = {
    type: string,
    data: unknown
} 

export type MessageBatchData = Message & {
    data: MatchBatchData
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

