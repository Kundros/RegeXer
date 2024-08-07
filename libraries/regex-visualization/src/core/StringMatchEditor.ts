import { RegexMatch } from "@regexer/regex-engine";

import { TextEditor, TextEditorOptions } from "./TextEditor";
import { wrapElement } from "../helpers/elementHelper";
import { getGroupDimensions, getPositionHighlightColor, getTextDimensions, highlightGroups, highlightPosition } from "../helpers/highlightHelper";
import { AppTheme } from "../helpers/themeHelper";
import { HighlighGroupsOptions, HighlighTextOptions, HighlightTypes } from "../types/highlightTypes";
import { Themed } from "../types/themeTypes";
import { clearCanvas } from "../helpers/canvasHelper";
import { ExtendedBindedFunction } from "../types/bindTypes";
import { extendedBind } from "../helpers/bindHelper";

export class StringMatchEditor extends TextEditor implements Themed
{
    constructor(textInput : HTMLElement, canvasElement : HTMLCanvasElement, theme: AppTheme, options?: TextEditorOptions)
    {
        super(textInput, options);
        this.theme_ = theme;

        this.matchSign_ = textInput.parentNode.querySelector(".match-sign");
        this.matchSteps_ = textInput.parentNode.querySelector(".match-steps");
        this.canvas_ = canvasElement;
        this.context_ = canvasElement.getContext("2d");

        const boundingCanvas = this.canvas_.getBoundingClientRect();
        this.canvas_.width = boundingCanvas.width;
        this.canvas_.height = boundingCanvas.height;

        this.highlightsMatch_ = [];
        this.highlightsGroup_ = [];

        this.registerMatchEvents();
    }

    public changeTheme(theme : AppTheme)
    {
        this.theme_ = theme;

        clearCanvas(this.context_, this.canvas_);

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
    }

    /** @description highlights match position (from,to) */
    public highlightMatch(from: number, to: number)
    {
        const highlightMatch = extendedBind(
            highlightPosition, 
            { type: HighlightTypes.DEFAULT }, 
            {
                context: this.context_, 
                textElement: this.textInput_, 
                dimensions: getTextDimensions({textElement: this.textInput_, from, to}),
                highlightColor: getPositionHighlightColor(this.theme_, false, HighlightTypes.DEFAULT)
            }
        );
        
        this.highlightsMatch_.push(highlightMatch);

        highlightMatch();
    }

    public clearMatchesCanvas()
    {
        clearCanvas(this.context_, this.canvas_);
    }

    public highlightMatchesFromRegExp(regexText: string, flags?: string)
    {
        const regex = new RegExp(regexText, flags);

        const textToMatch = this.textInput_.textContent;

        let match : RegExpExecArray;
        let lastIndex = 0;

        this.highlightsMatch_ = [];

        clearCanvas(this.context_, this.canvas_);

        while((match = regex.exec(textToMatch)) !== null)
        {
            if(lastIndex === regex.lastIndex)
                regex.lastIndex += 1;

            this.highlightMatch(match.index, match.index + match[0].length);
            lastIndex = regex.lastIndex;
            
            if(!flags?.includes('g'))
                break;
        }
    }

    /** @description highlights all groups from all matches */
    public highlightGroups(matches : RegexMatch[])
    {
        this.highlightsGroup_ = [];

        for(const match of matches)
        {
            if(match.groups)
            {
                const highlightGroup = extendedBind(
                    highlightGroups, 
                    undefined, 
                    {
                        context: this.context_, 
                        textElement: this.textInput_, 
                        groupsDimensions: getGroupDimensions({
                            context: this.context_, 
                            textElement: this.textInput_, 
                            groups: match.groups
                        }),
                        colors: this.theme_.matchHighlighting.groupColors,
                        fallbackColor: this.theme_.matchHighlighting.groupFallbackColor,
                    }
                );

                this.highlightsGroup_.push(highlightGroup);

                highlightGroup();
            }
        }
    }

    /** @description edits the message that contains basic information about current matching process */
    public updateMatchStatesMessage(steps: number, matches : number)
    {
        this.matchSteps_.replaceChildren(
            wrapElement(matches.toString(), "span", ['match-num-matches']),
            wrapElement(matches == 1 ? "match" : "matches", "span", ['match-label-matches']),
            wrapElement(steps.toString(), "span", ['match-num-steps']),
            wrapElement(steps == 1 ? "step" : "steps", "span", ['match-label-steps'])
        );
    }

    public setSignLoading()
    {
        if(this.matchSign_.classList.contains("match-loading"))
            return;
        this.matchSign_.classList.remove("match-success", "match-unsuccess", "match-idle");
        this.matchSign_.classList.add("match-loading");
    }

    public setSignIdle()
    {
        if(this.matchSign_.classList.contains("match-idle"))
            return;

        this.matchSteps_.replaceChildren();
        this.matchSign_.classList.remove("match-success", "match-unsuccess", "match-loading");
        this.matchSign_.classList.add("match-idle");
    }

    public updateSignSuccess(success: boolean)
    {
        if(!this.matchSign_.classList.contains("match-unsuccess") && !success)
        {
            this.matchSign_.classList.remove("match-success", "match-idle", "match-loading");
            this.matchSign_.classList.add("match-unsuccess");
        }
        else if(!this.matchSign_.classList.contains("match-success") && success)
        {
            this.matchSign_.classList.remove("match-unsuccess", "match-idle", "match-loading");
            this.matchSign_.classList.add("match-success");
        }
    }

    public get isIdle()
    {
        return this.matchSign_.classList.contains("match-idle");
    }

    private registerMatchEvents()
    {
        this.textInput_.addEventListener("scroll", this.reRenderHighlights.bind(this));
    }

    private reRenderHighlights()
    {
        clearCanvas(this.context_, this.canvas_);

        for(const highlightMatch of this.highlightsMatch_)
        {
            highlightMatch();
        }
        
        for(const highlightGroup of this.highlightsGroup_)
        {
            highlightGroup();
        }
    }

    private theme_ ?: AppTheme;

    private matchSign_ : Element;
    private matchSteps_ : Element;
    private context_ : CanvasRenderingContext2D;
    private canvas_ : HTMLCanvasElement;

    
    // Holding information about highlighting
    private highlightsMatch_ : ExtendedBindedFunction<(options: HighlighTextOptions) => void, { type : HighlightTypes }>[];
    private highlightsGroup_ : ExtendedBindedFunction<(options?: HighlighGroupsOptions) => void, undefined>[];
}