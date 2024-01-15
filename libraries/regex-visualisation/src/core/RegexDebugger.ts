import { MatchAction, RegexMatch } from "@kundros/regexer";
import { Slider, SliderEvent } from "./Slider";
import { sliderSettings } from "./settings/SliderSettings";

export type DebuggerOptions = {
    regexHighlighting?: {
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
        this.matchText_ = this.overlay_.querySelector('.regex-debugger-string');

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

    public set matches(matches : RegexMatch[]){
        this.matches_ = matches;
    }

    public set steps(steps: number)
    {
        this.slider_.max = steps;
        this.slider_.value = 1;
    }

    private visualizeStep(step: number, isErr: boolean = false)
    {
        if(this.matches_ === undefined || this.matches_.length === 0) return;

        const state = this.matches_[0].moveTo(step-1);
        const bounding = this.regexCanvas_.getBoundingClientRect();

        if(state === null) return;;

        this.regexContext_.clearRect(0, 0, bounding.width, bounding.height);
        this.regexCanvas_.width = bounding.width;
        this.regexCanvas_.height = bounding.height;

        this.regexContext_.save();

        this.highlightPosition(state.regAt);

        // handle backtracking
        if((state.action & MatchAction.BACKTRACKING) && state.fromExact)
        {
            this.highlightPosition(state.fromExact, true);
            this.drawBacktracking(state.regAt[0], state.fromExact[1]);
        }
    }

    private highlightPosition(position : [number, number], isErr: boolean = false)
    {
        const regexOptions = this.debuggerOptions_?.regexHighlighting;

        this.regexContext_.save();

        if(isErr)
            this.regexContext_.fillStyle = regexOptions?.backtrackingPositionColor ?? "#FF0000";
        else
            this.regexContext_.fillStyle = regexOptions?.positionColor ?? "#00FF00";

        const dimensions = this.getLettersSpanDimentions(position[0], position[1]);

        // offset the highlight 2 pixels down
        for(let i = 0 ; i < dimensions.length ; i++)
        {
            this.regexContext_.fillRect(dimensions[i][0], dimensions[i][1] + 2, dimensions[i][2], dimensions[i][3]);
        }
        this.regexContext_.stroke();

        this.regexContext_.restore();
    }

    private drawBacktracking(from : number, to : number)
    {
        const regexOptions = this.debuggerOptions_?.regexHighlighting;

        this.regexContext_.save();

        this.regexContext_.fillStyle = regexOptions?.backtrackingDirectionColor ?? "#FF0000";
        const dimensions = this.getLettersSpanDimentions(from, to);

        // arrow rect
        this.regexContext_.fillRect(dimensions[0][0] + 4, dimensions[0][1] + 2, dimensions[0][2] - 4, 2);

        // arrow head
        this.regexContext_.beginPath();
        this.regexContext_.moveTo(dimensions[0][0], dimensions[0][1] + 3)
        this.regexContext_.lineTo(dimensions[0][0] + 8, dimensions[0][1] + 6);
        this.regexContext_.lineTo(dimensions[0][0] + 8, dimensions[0][1]);
        this.regexContext_.closePath();
        this.regexContext_.fill();
        
        this.regexContext_.restore();
    }

    private getLettersSpanDimentions(from: number, to: number) : [number, number, number, number][] // x, y, width, height
    {
        this.regexContext_.save();
        this.regexContext_.font = window.getComputedStyle( this.regexText_, null ).getPropertyValue( "font" );

        const text = this.regexText_.textContent;
        const textLength = text.length;

        // compute letter measurements
        const spacing = window.getComputedStyle( this.regexText_, null ).getPropertyValue( "letter-spacing" );
        const lineHeightStr = window.getComputedStyle( this.regexText_, null ).getPropertyValue( "line-height" );
        const spacingWidth = Number.parseInt(spacing.replace("px", ""));
        const lineHeight = Number.parseInt(lineHeightStr.replace("px", ""));
        const letterMeasure = this.regexContext_.measureText("i");
        const letterWidth = letterMeasure.width ;
        const letterHeight = letterMeasure.fontBoundingBoxDescent + letterMeasure.fontBoundingBoxAscent;

        const textBounding = this.regexText_.getBoundingClientRect();
        const maxLineCharacters = Math.floor(textBounding.width/(letterWidth+spacingWidth));

        this.regexContext_.restore();


        let outputRows = [];

        let tempEnd = maxLineCharacters; 
        let yOffset = Math.floor(from/maxLineCharacters);

        from %= maxLineCharacters;
        to -= yOffset * maxLineCharacters;

        while(tempEnd < to)
        {
            const selection = to - from;

            let startX = from * (letterWidth + spacingWidth) + spacingWidth;
            let endX = selection * letterWidth + (selection-1) * spacingWidth;
            outputRows.push([startX, yOffset * lineHeight, endX, letterHeight]);

            from = 0;
            to -= maxLineCharacters;
            yOffset++;
            tempEnd = maxLineCharacters;
        }

        const selection = to - from;

        let startX = from * (letterWidth + spacingWidth) + spacingWidth;
        let endX = selection * letterWidth + (selection-1) * spacingWidth;
        outputRows.push([startX, yOffset * lineHeight, endX, letterHeight]);

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

        this.slider_.parent.addEventListener("cslider", (event : SliderEvent) => {
            this.visualizeStep(event.detail.value);
        });

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
    private matchText_ : HTMLElement;
    private regexCanvas_ : HTMLCanvasElement;
    private regexContext_ : CanvasRenderingContext2D;

    private debuggerOptions_? : DebuggerOptions;

    private matches_? : RegexMatch[];
    private slider_ : Slider;
}