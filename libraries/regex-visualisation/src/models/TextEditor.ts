import { getCursorPosition, setCursorPosition } from "./other/caretHelper";


export class TextEditor{
    constructor(textInput : HTMLElement, canvas : HTMLCanvasElement, historyLimit = 100)
    {
        this.textInput_ = textInput;
        this.canvas_ = canvas;
        this.context_ = canvas.getContext('2d');

        this.inputHistory_ = [["", 0]];
        this.historyAt_ = 0;
        this.historyLimit = historyLimit;

        this.registerListeners();
    }

    public bindEvent(eventName : keyof HTMLElementEventMap, callback : (event : Event, text : HTMLElement) => void) {
        this.textInput_.addEventListener(eventName, (event : InputEvent) => callback(event, this.textInput_));
    }
    
    public updateText(event? : InputEvent)
    {
        if(this.textInput_.innerText.length > 0 && this.textInput_.hasAttribute('data-text'))
        {
            this.textInput_.setAttribute('data-hidden-text', this.textInput_.getAttribute('data-text'));
            this.textInput_.removeAttribute('data-text');
        }
        else if(this.textInput_.innerText.length == 0 && this.textInput_.hasAttribute('data-hidden-text'))
        {
            this.textInput_.setAttribute('data-text', this.textInput_.getAttribute('data-hidden-text'));
            this.textInput_.removeAttribute('data-hidden-text');
        }
    }

    public get textInput() {
        return this.textInput_;
    }
    
    protected handleHistory(event : InputEvent)
    {
        const historyCurrent = this.inputHistory_[this.historyAt_];
        
        if(event.inputType === 'historyUndo' || event.inputType === 'historyRedo')
        {
            const historyCurrent = this.inputHistory_[this.historyAt_];
            this.textInput_.textContent = historyCurrent[0];
            setCursorPosition(this.textInput_, historyCurrent[1]);
            this.updateText();
        }

        if(historyCurrent[0] != this.textInput_.textContent)
        {
            while(this.historyAt_ < this.inputHistory_.length - 1)
                this.inputHistory_.pop();

            if(this.historyAt_ + 1 >= this.historyLimit)
            {
                this.historyAt_--;
                this.inputHistory_.shift();
            }

            this.inputHistory_.push([this.textInput_.textContent, getCursorPosition(this.textInput_)]);
            this.historyAt_++;
        }
    }

    protected handleUndoRedo(event : KeyboardEvent)
    {
        if((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Z')
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
        else if((event.ctrlKey || event.metaKey) && event.key === 'z')
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

            this.textInput_.textContent = text.substring(0, pos) + '\t' + text.substring(pos);
            setCursorPosition(this.textInput_, pos + 1);

            this.textInput_.dispatchEvent(new InputEvent('input'));
        }

        if (event.key === 'Enter') {
            event.preventDefault();

            const pos = getCursorPosition(this.textInput_);
            const text = this.textInput_.textContent;

            this.textInput_.textContent = text.substring(0, pos) + '\n' + text.substring(pos);
            setCursorPosition(this.textInput_, pos + 1);

            this.textInput_.dispatchEvent(new InputEvent('input'));
        }
    }

    private registerListeners()
    {
        this.textInput_.addEventListener('focus', (event : FocusEvent) => {
            // @ts-ignore
            if(event.sourceCapabilities !== null)
            {
                document.querySelectorAll(".focused-editable").forEach(element => {
                    element.classList.remove("focused-editable");
                });
                this.textInput_.classList.add("focused-editable");
            }
            else if(!this.textInput_.classList.contains("focused-editable"))
            {
                (document.querySelector(".focused-editable") as HTMLElement).focus();
            }
            else{
                const historyCurrent = this.inputHistory_[this.historyAt_];
                setCursorPosition(this.textInput_, historyCurrent[1]);
            }
        });
        this.textInput_.addEventListener('keydown', (event : KeyboardEvent) => this.handleKeydown(event));
        this.textInput_.addEventListener('input', (event : InputEvent) => this.updateText(event));
        this.textInput_.addEventListener('input', (event : InputEvent) => this.handleHistory(event));
        this.textInput_.addEventListener('keydown', (event : KeyboardEvent) => this.handleUndoRedo(event));
    }

    public historyLimit : number;
    protected inputHistory_ : [string, number][]; // text, cursor
    protected historyAt_ : number;

    protected textInput_ : HTMLElement;
    protected canvas_ : HTMLCanvasElement;
    protected context_ : CanvasRenderingContext2D;
}