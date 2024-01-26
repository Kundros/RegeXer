export type RowsBoundingOptions = {
    context : CanvasRenderingContext2D, 
    textElement : HTMLElement, 
    from: number,
    to: number
}

export type HighlighTextOptions = RowsBoundingOptions & {
    highlightColor ?: string
}

export function getTextRowsBounding(options : RowsBoundingOptions) : [number, number, number, number][] // x, y, width, height
{
    options.context.save();
    options.context.font = window.getComputedStyle( options.textElement, null ).getPropertyValue( "font" );

    const text = options.textElement.textContent;
    const textLength = text.length;

    //compute box sizing
    const computedStyle = window.getComputedStyle( options.textElement, null );
    const spacingWidth = Number.parseInt(computedStyle.letterSpacing);
    const lineHeight = Number.parseInt(computedStyle.lineHeight);

    // compute letter measurements
    const letterMeasure = options.context.measureText("i");
    const letterWidth = letterMeasure.width ;
    const letterHeight = letterMeasure.fontBoundingBoxDescent + letterMeasure.fontBoundingBoxAscent;

    const maxLineSize = options.textElement.clientWidth;

    let outputRows = [];
    let yOffset = 0;
    let scrollOffset = options.textElement.scrollTop;
    let lastRowSize = 0;
    let currentRowSize = 0;

    for(let i = 0 ; i <= textLength ; i++)
    {
        if(i > options.to || maxLineSize <= 1)
            break;

        lastRowSize = currentRowSize;
        currentRowSize += letterWidth + spacingWidth;

        if(currentRowSize > maxLineSize)
        {
            i--;
            currentRowSize = 0;
            yOffset++;
            continue;
        }

        const yPos = (yOffset * lineHeight) - scrollOffset;

        // skip unvisible rows
        if(yPos + letterHeight < 0)
        {
            if(text[i] === '\n')
            {
                currentRowSize = 0;
                yOffset++;
            }
            continue;
        }
        else if(yPos > options.textElement.clientHeight)
        {
            break;
        }

        // add new row or update existing
        if(i >= options.from && i < options.to)
        {
            if(outputRows.length === 0 || outputRows[outputRows.length-1][1] < yPos) 
                outputRows.push([lastRowSize + spacingWidth, yPos, currentRowSize - lastRowSize - spacingWidth, letterHeight]);
            else
                outputRows[outputRows.length-1][2] = currentRowSize - outputRows[outputRows.length-1][0];
        }

        if(i === options.to && i === options.from)
            outputRows.push([lastRowSize, yPos, spacingWidth, letterHeight]);

        if(text[i] === '\n')
        {
            currentRowSize = 0;
            yOffset++;
        }
    }

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