import { wrapElement } from "./other/elementHelper";
import { getCursorPosition, setCursorPosition } from "./other/caretHelper";

export type TextEditorOptions = {
    historyLimit?: number,
}

export class TextEditor{
    constructor(textInput : HTMLElement, options?: TextEditorOptions)
    {
        this.textInput_ = textInput;

        this.options_ = {};
        this.options_.historyLimit = options?.historyLimit ?? 100;

        this.inputHistory_ = [["", 0]];
        this.historyAt_ = 0;

        this.registerEvents();
    }

    /** @description function that allows to register event from outside */
    public bindEvent(eventName : keyof HTMLElementEventMap, callback : (event : Event, text : HTMLElement) => void) {
        this.textInput_.addEventListener(eventName, (event : InputEvent) => callback(event, this.textInput_));
    }
    
    /** @description if text is updated this function should be called */
    public updateText()
    {
        if(this.textInput_.textContent === '\r')
            this.textInput_.textContent = "";
        if(this.textInput_.textContent.length > 0 && this.textInput_.hasAttribute('data-text'))
        {
            this.textInput_.setAttribute('data-hidden-text', this.textInput_.getAttribute('data-text'));
            this.textInput_.removeAttribute('data-text');
        }
        else if(this.textInput_.textContent.length == 0 && this.textInput_.hasAttribute('data-hidden-text'))
        {
            this.textInput_.setAttribute('data-text', this.textInput_.getAttribute('data-hidden-text'));
            this.textInput_.removeAttribute('data-hidden-text');
        }
    }

    public get textInput() {
        return this.textInput_;
    }
    
    public set text(newText: string)
    {
        this.textInput_.textContent = newText;
    }

    /** @description handle text history addition (undo/redo) */
    protected handleHistory(event : InputEvent)
    {
        const historyCurrent = this.inputHistory_[this.historyAt_];
        
        if(event.inputType === 'historyUndo' || event.inputType === 'historyRedo')
        {
            const historyCurrent = this.inputHistory_[this.historyAt_];
            this.textInput_.textContent = historyCurrent[0];
            setCursorPosition(this.textInput_, historyCurrent[1]);
            this.handleFormatting();
        }

        if(historyCurrent[0] != this.textInput_.textContent)
        {
            while(this.historyAt_ < this.inputHistory_.length - 1)
                this.inputHistory_.pop();

            if(this.historyAt_ + 1 >= this.options_.historyLimit)
            {
                this.historyAt_--;
                this.inputHistory_.shift();
            }

            this.inputHistory_.push([this.textInput_.textContent, getCursorPosition(this.textInput_)]);
            this.historyAt_++;
        }
    }

    /** @description disable original undo or redo operation */
    protected handleUndoRedo(event : KeyboardEvent)
    {
        if((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === 'z' || event.key === 'Z'))
        {
            if(this.historyAt_ < this.inputHistory_.length - 1)
            {
                const newCurrent = this.inputHistory_[++this.historyAt_];

                this.textInput_.textContent = newCurrent[0]; //return to history text
                setCursorPosition(this.textInput_, newCurrent[1]); //return to history pointer

                this.textInput_.dispatchEvent(new InputEvent('input'));
                return;
            }
        }
        else if((event.ctrlKey || event.metaKey) && (event.key === 'z' || event.key === 'Z'))
        {
            if(this.historyAt_ > 0)
            {
                const newCurrent = this.inputHistory_[--this.historyAt_];

                this.textInput_.textContent = newCurrent[0]; //return to history text
                setCursorPosition(this.textInput_, newCurrent[1]); //return to history pointer

                this.textInput_.dispatchEvent(new InputEvent('input'));
                return;
            }
        }
    }

