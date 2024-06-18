import { MatchGroup } from "@regexer/regex-engine"
import { setCursorPosition } from "./caretHelper"

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
    textElement : HTMLElement
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

export function getTextDimensions(options : BoundingOptions) : Dimensions // x, y, width, height
{
    const outputRows : Dimensions = [];

    const textBounds = options.textElement.getBoundingClientRect();
    const scrollOffset = options.textElement.scrollTop;
    const computedStyle = window.getComputedStyle( options.textElement, null );
    const paddingLeftText = Number.parseInt(computedStyle.paddingLeft);
    const spacingWidth = Number.parseInt(computedStyle.letterSpacing);

    const range = setCursorPosition(options.textElement, options.from, options.to, true);

    let clientRects = range.getClientRects();

    // HACK: when there is no text, to still get bounding add invisible char and delete it
    if(clientRects.length <= 0)
    {
        const tmpNode = document.createTextNode('\ufeff');
        range.insertNode(tmpNode);
        clientRects = range.getClientRects();
        tmpNode.remove();
    }

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

    const dimensions = options.dimensions;

    const scrollOffset = options.textElement.scrollTop;

    for(let i = 0 ; i < dimensions.length ; i++)
    {
        options.context.fillRect(dimensions[i][0], dimensions[i][1] + (options.offsetY ?? 0) - scrollOffset, dimensions[i][2], dimensions[i][3]);
    }

    options.context.stroke();

    options.context.restore();
}

export function highlightBacktracking(options : HighlighTextOptions)
{
    options.context.save();

    options.context.fillStyle = options.highlightColor ?? "#FF0000";

    const dimensions = options.dimensions;

    if(dimensions.length === 0)
        return;

    const startX = dimensions[0][0];
    const startY = dimensions[0][1];
    const offsetY = (options.offsetY ?? 0) - options.textElement.scrollTop;

    // arrow rect
    options.context.fillRect(startX + 6, startY + offsetY, dimensions[0][2] - 6, 2);
    for(let i = 1 ; i < dimensions.length ; i++)
    {
        if(dimensions[i][0] >= startX + 6 || dimensions[i][1] != startY)
            options.context.fillRect(dimensions[i][0], dimensions[i][1] + offsetY, dimensions[i][2], 2);
        else
            options.context.fillRect(dimensions[i][0] + 6, dimensions[i][1] + offsetY, dimensions[i][2] + 6, 2);
    }

    // arrow head
    options.context.beginPath();
    options.context.moveTo(startX    , startY + 1 + offsetY)
    options.context.lineTo(startX + 8, startY + 4 + offsetY);
    options.context.lineTo(startX + 8, startY - 2 + offsetY);
    options.context.closePath();
    options.context.fill();

    options.context.restore();
}

export function getGroupDimensions(options : GroupDimensionsOptions) : Dimensions[]
{
    const groups = [...options.groups.entries()].sort((a, b) => { return a[0] - b[0]});
    const dimensions : Dimensions[] = [];

    for(const group of groups)
    {
        dimensions.push(getTextDimensions({
            from: group[1].strAt[0],
            to: group[1].strAt[1],
            textElement: options.textElement
        }));
    }

    return dimensions;
}

export function highlightGroups(options?: HighlighGroupsOptions)
{
    if(!options)
        return;
    const groups = options.groupsDimensions;
    const groupsLength = groups.length;

    for(let i = 0 ; i < groupsLength ; i++)
    {
        let color : string;
        if(options.colors === undefined || options.colors.length === 0)
            color = options?.fallbackColor ?? "#EBB044";
        else
            color = options.colors[i % options.colors.length];

        highlightPosition({
            context: options.context, 
            textElement: options.textElement, 
            dimensions: groups[i], 
            highlightColor: color, 
            offsetY: options.offsetY
        });
    }
}