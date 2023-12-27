import { TextEditor } from "./TextEditor";

export class StringMatchEditor extends TextEditor
{
    constructor(textInput : HTMLElement, canvas : HTMLCanvasElement)
    {
        super(textInput, canvas);

        this.matchSign_ = textInput.parentNode.querySelector(".match-sign");
    }

    public updateSuccess(success: boolean)
    {
        if(this.matchSign_.classList.contains("success") && !success)
        {
            this.matchSign_.classList.remove("success");
            this.matchSign_.classList.add("unsuccess");
        }
        else if(this.matchSign_.classList.contains("unsuccess") && success)
        {
            this.matchSign_.classList.remove("unsuccess");
            this.matchSign_.classList.add("success");
        }
    }

    private matchSign_ : Element;
}