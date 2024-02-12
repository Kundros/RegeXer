import { MatchGroup } from "@kundros/regexer"
import { setCursorPosition } from "./caretHelper"

export type BoundingOptions = {
    textElement : HTMLElement, 
    from: number,
    to: number
}

export type Boundings = [number, number, number, number][];

export type HighlighTextOptions = 
{ 
    boundings: Boundings,
    context : CanvasRenderingContext2D, 
    textElement : HTMLElement
    highlightColor ?: string
}

export type GroupBoundingsOptions = {
    context : CanvasRenderingContext2D, 
    textElement : HTMLElement,
    groups: Map<string | number, MatchGroup>
}

export type HighlighGroupsOptions = {
    context : CanvasRenderingContext2D, 
    textElement : HTMLElement,
    groupsBoundings: Boundings[],
    colors?: string[],
    fallbackColor?: string
}

export function getTextBounding(options : BoundingOptions) : Boundings // x, y, width, height
{
    let outputRows : Boundings = [];

    const textBounds = options.textElement.getBoundingClientRect();
    const scrollOffset = options.textElement.scrollTop;
    const computedStyle = window.getComputedStyle( options.textElement, null );
    const paddingLeftText = Number.parseInt(computedStyle.paddingLeft);
    const spacingWidth = Number.parseInt(computedStyle.letterSpacing);

    const range = setCursorPosition(options.textElement, [options.from, options.to], true);
    const clientRects = range.getClientRects();
    const clientRectsLength = clientRects.length;

    for(let i = 0 ; i < clientRectsLength ; i++)
    {
        const oneRect = clientRects.item(i);

        outputRows.push([
            oneRect.x - textBounds.x - paddingLeftText + spacingWidth - .5,
            oneRect.y - textBounds.y + scrollOffset,
            (oneRect.width === 0 ? spacingWidth : oneRect.width + 1),
            oneRect.height
        ]);
    }

    return outputRows;
}

export function highlightPosition(options : HighlighTextOptions)
{
    options.context.save();

    options.context.fillStyle = options.highlightColor ?? "#00FF00";

    const dimensions = options.boundings;

    const scrollOffset = options.textElement.scrollTop;

    for(let i = 0 ; i < dimensions.length ; i++)
    {
        // offset the highlight 2 pixels down
        options.context.fillRect(dimensions[i][0], dimensions[i][1] + 2 - scrollOffset, dimensions[i][2], dimensions[i][3]);
    }

    options.context.stroke();

    options.context.restore();
}

export function getGroupBoundings(options : GroupBoundingsOptions) : Boundings[]
{
    let groups = [...options.groups.values()].sort((a : MatchGroup, b : MatchGroup) => { return a.index - b.index});
    let boundings : Boundings[] = [];

    for(let group of groups)
    {
        boundings.push(getTextBounding({
            from: group.strAt[0],
            to: group.strAt[1],
            textElement: options.textElement
        }));
    }

    return boundings;
}

export function highlightGroups(options : HighlighGroupsOptions)
{
    const groups = options.groupsBoundings;
    const groupsLength = groups.length;

    for(let i = 0 ; i < groupsLength ; i++)
    {
        let color : string;
        if(options.colors === undefined || options.colors.length === 0)
            color = options?.fallbackColor ?? "#EBB044";
        else
            color = options.colors[i % options.colors.length];

        highlightPosition({context: options.context, textElement: options.textElement, boundings: groups[i], highlightColor: color});
    }
}