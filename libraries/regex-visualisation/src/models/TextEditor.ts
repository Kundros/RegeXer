import { getCursorPosition, setCursorPosition } from "./other/caretHelper";


export class TextEditor{
    constructor(textInput : HTMLElement, canvas : HTMLCanvasElement)
    {
        this.textInput_ = textInput;
        this.canvas_ = canvas;
        this.context_ = canvas.getContext('2d');

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

    public handleKeyup(event: KeyboardEvent){
        if(event.key === "Tab"){
            event.preventDefault();

            const pos = getCursorPosition(this.textInput_);
            const text = this.textInput_.innerText;

            this.textInput_.innerText = text.substring(0, pos) + '\t' + text.substring(pos);
            setCursorPosition(this.textInput_, pos + 1);

            this.textInput_.dispatchEvent(new InputEvent('input'));
        }

        if (event.key === 'Enter') {
            event.preventDefault();

            const pos = getCursorPosition(this.textInput_);
            const text = this.textInput_.innerText;

            this.textInput_.innerHTML = text.substring(0, pos) + '&#10;' + text.substring(pos);
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
        this.textInput_.addEventListener('keydown', (event : KeyboardEvent) => this.handleKeyup(event));
    }

    private textInput_ : HTMLElement;
    private canvas_ : HTMLCanvasElement;
    private context_ : CanvasRenderingContext2D;
}