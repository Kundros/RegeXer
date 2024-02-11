import { MatchGroup } from "@kundros/regexer"
import { setCursorPosition } from "./caretHelper"

export type RowsBoundingOptions = {
    context : CanvasRenderingContext2D, 
    textElement : HTMLElement, 
    from: number,
    to: number
}

export type HighlighTextOptions = RowsBoundingOptions & {
    highlightColor ?: string
}

export type HighlighGroupsOptions = {
    context : CanvasRenderingContext2D, 
    textElement : HTMLElement,
    colors?: string[],
    fallbackColor?: string,
    groups: Map<string | number, MatchGroup>
}

export function getTextRowsBounding(options : RowsBoundingOptions) : [number, number, number, number][] // x, y, width, height
{
    options.context.save();

    //compute box sizing
    const computedStyle = window.getComputedStyle( options.textElement, null );
    options.context.font = computedStyle.font;
    const spacingWidth = Number.parseInt(computedStyle.letterSpacing);

    // compute letter measurements
    const letterMeasure = options.context.measureText("i");
    const letterHeight = letterMeasure.fontBoundingBoxDescent + letterMeasure.fontBoundingBoxAscent;

    let outputRows = [];

    let range = setCursorPosition(options.textElement, 0, true);

    const firstX = range.getBoundingClientRect().x;
    let lastOffsetX = firstX;
    const firstY = range.getBoundingClientRect().y;
    let lastOffsetY : undefined | number;
    let rowStart : undefined | number;

    console.log(options);

    for(let i = options.from ; i <= options.to ; i++)
    {
        range = setCursorPosition(options.textElement, i, true);

        if(rowStart === undefined)
            rowStart = range.getBoundingClientRect().x - firstX;
        if(lastOffsetY === undefined)
            lastOffsetY = range.getBoundingClientRect().y;

        if(range.getBoundingClientRect().y > lastOffsetY)
        {   
            let lengthBounding = lastOffsetX - firstX - rowStart;
            if(lengthBounding === 0)
                lengthBounding = spacingWidth;

            outputRows.push([rowStart, lastOffsetY - firstY, lengthBounding, letterHeight]);

            lastOffsetY = range.getBoundingClientRect().y;
            rowStart = 0;
        }
        
        lastOffsetX = range.getBoundingClientRect().x;
    }

    let lengthBounding = lastOffsetX - firstX - rowStart;
    if(lengthBounding === 0)
        lengthBounding = spacingWidth;
    outputRows.push([rowStart, lastOffsetY - firstY, lengthBounding, letterHeight]);

    options.context.restore();

    return outputRows;
}

export function highlightPosition(options : HighlighTextOptions)
{
    options.context.save();

    options.context.fillStyle = options.highlightColor ?? "#00FF00";

    const dimensions = getTextRowsBounding(options);;

    for(let i = 0 ; i < dimensions.length ; i++)
    {
        // offset the highlight 2 pixels down
        options.context.fillRect(dimensions[i][0], dimensions[i][1] + 2 , dimensions[i][2], dimensions[i][3]);
    }

    options.context.stroke();

    options.context.restore();
}

export function highlightGroups(options : HighlighGroupsOptions)
{
    let groups = [...options.groups.values()].sort((a : MatchGroup, b : MatchGroup) => { return a.index - b.index});

    for(let group of groups)
    {
        let color : string;
        if(options.colors === undefined || options.colors.length === 0)
            color = options?.fallbackColor ?? "#EBB044";
        else
            color = options.colors[group.index % options.colors.length];

        highlightPosition({context: options.context, textElement: options.textElement, from: group.strAt[0], to: group.strAt[1], highlightColor: color});
    }
}