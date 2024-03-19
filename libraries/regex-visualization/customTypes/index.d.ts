/* Message types */
export type Message = {
    type: string,
    data: unknown
} 

export type MessageRegex = Message & {
    data: string
}


