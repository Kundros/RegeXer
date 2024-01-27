import { TextEditor, TextEditorOptions } from "./TextEditor";
import { ElementHelper } from "./other/ElementHelper";
import { highlightPosition } from "./other/textRowsBoundingHelper";

export class StringMatchEditor extends TextEditor
{
    constructor(textInput : HTMLElement, canvasElement : HTMLCanvasElement, options?: TextEditorOptions)
    {
        super(textInput, options);

        this.matchSign_ = textInput.parentNode.querySelector(".match-sign");
        this.matchSteps_ = textInput.parentNode.querySelector(".match-steps");
        this.canvas_ = canvasElement;
        this.context_ = canvasElement.getContext("2d");

        const boundingCanvas = this.canvas_.getBoundingClientRect();
        this.canvas_.width = boundingCanvas.width;
        this.canvas_.height = boundingCanvas.height;
        this.matchesSpans_ = [];

        const observer = new ResizeObserver((entries) => {
            entries.forEach((entry) => {
                const boundingCanvas = this.canvas_.getBoundingClientRect();
                this.canvas_.width = boundingCanvas.width;
                this.canvas_.height = boundingCanvas.height;

                this.context_.clearRect(0, 0, boundingCanvas.width, boundingCanvas.height);

                const matchesCount = this.matchesSpans_.length;
                for(let i = 0 ; i < matchesCount ; i++)
                {
                    highlightPosition({context: this.context_, textElement: this.textInput_, from: this.matchesSpans_[i][0], to: this.matchesSpans_[i][1], highlightColor: "#622c96"});
                }
            });    
        });

        observer.observe(this.canvas_);
    }

    public highlightMatch(from: number, to: number)
    {
        this.matchesSpans_.push([from, to]);
        highlightPosition({context: this.context_, textElement: this.textInput_, from, to, highlightColor: "#622c96"});
    }

    public clearMatchesCanvas()
    {
        const bounding = this.canvas_.getBoundingClientRect();
        this.matchesSpans_ = [];

        this.context_.clearRect(0, 0, bounding.width, bounding.height);
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

    public get isIdle()
    {
        return this.matchSign_.classList.contains("match-idle");
    }

    private matchesSpans_ : [number, number][];
    private matchSign_ : Element;
    private matchSteps_ : Element;
    private context_ : CanvasRenderingContext2D;
    private canvas_ : HTMLCanvasElement;
}