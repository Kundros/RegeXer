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

    private handleHistory(event : InputEvent)
    {
        if(event.inputType === 'historyUndo')
        {
            if(this.historyAt_ > 0)
            {
                const newCurrent = this.inputHistory_[--this.historyAt_];

                this.textInput_.innerText = newCurrent[0]; //return to history text
                setCursorPosition(this.textInput_, newCurrent[1]); //return to history pointer

                this.textInput_.dispatchEvent(new InputEvent('input'));
                return;
            }
        }
        else if(event.inputType === 'historyRedo')
        {
            if(this.historyAt_ < this.inputHistory_.length - 1)
            {
                const newCurrent = this.inputHistory_[++this.historyAt_];

                this.textInput_.innerText = newCurrent[0]; //return to history text
                setCursorPosition(this.textInput_, newCurrent[1]); //return to history pointer

                this.textInput_.dispatchEvent(new InputEvent('input'));
                return;
            }
        }

        const historyCurrent = this.inputHistory_[this.historyAt_];
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

            console.log(this.inputHistory_);
        }
    }

    public handleKeyup(event: KeyboardEvent){
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

    public get textInput() {
        return this.textInput_;
    }

    private registerListeners()
    {
        this.textInput_.addEventListener('input', (event : InputEvent) => this.updateText(event));
        this.textInput_.addEventListener('input', (event : InputEvent) => this.handleHistory(event));
        this.textInput_.addEventListener('keydown', (event : KeyboardEvent) => this.handleKeyup(event));
    }

    public historyLimit : number;
    private inputHistory_ : [string, number][]; // text, cursor
    private historyAt_ : number;

    private textInput_ : HTMLElement;
    private canvas_ : HTMLCanvasElement;
    private context_ : CanvasRenderingContext2D;
}