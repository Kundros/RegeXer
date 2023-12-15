import { RegexTypes } from "@kundros/regexer/types/models/RegexParser";

declare module '*.html' {
    const content: string;
    export default content;
}

export type Message = {
    type: string,
    data: unknown
} 

export type MessageRegexData = Message & {
    data: RegexData
}

export type RegexData = {
    NFA: RegexTypes.NFAtype[],
    AST: RegexTypes.ASTRoot,
    text: string
}