    protected handleKeydown(event: KeyboardEvent)
    {
        if(event.key === "Tab"){
            event.preventDefault();

            const pos = getCursorPosition(this.textInput_);
            const text = this.textInput_.textContent;

            this.textInput_.textContent = text.slice(0, pos) + '\t' + text.slice(pos);
            setCursorPosition(this.textInput_, pos + 1);

            this.textInput_.dispatchEvent(new InputEvent('input'));
        }

        if (event.key === 'Enter') {
            event.preventDefault();

            const pos = getCursorPosition(this.textInput_);
            const text = this.textInput_.textContent;

            this.textInput_.textContent = text.slice(0, pos) + '\n' + text.slice(pos);
            setCursorPosition(this.textInput_, pos + 1);

            this.textInput_.dispatchEvent(new InputEvent('input'));
        }
    }

    /** @description handles formatting such as tab/new line */
    protected handleFormatting()
    {
        const chars = this.textInput_.textContent;

        const pos = getCursorPosition(this.textInput_);
        this.textInput_.textContent = '';

        const newLine = wrapElement([document.createTextNode('\n')], "span", ["new-line-symbol"]);
        const tab = wrapElement('\t', "span", ["tab-symbol"]);

        let lastAt = 0;
        const newLineReg = /\r\n|\n|\t/gm;
        let countCarriageReturns = 0;

        let match : RegExpExecArray | null;
        while ((match = newLineReg.exec(chars)) !== null) {
            if(lastAt <  newLineReg.lastIndex - 1)
                this.textInput_.append(chars.slice(lastAt, newLineReg.lastIndex - match[0].length));
            if(match[0] === '\r\n'){
                countCarriageReturns++;
                this.textInput_.append(newLine.cloneNode(true));
            }
            else if(match[0] === '\n')
                this.textInput_.append(newLine.cloneNode(true));
            else
                this.textInput_.append(tab.cloneNode(true));
            lastAt = newLineReg.lastIndex;
        }

        if(lastAt < chars.length)
            this.textInput_.append(chars.slice(lastAt, chars.length));

        const last = this.textInput_.lastChild;
        if(last instanceof HTMLElement && last.classList.contains("new-line-symbol"))
        {
            last.append(document.createElement('br'));
        }

        setCursorPosition(this.textInput_, pos);

        this.updateText();
        return countCarriageReturns;
    }

    protected handleFocus()
    {
        if(!this.textInput_.classList.contains("focused-editable"))
        {
            const focused = document.querySelector(".focused-editable");
            if(focused instanceof HTMLElement)
                (focused as HTMLElement).focus();
        }
        else{
            const historyCurrent = this.inputHistory_[this.historyAt_];
            setCursorPosition(this.textInput_, historyCurrent[1]);
        }
    }

    protected handleMousedown()
    {
        document.querySelectorAll(".focused-editable").forEach(element => {
            element.classList.remove("focused-editable");
        });
        this.textInput_.classList.add("focused-editable");
    }

    protected async handlePaste(event: ClipboardEvent)
    {
        event.preventDefault();
        const sel = window.getSelection();
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.collapse(true);

        const pos = getCursorPosition(this.textInput_);
        const text = this.textInput_.textContent;
        const copyText = event.clipboardData.getData("text/plain");

        this.textInput_.textContent = text.slice(0, pos) + copyText + text.slice(pos);
        setCursorPosition(this.textInput_, pos + copyText.length - (copyText.match(/\n/g) ?? []).length);

        this.textInput_.dispatchEvent(new InputEvent('input'));
    }

    private registerEvents()
    {
        this.textInput_.addEventListener('paste', (event: ClipboardEvent) => this.handlePaste(event));
        this.textInput_.addEventListener('mousedown', () => this.handleMousedown());
        this.textInput_.addEventListener('focus', () => this.handleFocus());
        this.textInput_.addEventListener('keydown', (event : KeyboardEvent) => this.handleKeydown(event));
        this.textInput_.addEventListener('keydown', (event : KeyboardEvent) => this.handleUndoRedo(event));
        this.textInput_.addEventListener('input', () => this.handleFormatting());
        this.textInput_.addEventListener('input', () => this.updateText());
        this.textInput_.addEventListener('input', (event : InputEvent) => this.handleHistory(event));
    }

    protected options_ : TextEditorOptions;
    protected inputHistory_ : [string, number][]; // text, cursor
    protected historyAt_ : number;

    protected textInput_ : HTMLElement;
}