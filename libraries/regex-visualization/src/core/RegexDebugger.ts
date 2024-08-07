import { MatchAction, MatchState, RegexMatch } from "@regexer/regex-engine";

import { Slider, SliderEvent } from "./Slider";
import { sliderSettings } from "../settings/sliderSettings";

import { AppTheme } from "../helpers/themeHelper";
import { extendedBind } from "../helpers/bindHelper";
import { clearCanvas } from "../helpers/canvasHelper";
import { 
    getGroupDimensions, 
    getTextDimensions, 
    highlightBacktracking, 
    highlightGroups, 
    highlightPosition, 
    getPositionHighlightColor
} from "../helpers/highlightHelper";

import { HighlighGroupsOptions, HighlighTextOptions, HighlightTypes } from "../types/highlightTypes";
import { Themed } from "../types/themeTypes";
import { ExtendedBindedFunction } from "../types/bindTypes";

export const eventRegexDebbugerVisible = "regexDebbugerVisible" as const;

/** @description handles debugger window */
export class RegexDebugger implements Themed 
{
    constructor(overlay : HTMLElement, openBtn : HTMLElement, theme? : AppTheme)
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
        this.highlightsGroup_ = [];

        this.theme_ = theme;

        this.registerListeners();
    }

    public changeTheme(theme : AppTheme)
    {
        this.theme_ = theme;

        clearCanvas(this.matchContext_, this.matchCanvas_);
        clearCanvas(this.regexContext_, this.regexCanvas_);

        for(const matchHighlight of this.highlightsMatch_)
        {
            matchHighlight.__boundArguments__[0].highlightColor = getPositionHighlightColor(theme, false, matchHighlight.__boundThis__.type);
            matchHighlight();
        }
        
        for(const groupHighlight of this.highlightsGroup_)
        {
            groupHighlight.__boundArguments__[0].colors = theme.matchHighlighting.groupColors;
            groupHighlight.__boundArguments__[0].fallbackColor = theme.matchHighlighting.groupFallbackColor;
            groupHighlight();
        }

        for(const regexHighlight of this.highlightsRegex_)
        {
            regexHighlight.__boundArguments__[0].highlightColor = getPositionHighlightColor(theme, true, regexHighlight.__boundThis__.type);
            regexHighlight();
        }
    }

    public rerenderMatchHighlights()
    {
        clearCanvas(this.matchContext_, this.matchCanvas_);

        for(const matchHighlight of this.highlightsMatch_)
            matchHighlight();
        
        for(const groupHighlight of this.highlightsGroup_)
            groupHighlight();
    }

    public rerenderRegexHighlights()
    {
        clearCanvas(this.regexContext_, this.regexCanvas_);

        for(const regexHighlight of this.highlightsRegex_)
            regexHighlight();
    }

    public switchVisibility()
    {
        const overlay = this.overlay_;

        if(overlay.classList.contains('hidden'))
        {
            document.dispatchEvent(new Event(eventRegexDebbugerVisible));
            overlay.classList.remove('hidden');
        }
        else
        {
            overlay.classList.add('hidden');
        }
    }

    public setRegexText(node : HTMLElement, createClone : boolean = true)
    {
        this.regexText_.innerHTML = "";

        const nodeToInsert : HTMLElement = (createClone) ? (node.cloneNode(true) as HTMLElement) : (node);
        const children = Array.prototype.slice.call(nodeToInsert.childNodes);

        for(let i = 0 ; i < children.length ; i++)
            this.regexText_.append(children[i]);
    }

    public setMatchStringText(node : HTMLElement, createClone : boolean = true)
    {
        this.matchText_.innerHTML = "";

        const nodeToInsert : HTMLElement = (createClone) ? (node.cloneNode(true) as HTMLElement) : (node);
        const children = Array.prototype.slice.call(nodeToInsert.childNodes);

        for(let i = 0 ; i < children.length ; i++)
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

    public set matches(matches : RegexMatch[])
    {
        this.matches_ = matches;
    }

    public set steps(steps : number)
    {
        this.slider_.max = steps;
    }
    
    public set options(newOptions : AppTheme)
    {
         this.theme_ = newOptions;
    }

    private visualizeStep(step : number, matchIndex : number = 0)
    {
        if(this.matches_ === undefined || this.matches_.length <= matchIndex) 
            return;

        const state = this.matches_[matchIndex].moveTo(step - 1);

        if(state === null) 
            return;
        

        this.highlightsMatch_ = [];
        this.highlightsRegex_ = [];

        clearCanvas(this.regexContext_, this.regexCanvas_);

        if(step === 1 && state?.strAt === undefined)
            state.strAt = [0, 0];


        // highlight - match position
        if(state?.strAt !== undefined)
        {
            clearCanvas(this.matchContext_, this.matchCanvas_);

            for(let i = 0 ; i < matchIndex ; i++)
            {
                const match = this.matches_[matchIndex];
                const matchDone = match.moveTo(match.statesLength - 1);

                this.highlightPosition(matchDone.strAt[0] , matchDone.strAt[1], HighlightTypes.DEFAULT, false);
                this.highlightGroups(matchDone);
            }

            this.highlightPosition(state.strAt[0] , state.strAt[1], HighlightTypes.DEFAULT, false);
            this.highlightGroups(state);
        }

        // highlight - regex position
        if(state.regAt[0] !== state.fromExact?.[0])
        {
            const highlightType = 
                state.action & MatchAction.SHOWCASE ? 
                HighlightTypes.INFORMATIVE : 
                HighlightTypes.DEFAULT;

            this.highlightPosition(state.regAt[0] - this.offset, state.regAt[1] - this.offset, highlightType);
        }

        // highlight - backtracking
        if((state.action & MatchAction.BACKTRACKING) && state.fromExact)
        {
            this.highlightPosition(state.fromExact[0] - this.offset, state.fromExact[1] - this.offset, HighlightTypes.ERROR);
            
            if(state.regAt[0] !== state.fromExact[0])
                this.drawBacktracking(state.regAt[0] - this.offset, state.fromExact[1] - this.offset);
        }
    }

    private highlightGroups(state : MatchState)
    {
        if(state?.groups === undefined)
            return;

        const toHighlight = extendedBind(
            highlightGroups, 
            undefined, 
            {
                textElement: this.matchText_,
                groupsDimensions: getGroupDimensions({
                    textElement: this.matchText_,
                    groups: state?.groups,
                    context: this.matchContext_
                }),
                colors: this.theme_.matchHighlighting.groupColors,
                fallbackColor: this.theme_.matchHighlighting.groupFallbackColor,
                context: this.matchContext_,
                offsetY: 6
            }
        );

        this.highlightsGroup_.push(toHighlight);
        toHighlight();
    }

    private highlightPosition(from : number, to: number, highlightType : HighlightTypes = HighlightTypes.DEFAULT, inRegex : boolean = true)
    {
        const context = inRegex ? this.regexContext_ : this.matchContext_;
        const textElement = inRegex ? this.regexText_ : this.matchText_;

        if(from < 0)
            from = 0;

        if(to < 0)
            to = 0;
        
        const toHighlight = extendedBind(
            highlightPosition, 
            { type: highlightType }, 
            {
                dimensions: getTextDimensions({textElement, from, to}), 
                highlightColor: getPositionHighlightColor(this.theme_, inRegex, highlightType),
                context, 
                textElement,  
                offsetY: 6
            }
        );

        if(inRegex)
            this.highlightsRegex_.push(toHighlight);
        else
            this.highlightsMatch_.push(toHighlight);

        toHighlight();
    }

    private drawBacktracking(from : number, to : number, inRegex : boolean = true)
    {
        const context = inRegex ? this.regexContext_ : this.matchContext_;
        const textElement = this.regexText_;

        const toHighlight = extendedBind(
            highlightBacktracking, 
            { type: HighlightTypes.BACKTRACKING }, 
            {
                dimensions : getTextDimensions({textElement, from, to}), 
                highlightColor : getPositionHighlightColor(this.theme_, inRegex, HighlightTypes.BACKTRACKING), 
                context, 
                textElement, 
                offsetY: 4
            }
        );

        this.highlightsRegex_.push(toHighlight);
        toHighlight();
    }

    private registerListeners()
    {
        this.openBtn_.addEventListener('click', () => this.switchVisibility());
        this.overlay_.querySelector('.exit-debug').addEventListener('click', () => this.switchVisibility());
        this.slider_.parent.addEventListener('cslider', (event : SliderEvent) => this.visualizeStep(event.detail.value));
        
        this.overlay_.addEventListener('mousedown', (event: MouseEvent) => {
            if(event.target === this.overlay_)
            {
                this.switchVisibility();
            }
        });


        // if the window dimensions chnge it is necessary to compute highlightings again
        const observer = new ResizeObserver(() => { 
            this.visualizeStep(this.slider_.value); 
        });
        observer.observe(this.overlay_);
        
        // scroll on match container
        this.matchText_.addEventListener('scroll', this.rerenderMatchHighlights.bind(this));

        // scroll on regex container
        this.regexText_.addEventListener('scroll', this.rerenderRegexHighlights.bind(this));
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

    private theme_? : AppTheme;
    private matches_? : RegexMatch[];
    private slider_ : Slider;

    // Holding information about highlighting
    private highlightsRegex_ : ExtendedBindedFunction<(options: HighlighTextOptions) => void, { type : HighlightTypes }>[];
    private highlightsMatch_ : ExtendedBindedFunction<(options: HighlighTextOptions) => void, { type : HighlightTypes }>[];
    private highlightsGroup_ : ExtendedBindedFunction<(options?: HighlighGroupsOptions) => void, undefined>[];
}