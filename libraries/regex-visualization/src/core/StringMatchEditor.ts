import { RegexMatch } from "@regexer/regex-engine";
import { TextEditor, TextEditorOptions } from "./TextEditor";
import { wrapElement } from "./other/elementHelper";
import { HighlighGroupsOptions, HighlighTextOptions, getGroupDimensions, getTextDimensions, highlightGroups, highlightPosition } from "./other/textRowsHighlightHelper";
import { MatchHighlightingOptions } from "./coreTypes/matchHighlightOptions";

export type MatchEditorOptions = 
    TextEditorOptions & 
    MatchHighlightingOptions & 
    {
        highlightColor?: string
    };

export class StringMatchEditor extends TextEditor
{
    constructor(textInput : HTMLElement, canvasElement : HTMLCanvasElement, options?: MatchEditorOptions)
    {
        super(textInput);
        this.matchOptions_ = options;

        this.matchSign_ = textInput.parentNode.querySelector(".match-sign");
        this.matchSteps_ = textInput.parentNode.querySelector(".match-steps");
        this.canvas_ = canvasElement;
        this.context_ = canvasElement.getContext("2d");

        const boundingCanvas = this.canvas_.getBoundingClientRect();
        this.canvas_.width = boundingCanvas.width;
        this.canvas_.height = boundingCanvas.height;
        this.matchesHighlightings_ = [];
        this.groupsHighlightings_ = [];

        this.registerMatchEvents();
    }

    /** @description highlights match position (from,to) */
    public highlightMatch(from: number, to: number)
    {
        
        this.matchesHighlightings_.push({
            context: this.context_, 
            textElement: this.textInput_, 
            dimensions: getTextDimensions({textElement: this.textInput_, from, to}),
            highlightColor: this.matchOptions_?.highlightColor ?? "#2b85c2"
        });
        highlightPosition(this.matchesHighlightings_[this.matchesHighlightings_.length-1]);
    }

    public clearMatchesCanvas()
    {
        const boundingCanvas = this.canvas_.getBoundingClientRect();
        this.canvas_.width = boundingCanvas.width;
        this.canvas_.height = boundingCanvas.height;

        this.context_.clearRect(0, 0, boundingCanvas.width, boundingCanvas.height);
    }

    public highlightMatchesFromRegExp(regexText: string, flags?: string)
    {
        const regex = new RegExp(regexText, flags);

        const textToMatch = this.textInput_.textContent;

        let match : RegExpExecArray;
        let lastIndex = 0;

        this.matchesHighlightings_ = [];

        this.clearMatchesCanvas();

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
        this.groupsHighlightings_ = [];

        for(const match of matches)
        {
            if(match.groups)
            {
                this.groupsHighlightings_.push({
                    context: this.context_, 
                    textElement: this.textInput_, 
                    groupsDimensions: getGroupDimensions({context: this.context_, textElement: this.textInput_, groups: match.groups}),
                    colors: this.matchOptions_.groupColors,
                    fallbackColor: this.matchOptions_.groupFallbackColor,
                });
                highlightGroups(this.groupsHighlightings_[this.groupsHighlightings_.length - 1]);
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
        const boundingCanvas = this.canvas_.getBoundingClientRect();
        this.canvas_.width = boundingCanvas.width;
        this.canvas_.height = boundingCanvas.height;

        this.context_.clearRect(0, 0, boundingCanvas.width, boundingCanvas.height);

        for(const match of this.matchesHighlightings_)
        {
            highlightPosition(match);
        }
        
        for(const group of this.groupsHighlightings_)
        {
            highlightGroups(group);
        }
    }

    private matchOptions_ ?: MatchEditorOptions;

    private matchSign_ : Element;
    private matchSteps_ : Element;
    private context_ : CanvasRenderingContext2D;
    private canvas_ : HTMLCanvasElement;

    
    // Holding information about highlighting
    private matchesHighlightings_ : HighlighTextOptions[];
    private groupsHighlightings_ : HighlighGroupsOptions[];
}