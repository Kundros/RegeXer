import { Regexer } from "@kundros/regexer";

declare module '*.html' {
    const content: string;
    export default content;
}

export type Message = {
    type: string,
    data: unknown
} 

export type MessageRegexData = Message & {
    data: Regexer
}