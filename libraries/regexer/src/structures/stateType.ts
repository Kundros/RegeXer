export const stateType = {
    ESCAPED: "ESCAPED",
    OPTION: "OPTION",
    OPTION_LIST: "OPTION_LIST"
}

export type stateType = typeof stateType[keyof typeof stateType];