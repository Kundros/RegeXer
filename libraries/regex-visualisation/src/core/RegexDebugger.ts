import { MatchAction, RegexMatch } from "@kundros/regexer";
import { Slider, SliderEvent } from "./Slider";
import { sliderSettings } from "./settings/SliderSettings";

export type DebuggerOptions = {
    regexHighlighting?: {
        positionColor?: string,
        backtrackingPositionColor?: string,
        backtrackingDirectionColor?: string
    },
    matchHighlighting?: {
        positionColor?: string,
        backtrackingPositionColor?: string,
        backtrackingDirectionColor?: string
    }
}

export class RegexDebugger {
    constructor(overlay : HTMLElement, openBtn : HTMLElement, debuggerOptions? : DebuggerOptions)
    {
        this.overlay_ = overlay;
        this.openBtn_ = openBtn;
        this.slider_ = new Slider(this.overlay_.querySelector('.regex-debugger-timeline'), sliderSettings);

        this.regexTextContainer_ = this.overlay_.querySelector('.regex-debugger-regex');
        this.regexText_ = this.regexTextContainer_.querySelector('.regex-debugger-regex-text');
        this.regexCanvas_ = this.regexTextContainer_.querySelector('.regex-debugger-regex-canvas');
        this.regexContext_ = this.regexCanvas_.getContext("2d");

        this.matchTextContainer_ = this.overlay_.querySelector('.regex-debugger-string');
        this.matchText_ = this.matchTextContainer_.querySelector('.regex-debugger-string-text');
        this.matchCanvas_ = this.matchTextContainer_.querySelector('.regex-debugger-string-canvas');
        this.matchContext_ = this.matchCanvas_.getContext("2d");

        this.debuggerOptions_ = debuggerOptions;

        this.registerListeners();
    }

    public switchVisibility()
    {
        const overlay = this.overlay_;
        if(overlay.classList.contains('hidden'))
        {
            document.dispatchEvent(new Event("regexDebbugerVisible"));
            overlay.classList.remove('hidden')
        }
        else
            overlay.classList.add('hidden')
    }

    public setRegexText(node : HTMLElement, createClone : boolean = true){
        this.regexText_.innerHTML = "";
        let nodeToInsert : HTMLElement = (createClone) ? (node.cloneNode(true) as HTMLElement) : (node);
        const children = Array.prototype.slice.call(nodeToInsert.childNodes);

        for(let i = 0; i < children.length ;i++)
            this.regexText_.append(children[i]);
    }

    public setMatchStringText(node : HTMLElement, createClone : boolean = true){
        this.matchText_.innerHTML = "";
        let nodeToInsert : HTMLElement = (createClone) ? (node.cloneNode(true) as HTMLElement) : (node);
        const children = Array.prototype.slice.call(nodeToInsert.childNodes);

        for(let i = 0; i < children.length ;i++)
            this.matchText_.append(children[i]);
    }


    public set matches(matches : RegexMatch[]){
        this.matches_ = matches;
    }

    public set steps(steps: number)
    {
        this.slider_.max = steps;
        this.slider_.value = 1;
    }

    private visualizeStep(step: number)
    {
        if(this.matches_ === undefined || this.matches_.length === 0) return;

        const state = this.matches_[0].moveTo(step-1);

        if(state === null) return;

        const boundingRegex = this.regexCanvas_.getBoundingClientRect();
        const boundingMatch = this.matchCanvas_.getBoundingClientRect();

        this.regexContext_.clearRect(0, 0, boundingRegex.width, boundingRegex.height);
        this.regexCanvas_.width = boundingRegex.width;
        this.regexCanvas_.height = boundingRegex.height;

        if(state.regAt[0] !== state.fromExact?.[0])
            this.highlightPosition(state.regAt);

        if(step === 1 && state?.strAt === undefined)
            state.strAt = [0, 0];

        // position has changed
        if(state?.strAt !== undefined)
        {
            this.matchContext_.clearRect(0, 0, boundingMatch.width, boundingMatch.height);
            this.matchCanvas_.width = boundingMatch.width;
            this.matchCanvas_.height = boundingMatch.height;

            this.highlightPosition(state.strAt, false, false);
        }

        // handle backtracking
        if((state.action & MatchAction.BACKTRACKING) && state.fromExact)
        {
            this.highlightPosition(state.fromExact, true);
            
            if(state.regAt[0] !== state.fromExact[0])
                this.drawBacktracking(state.regAt[0], state.fromExact[1]);
        }
    }

    private highlightPosition(position : [number, number], isErr : boolean = false, inRegex : boolean = true)
    {
        const options = inRegex ? this.debuggerOptions_?.regexHighlighting : this.debuggerOptions_?.matchHighlighting;
        const context = inRegex ? this.regexContext_ : this.matchContext_;

        context.save();

        if(isErr)
            context.fillStyle = options?.backtrackingPositionColor ?? "#FF0000";
        else
            context.fillStyle = options?.positionColor ?? "#00FF00";

        const dimensions = this.getLettersSpanDimentions(position[0], position[1]);

        for(let i = 0 ; i < dimensions.length ; i++)
        {
            // offset the highlight 2 pixels down
            context.fillRect(dimensions[i][0], dimensions[i][1] + 2 , dimensions[i][2], dimensions[i][3]);
        }

        context.stroke();

        context.restore();
    }

