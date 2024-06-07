import { MatchAction, MatchState, RegexMatch } from "@kundros/regexer";
import { Slider, SliderEvent } from "./Slider";
import { sliderSettings } from "./settings/SliderSettings";
import { getGroupDimensions, getTextDimensions, highlightBacktracking, highlightGroups, highlightPosition } from "./other/textRowsHighlightHelper";
import { MatchHighlightingOptions } from "./coreTypes/MatchHighlightOptions";
import { RegexHighlightingOptions } from "./coreTypes/RegexHighlightOptions";

export type DebuggerOptions = {
    regexHighlighting?: RegexHighlightingOptions,
    matchHighlighting?: MatchHighlightingOptions
}

const HighlightingTypes = 
{
    DEFAULT: 0x0,
    ERROR: 0x1,
    INFORMATIVE: 0x2
} as const;

type HighlightingTypes = typeof HighlightingTypes[keyof typeof HighlightingTypes];

/** @description handles debugger window */
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

        this.highlightsMatch_ = [];
        this.highlightsRegex_ = [];

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
        const nodeToInsert : HTMLElement = (createClone) ? (node.cloneNode(true) as HTMLElement) : (node);
        const children = Array.prototype.slice.call(nodeToInsert.childNodes);

        for(let i = 0; i < children.length ;i++)
            this.regexText_.append(children[i]);
    }

    public setMatchStringText(node : HTMLElement, createClone : boolean = true){
        this.matchText_.innerHTML = "";
        const nodeToInsert : HTMLElement = (createClone) ? (node.cloneNode(true) as HTMLElement) : (node);
        const children = Array.prototype.slice.call(nodeToInsert.childNodes);

        for(let i = 0; i < children.length ;i++)
            this.matchText_.append(children[i]);
    }

    public resetSteps()
    {
        this.slider_.value = this.slider_.min;
    }

    public get visible()
    {
        return !this.overlay_.classList.contains("hidden");
    }

    public set matches(matches : RegexMatch[]){
        this.matches_ = matches;
    }

    public set steps(steps : number)
    {
        this.slider_.max = steps;
    }
    
    public set options(newOptions : DebuggerOptions)
    {
         this.debuggerOptions_ = newOptions;
    }

    private visualizeStep(step : number, matchIndex : number = 0)
    {
        if(this.matches_ === undefined || this.matches_.length <= matchIndex) 
            return;

        const state = this.matches_[matchIndex].moveTo(step-1);

        if(state === null) 
            return;

        const boundingRegex = this.regexCanvas_.getBoundingClientRect();
        const boundingMatch = this.matchCanvas_.getBoundingClientRect();

        this.highlightsMatch_ = [];
        this.highlightsRegex_ = [];

        this.regexContext_.clearRect(0, 0, boundingRegex.width, boundingRegex.height);
        this.regexCanvas_.width = boundingRegex.width;
        this.regexCanvas_.height = boundingRegex.height;

        if(step === 1 && state?.strAt === undefined)
            state.strAt = [0, 0];

        if(state.regAt[0] !== state.fromExact?.[0])
            this.highlightPosition(state.regAt[0] - this.offset, state.regAt[1] - this.offset);

        // string position highlight
        if(state?.strAt !== undefined)
        {
            this.matchContext_.clearRect(0, 0, boundingMatch.width, boundingMatch.height);
            this.matchCanvas_.width = boundingMatch.width;
            this.matchCanvas_.height = boundingMatch.height;

            for(let i = 0 ; i < matchIndex ; i++)
            {
                const match = this.matches_[matchIndex];
                const matchDone = match.moveTo(match.statesLength-1);

                this.highlightPosition(matchDone.strAt[0] , matchDone.strAt[1], HighlightingTypes.DEFAULT, false);
                this.highlightGroups(matchDone);
            }

            this.highlightPosition(state.strAt[0] , state.strAt[1], HighlightingTypes.DEFAULT, false);
            this.highlightGroups(state);
        }

        // informative regex highlight
        if(state.action & MatchAction.SHOWCASE)
        {
            this.highlightPosition(state.regAt[0] - this.offset, state.regAt[1] - this.offset, HighlightingTypes.INFORMATIVE);
        }

        // handle backtracking
        if((state.action & MatchAction.BACKTRACKING) && state.fromExact)
        {
            this.highlightPosition(state.fromExact[0] - this.offset, state.fromExact[1] - this.offset, HighlightingTypes.ERROR);
            
            if(state.regAt[0] !== state.fromExact[0])
                this.drawBacktracking(state.regAt[0] - this.offset, state.fromExact[1]  - this.offset);
        }
    }

    private highlightGroups(state : MatchState)
    {
        if(state?.groups === undefined)
            return;

        const toHighlight = highlightGroups.bind(undefined, {
            textElement: this.matchText_,
            groupsDimensions: getGroupDimensions({
                textElement: this.matchText_,
                groups: state?.groups,
                context: this.matchContext_
            }),
            colors: this.debuggerOptions_.matchHighlighting.groupColors,
            fallbackColor: this.debuggerOptions_.matchHighlighting.groupFallbackColor,
            context: this.matchContext_,
            offsetY: 6
        });

        this.highlightsMatch_.push(toHighlight);
        toHighlight();
    }

    private highlightPosition(from : number, to: number, highlightingType : HighlightingTypes = HighlightingTypes.DEFAULT, inRegex : boolean = true)
    {
        const options = inRegex ? this.debuggerOptions_?.regexHighlighting : this.debuggerOptions_?.matchHighlighting;
        const context = inRegex ? this.regexContext_ : this.matchContext_;
        const textElement = inRegex ? this.regexText_ : this.matchText_;
        let color : string;

        if(from < 0)
            from = 0;

        if(to < 0)
            to = 0;

        if(highlightingType === HighlightingTypes.ERROR)
            color = options?.backtrackingPositionColor ?? "#FF0000";
        else if(highlightingType === HighlightingTypes.INFORMATIVE && options)
            color = (options as RegexHighlightingOptions)?.informativeColor ?? options?.backtrackingPositionColor ?? "#00FF00";
        else
            color = options?.positionColor ?? "#00FF00";
        
        const toHighlight = highlightPosition.bind(undefined, {
            dimensions: getTextDimensions({textElement, from, to}), 
            highlightColor: color,
            context, 
            textElement,  
            offsetY: 6
        });

        if(inRegex)
            this.highlightsRegex_.push(toHighlight);
        else
            this.highlightsMatch_.push(toHighlight);

        toHighlight();
    }

    private drawBacktracking(from : number, to : number, inRegex : boolean = true)
    {
        const options = inRegex ? this.debuggerOptions_?.regexHighlighting : this.debuggerOptions_?.matchHighlighting;
        const context = inRegex ? this.regexContext_ : this.matchContext_;
        const textElement = this.regexText_;

        const toHighlight = highlightBacktracking.bind(undefined, {
            dimensions : getTextDimensions({textElement, from, to}), 
            context, 
            textElement, 
            highlightColor : options?.backtrackingDirectionColor ?? "#FF0000", 
            offsetY: 4
        });

        this.highlightsRegex_.push(toHighlight);
        toHighlight();
    }

    private registerListeners()
    {
        this.openBtn_.addEventListener('click', () => this.switchVisibility());
        this.overlay_.querySelector('.exit-debug').addEventListener('click', () => this.switchVisibility());
        this.slider_.parent.addEventListener("cslider", (event : SliderEvent) => this.visualizeStep(event.detail.value));
        
        this.overlay_.addEventListener('mousedown', (event: MouseEvent) => {
            if(event.target === this.overlay_)
            {
                this.switchVisibility();
            }
        });


        const observer = new ResizeObserver(() => { this.visualizeStep(this.slider_.value); });
        observer.observe(this.overlay_);
        
        // scroll on match container
        this.matchText_.addEventListener("scroll", () => { 
            const boundingMatch = this.matchCanvas_.getBoundingClientRect();

            this.matchContext_.clearRect(0, 0, boundingMatch.width, boundingMatch.height);
            this.matchCanvas_.width = boundingMatch.width;
            this.matchCanvas_.height = boundingMatch.height;

            for(const matchHighlight of this.highlightsMatch_)
                matchHighlight();
            
        });

        // scroll on regex container
        this.regexText_.addEventListener("scroll", () => {
            const boundingRegex = this.regexCanvas_.getBoundingClientRect();

            this.regexContext_.clearRect(0, 0, boundingRegex.width, boundingRegex.height);
            this.regexCanvas_.width = boundingRegex.width;
            this.regexCanvas_.height = boundingRegex.height;

            for(const regexHighlight of this.highlightsRegex_)
                regexHighlight();
            
        });
    }
    
    public offset : number = 0;

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

    // Holding information about highlighting
    private highlightsRegex_ : (() => void)[];
    private highlightsMatch_ : (() => void)[];
}