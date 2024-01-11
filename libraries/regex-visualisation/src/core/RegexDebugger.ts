import { RegexMatch } from "@kundros/regexer";
import { Slider, SliderEvent } from "./Slider";
import { sliderSettings } from "./settings/SliderSettings";

export type DebuggerOptions = {
    regexHighlighting?: {
        positionColor?: string
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

    private visualizeStep(step: number)
    {
        if(this.matches_ === undefined || this.matches_.length === 0) return;

        const state = this.matches_[0].moveTo(step-1);
        const bounding = this.regexCanvas_.getBoundingClientRect();
        const regexOptions = this.debuggerOptions_?.regexHighlighting;

        if(state === null) return;;

        this.regexCanvas_.width = bounding.width;
        this.regexCanvas_.height = bounding.height;

        this.regexContext_.save();
        this.regexContext_.fillStyle = regexOptions?.positionColor ?? "#FF0000";
        this.regexContext_.font = window.getComputedStyle( this.regexText_, null ).getPropertyValue( "font" );

        const spacing = window.getComputedStyle( this.regexText_, null ).getPropertyValue( "letter-spacing" );
        const spacingNumber = Number.parseInt(spacing.replace("px", ""));
        const letterMeasure = this.regexContext_.measureText("i");
        const letterWidth = letterMeasure.width + spacingNumber;
        const letterHeight = letterMeasure.fontBoundingBoxDescent + letterMeasure.fontBoundingBoxAscent;

        this.regexContext_.clearRect(0, 0, bounding.width, bounding.height);
        
        this.regexContext_.fillRect(state.regAt[0] * letterWidth, 0, (state.regAt[1] - state.regAt[0]) * letterWidth, letterHeight);
        this.regexContext_.stroke();

        this.regexContext_.restore();
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