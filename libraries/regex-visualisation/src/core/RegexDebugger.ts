import { MatchAction, RegexMatch } from "@kundros/regexer";
import { Slider, SliderEvent } from "./Slider";
import { sliderSettings } from "./settings/SliderSettings";
import { GroupBoundingsOptions, HighlighGroupsOptions, HighlighTextOptions, getGroupBoundings, getTextBounding, highlightGroups, highlightPosition } from "./other/textRowsBoundingHelper";
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

        this.groupsHighlightings_ = [];
        this.matchesHighlights_ = [];

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

    private visualizeStep(step : number, index : number = 0)
    {
        if(this.matches_ === undefined || this.matches_.length <= index) return;
        const state = this.matches_[index].moveTo(step-1);

        if(state === null) return;

        const boundingRegex = this.regexCanvas_.getBoundingClientRect();
        const boundingMatch = this.matchCanvas_.getBoundingClientRect();

        this.regexContext_.clearRect(0, 0, boundingRegex.width, boundingRegex.height);
        this.regexCanvas_.width = boundingRegex.width;
        this.regexCanvas_.height = boundingRegex.height;

        if(state.regAt[0] !== state.fromExact?.[0])
            this.highlightPosition(state.regAt[0] - this.offset, state.regAt[1] - this.offset);

        if(step === 1 && state?.strAt === undefined)
            state.strAt = [0, 0];

        // string position highlight
        if(state?.strAt !== undefined)
        {
            this.matchContext_.clearRect(0, 0, boundingMatch.width, boundingMatch.height);
            this.matchCanvas_.width = boundingMatch.width;
            this.matchCanvas_.height = boundingMatch.height;

            this.highlightPosition(state.strAt[0] , state.strAt[1], HighlightingTypes.DEFAULT, false, index);
        }

        // string groups highlight
        if(state?.groups !== undefined)
        {
            const groupsInformation : HighlighGroupsOptions = {
                textElement: this.matchText_,
                groupsBoundings: getGroupBoundings({
                    textElement: this.matchText_,
                    groups: state?.groups,
                    context: this.matchContext_
                }),
                colors: this.debuggerOptions_.matchHighlighting.groupColors,
                fallbackColor: this.debuggerOptions_.matchHighlighting.groupFallbackColor,
                context: this.matchContext_
            };

            if(index >= this.groupsHighlightings_.length)
                this.groupsHighlightings_.push(groupsInformation);
            else
                this.groupsHighlightings_[index] = groupsInformation;
            
            for(const matchGroups of this.groupsHighlightings_)
                highlightGroups(matchGroups);
        }
        else
        {
            this.groupsHighlightings_[index] = undefined;
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

    private highlightPosition(from : number, to: number, highlightingType : HighlightingTypes = HighlightingTypes.DEFAULT, inRegex : boolean = true, index : number = 0)
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

        if(inRegex)
        {
            this.regexHighlights_ = {boundings: getTextBounding({textElement, from, to}), highlightColor: color, context, textElement};
            highlightPosition(this.regexHighlights_);
        }
        else
        {
            const highlightInformation : HighlighTextOptions = {
                boundings: getTextBounding({textElement, from, to}), 
                highlightColor: color, 
                context, 
                textElement
            };

            if(index >= this.matchesHighlights_.length)
                this.matchesHighlights_.push(highlightInformation);
            else
                this.matchesHighlights_[index] = highlightInformation;

            for(const match of this.matchesHighlights_)
                highlightPosition(match);
        }
    }

    private drawBacktracking(from : number, to : number, inRegex : boolean = true)
    {
        const options = inRegex ? this.debuggerOptions_?.regexHighlighting : this.debuggerOptions_?.matchHighlighting;
        const context = inRegex ? this.regexContext_ : this.matchContext_;

        context.save();

        context.fillStyle = options?.backtrackingDirectionColor ?? "#FF0000";
        const dimensions = getTextBounding({textElement: this.regexText_, from, to});

        if(dimensions.length === 0)
            return;

        const startX = dimensions[0][0];

        // arrow rect
        context.fillRect(dimensions[0][0] + 6, dimensions[0][1] + 2, dimensions[0][2] - 6, 2);
        for(let i = 1 ; i < dimensions.length ; i++)
        {
            if(dimensions[i][0] >= startX + 6 || dimensions[i][0] <= startX - 1)
                context.fillRect(dimensions[i][0], dimensions[i][1] + 2, dimensions[i][2], 2);
            else
                context.fillRect(dimensions[i][0] + 6, dimensions[i][1] + 2, dimensions[i][2] + 6, 2);
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

    private registerListeners()
    {
        this.openBtn_.addEventListener('click', () => this.switchVisibility());
        this.overlay_.querySelector('.exit-debug').addEventListener('click', () => this.switchVisibility());
        this.overlay_.addEventListener('mousedown', (event: MouseEvent) => {
            if(event.target === this.overlay_)
                this.switchVisibility();
        });

        this.slider_.parent.addEventListener("cslider", (event : SliderEvent) => this.visualizeStep(event.detail.value));

        const observer = new ResizeObserver(() => { this.visualizeStep(this.slider_.value); });
        observer.observe(this.overlay_);
        
        // scroll on match container
        this.matchText_.addEventListener("scroll", () => { 
            const boundingMatch = this.matchCanvas_.getBoundingClientRect();

            this.matchContext_.clearRect(0, 0, boundingMatch.width, boundingMatch.height);
            this.matchCanvas_.width = boundingMatch.width;
            this.matchCanvas_.height = boundingMatch.height;

            for(const match of this.matchesHighlights_)
                highlightPosition(match);
            for(const matchGroups of this.groupsHighlightings_)
                highlightGroups(matchGroups);
        });

        // scroll on regex container
        this.regexText_.addEventListener("scroll", () => {
            const boundingRegex = this.regexCanvas_.getBoundingClientRect();

            this.regexContext_.clearRect(0, 0, boundingRegex.width, boundingRegex.height);
            this.regexCanvas_.width = boundingRegex.width;
            this.regexCanvas_.height = boundingRegex.height;

            if(this.regexHighlights_) 
                highlightPosition(this.regexHighlights_); 
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
    private groupsHighlightings_ : HighlighGroupsOptions[];
    private regexHighlights_? : HighlighTextOptions;
    private matchesHighlights_ : HighlighTextOptions[];
}