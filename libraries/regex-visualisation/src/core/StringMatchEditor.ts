import { TextEditor, TextEditorOptions } from "./TextEditor";
import { ElementHelper } from "./other/ElementHelper";
import { getCursorPosition, setCursorPosition } from "./other/caretHelper";

export class StringMatchEditor extends TextEditor
{
    constructor(textInput : HTMLElement, options?: TextEditorOptions)
    {
        super(textInput, options);

        this.matchSign_ = textInput.parentNode.querySelector(".match-sign");
        this.matchSteps_ = textInput.parentNode.querySelector(".match-steps");
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

    private matchSign_ : Element;
    private matchSteps_ : Element;
}