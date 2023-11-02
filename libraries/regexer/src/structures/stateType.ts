export const stateType = {
    ESCAPED: "ESCAPED"
}

export type stateType = typeof stateType[keyof typeof stateType];