export const actionType = {
    FORWARD: "FORWARD"
}

export type actionType = typeof actionType[keyof typeof actionType];