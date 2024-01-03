import { TextEditor, TextEditorOptions } from "./TextEditor";
import { ElementHelper } from "./other/ElementHelper";
import { getCursorPosition, setCursorPosition } from "./other/caretHelper";

export class StringMatchEditor extends TextEditor
{
    constructor(textInput : HTMLElement, options?: TextEditorOptions)
    {
        super(textInput, options);

        this.matchSign_ = textInput.parentNode.querySelector(".match-sign");
    }

    public setLoading()
    {
        if(this.matchSign_.classList.contains("match-loading"))
            return;
        this.matchSign_.classList.remove("match-success", "match-unsuccess", "match-idle");
        this.matchSign_.classList.add("match-loading");
    }

    public get isIdle()
    {
        return this.matchSign_.classList.contains("match-idle");
    }

    public setSignIdle()
    {
        if(this.matchSign_.classList.contains("match-idle"))
            return;
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

    private matchSign_ : Element;
}