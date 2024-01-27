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

export type MessageRegex = Message & {
    data: string
}


