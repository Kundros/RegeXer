import { RegexStates } from "./parserTypes";

export type MatchStateType = MatchState

export type MatchState = {
    data: [RegexStates, number, number, number], // State, regStart, regEnd, stringPos
    action?: number
};