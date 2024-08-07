import { MatchGroup } from "@regexer/regex-engine";

export type MatchHighlightingOptions = {
    positionColor?: string,
    backtrackingPositionColor?: string,
    backtrackingDirectionColor?: string,
    groupFallbackColor?: string,
    groupColors?: string[]
};

export type RegexHighlightingOptions = {
    positionColor?: string,
    backtrackingPositionColor?: string,
    backtrackingDirectionColor?: string,
    informativeColor?: string
};

export type BoundingOptions = {
    textElement : HTMLElement, 
    from: number,
    to: number
}

export type Dimensions = [number, number, number, number][];

export type HighlighTextOptions = 
{ 
    dimensions: Dimensions,
    context : CanvasRenderingContext2D, 
    textElement : HTMLElement,
    highlightColor ?: string,
    offsetY?: number
}

export type GroupDimensionsOptions = {
    context : CanvasRenderingContext2D, 
    textElement : HTMLElement,
    groups: Map<number, MatchGroup>
}

export type HighlighGroupsOptions = {
    context : CanvasRenderingContext2D, 
    textElement : HTMLElement,
    groupsDimensions: Dimensions[],
    colors?: string[],
    fallbackColor?: string,
    offsetY?: number
}

export const HighlightTypes = 
{
    DEFAULT: 0x0,
    ERROR: 0x1,
    INFORMATIVE: 0x2,
    BACKTRACKING: 0x3,
    GROUP: 0x4
} as const;

export type HighlightTypes = typeof HighlightTypes[keyof typeof HighlightTypes];