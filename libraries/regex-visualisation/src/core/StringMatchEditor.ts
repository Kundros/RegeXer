import { RegexMatch } from "@kundros/regexer";
import { TextEditor, TextEditorOptions } from "./TextEditor";
import { ElementHelper } from "./other/ElementHelper";
import { highlightGroups, highlightPosition } from "./other/textRowsBoundingHelper";
import { MatchHighlightingOptions } from "./coreTypes/MatchHighlightOptions";

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
        this.matchesSpans_ = [];

        this.registerMatchListeners();
    }

    public highlightMatch(from: number, to: number)
    {
        this.matchesSpans_.push([from, to]);
        highlightPosition({context: this.context_, textElement: this.textInput_, from, to, highlightColor: this.matchOptions_?.highlightColor ?? "#2b85c2"});
    }

    public clearMatchesCanvas()
    {
        const bounding = this.canvas_.getBoundingClientRect();
        this.matchesSpans_ = [];

        this.context_.clearRect(0, 0, bounding.width, bounding.height);
    }

    public highlightMatches(regexText : string, flags?: string)
    {
        const regex = new RegExp(regexText, flags);
        const textToMatch = this.textInput_.textContent;

        let match : RegExpExecArray;
        let lastIndex = 0;

        this.clearMatchesCanvas();

        while((match = regex.exec(textToMatch)) !== null)
        {
            if(lastIndex === regex.lastIndex)
                regex.lastIndex += 1;
            
            this.highlightMatch(match.index, match.index + match[0].length)
            lastIndex = regex.lastIndex;
            
            if(!flags?.includes('g'))
                break;
        }
    }

    public highlightGroups()
    {
        if(!this.matches_)
            return;

        for(let match of this.matches_)
        {
            highlightGroups({
                textElement: this.textInput_,
                groups: match.groups,
                colors: this.matchOptions_.groupColors,
                fallbackColor: this.matchOptions_.groupFallbackColor,
                context: this.context_
            });
        }
    }

    public updateMatchStatesMessage(steps: number, matches : number)
    {
        this.matchSteps_.replaceChildren(
            ElementHelper.wrapElement(matches.toString(), "span", ['match-num-matches']),
            ElementHelper.wrapElement(matches == 1 ? "match" : "matches", "span", ['match-label-matches']),
            ElementHelper.wrapElement(steps.toString(), "span", ['match-num-steps']),
            ElementHelper.wrapElement(steps == 1 ? "step" : "steps", "span", ['match-label-steps'])
        );
    }

    public setLoading()
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

    public set matches(data : RegexMatch[])
    {
        this.matches_ = data;
    }

    public get isIdle()
    {
        return this.matchSign_.classList.contains("match-idle");
    }

    private registerMatchListeners()
    {
        const observer = new ResizeObserver((entries) => {
            entries.forEach((entry) => {
                const boundingCanvas = this.canvas_.getBoundingClientRect();
                this.canvas_.width = boundingCanvas.width;
                this.canvas_.height = boundingCanvas.height;

                this.context_.clearRect(0, 0, boundingCanvas.width, boundingCanvas.height);

                const matchesCount = this.matchesSpans_.length;
                for(let i = 0 ; i < matchesCount ; i++)
                {
                    highlightPosition({
                        context: this.context_, 
                        textElement: this.textInput_, 
                        from: this.matchesSpans_[i][0], 
                        to: this.matchesSpans_[i][1], 
                        highlightColor: this.matchOptions_?.highlightColor ?? "#2b85c2"
                    });
                }

                this.highlightGroups();
            });    
        });

        observer.observe(this.canvas_);
    }

    private matchOptions_ ?: MatchEditorOptions;

    private matches_?: RegexMatch[];
    private matchesSpans_ : [number, number][];

    private matchSign_ : Element;
    private matchSteps_ : Element;
    private context_ : CanvasRenderingContext2D;
    private canvas_ : HTMLCanvasElement;
}