    private drawBacktracking(from : number, to : number, inRegex : boolean = true)
    {
        const options = inRegex ? this.debuggerOptions_?.regexHighlighting : this.debuggerOptions_?.matchHighlighting;
        const context = inRegex ? this.regexContext_ : this.matchContext_;

        context.save();

        context.fillStyle = options?.backtrackingDirectionColor ?? "#FF0000";
        const dimensions = this.getLettersSpanDimentions(from, to);

        if(dimensions.length === 0)
            return;

        // arrow rect
        context.fillRect(dimensions[0][0] + 4, dimensions[0][1] + 2, dimensions[0][2] - 4, 2);
        for(let i = 1 ; i < dimensions.length ; i++)
        {
            context.fillRect(dimensions[i][0], dimensions[i][1] + 2, dimensions[i][2], 2);
        }

        // arrow head
        context.beginPath();
        context.moveTo(dimensions[0][0], dimensions[0][1] + 3)
        context.lineTo(dimensions[0][0] + 8, dimensions[0][1] + 6);
        context.lineTo(dimensions[0][0] + 8, dimensions[0][1]);
        context.closePath();
        context.fill();
        
        context.restore();
    }

    private getLettersSpanDimentions(from: number, to: number, inRegex : boolean = true) : [number, number, number, number][] // x, y, width, height
    {
        const context = inRegex ? this.regexContext_ : this.matchContext_;
        const textElement = inRegex ? this.regexText_ : this.matchText_;

        context.save();
        context.font = window.getComputedStyle( textElement, null ).getPropertyValue( "font" );

        const text = textElement.textContent;
        const textLength = text.length;

        // compute letter measurements
        const spacing = window.getComputedStyle( textElement, null ).getPropertyValue( "letter-spacing" );
        const lineHeightStr = window.getComputedStyle( textElement, null ).getPropertyValue( "line-height" );
        const spacingWidth = Number.parseInt(spacing.replace("px", ""));
        const lineHeight = Number.parseInt(lineHeightStr.replace("px", ""));
        const letterMeasure = context.measureText("i");
        const letterWidth = letterMeasure.width ;
        const letterHeight = letterMeasure.fontBoundingBoxDescent + letterMeasure.fontBoundingBoxAscent;

        const textBounding = textElement.getBoundingClientRect();
        const maxLineSize = textBounding.width;

        let outputRows = [];
        let yOffset = 0;
        let lastRowSize = 0;
        let currentRowSize = 0;

        for(let i = 0 ; i <= textLength ; i++)
        {
            if(i > to || maxLineSize <= 1)
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

            if(i >= from && i < to)
            {
                if(outputRows.length === 0 || outputRows[outputRows.length-1][1] < yOffset * lineHeight) 
                    outputRows.push([lastRowSize + spacingWidth, yOffset * lineHeight, currentRowSize - lastRowSize - spacingWidth, letterHeight]);
                else
                    outputRows[outputRows.length-1][2] = currentRowSize - outputRows[outputRows.length-1][0];
            }

            if(i === to && i === from)
                outputRows.push([lastRowSize, yOffset * lineHeight, spacingWidth, letterHeight]);

            if(text[i] === '\n')
            {
                currentRowSize = 0;
                yOffset++;
            }
        }

        context.restore();

        return outputRows;
    }

    private registerListeners()
    {
        this.openBtn_.addEventListener('click', () => this.switchVisibility());
        this.overlay_.querySelector('.exit-debug').addEventListener('click', () => this.switchVisibility());
        this.overlay_.addEventListener('mousedown', (event: MouseEvent) => {
            if(event.target === this.overlay_)
                this.switchVisibility();
        });

        this.slider_.parent.addEventListener("cslider", (event : SliderEvent) => this.visualizeStep(event.detail.value));

        const observer = new ResizeObserver((entries) => {
            entries.forEach((entry) => {
                this.visualizeStep(this.slider_.value);
            });    
        });
        
        observer.observe(this.overlay_);
    }

    private overlay_ : HTMLElement;
    private openBtn_ : HTMLElement;
    
    private regexTextContainer_ : HTMLElement;
    private regexText_ : HTMLElement;
    private regexCanvas_ : HTMLCanvasElement;
    private regexContext_ : CanvasRenderingContext2D;

    private matchTextContainer_ : HTMLElement;
    private matchText_ : HTMLElement;
    private matchCanvas_ : HTMLCanvasElement;
    private matchContext_ : CanvasRenderingContext2D;

    private debuggerOptions_? : DebuggerOptions;

    private matches_? : RegexMatch[];
    private slider_ : Slider;
}