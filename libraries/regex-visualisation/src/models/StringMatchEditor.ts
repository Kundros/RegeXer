import { TextEditor } from "./TextEditor";
import { ElementHelper } from "./other/ElementHelper";
import { getCursorPosition, setCursorPosition } from "./other/caretHelper";

export class StringMatchEditor extends TextEditor
{
    constructor(textInput : HTMLElement, canvas : HTMLCanvasElement, historyLimit = 100)
    {
        super(textInput, canvas, historyLimit);

        this.matchSign_ = textInput.parentNode.querySelector(".match-sign");

        this.registerMatchListeners();
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

    private handleTextUpdate(event : InputEvent)
    {
        let chars = this.textInput_.textContent;

        let elements = [];
        const charsLen = chars.length;

        for(let i = 0 ; i < charsLen ; i++)
        {
            if(chars[i] === '\n')
                ElementHelper.handleAddElement(elements, ElementHelper.wrapElement([document.createTextNode('\n')], "span", ["new-line-symbol"]));
            else if(chars[i] === '\t')
                ElementHelper.handleAddElement(elements, ElementHelper.wrapElement('\t', "span", ["tab-symbol"]));
            else if(elements[elements.length - 1] instanceof Text)
                (elements[elements.length - 1] as Text).textContent += chars[i];
            else
                ElementHelper.handleAddElement(elements, document.createTextNode(chars[i]));
        };

        const pos = getCursorPosition(this.textInput_);
        this.textInput_.replaceChildren(...elements);
        setCursorPosition(this.textInput_, pos);

        this.updateText();
    }

    private registerMatchListeners()
    {
        this.textInput_.addEventListener('input', (event : InputEvent) => this.handleTextUpdate(event));
    }

    private matchSign_ : Element;
}