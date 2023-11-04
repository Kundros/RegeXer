export const stateType = {
    ESCAPED: "ESCAPED",
    OPTION: "OPTION",
    OPTION_POSSIBLE: "OPTION_POSSIBLE",
    OPTION_LIST: "OPTION_LIST",
    CAPTURING: "CAPTURING"
}

export type stateType = typeof stateType[keyof typeof stateType];