import { TextEditor, TextEditorOptions } from "./TextEditor";
import { ElementHelper } from "./other/ElementHelper";
import { getCursorPosition, setCursorPosition } from "./other/caretHelper";

export class StringMatchEditor extends TextEditor
{
    constructor(textInput : HTMLElement, canvas : HTMLCanvasElement, options?: TextEditorOptions)
    {
        super(textInput, canvas, options);

        this.matchSign_ = textInput.parentNode.querySelector(".match-sign");
    }

    public setSignIdle()
    {
        this.matchSign_.classList.remove("success");
        this.matchSign_.classList.remove("unsuccess");
        this.matchSign_.classList.add("idle");
    }

    public updateSignSuccess(success: boolean)
    {
        this.matchSign_.classList.remove("idle");

        if(!this.matchSign_.classList.contains("unsuccess") && !success)
        {
            this.matchSign_.classList.remove("success");
            this.matchSign_.classList.add("unsuccess");
        }
        else if(!this.matchSign_.classList.contains("success") && success)
        {
            this.matchSign_.classList.remove("unsuccess");
            this.matchSign_.classList.add("success");
        }
    }

    private matchSign_ : Element;
}