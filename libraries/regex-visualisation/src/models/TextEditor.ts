export class TextEditor{
    constructor(textInput : HTMLElement, canvas : HTMLCanvasElement)
    {
        this.textInput_ = textInput;
        this.canvas_ = canvas;
        this.context_ = canvas.getContext('2d');

        this.registerListeners();
    }

    private registerListeners()
    {
        this.textInput_.addEventListener('input', (event : InputEvent) => this.updateText(event));
    }
    
    private updateText(event : InputEvent)
    {
        if(this.textInput_.innerText.length > 0 && this.textInput_.hasAttribute('data-text'))
        {
            this.textInput_.setAttribute('data-hidden-text', this.textInput_.getAttribute('data-text'));
            this.textInput_.removeAttribute('data-text');
        }
        else if(this.textInput_.innerText.length == 0 && this.textInput_.hasAttribute('data-hidden-text')){
            this.textInput_.setAttribute('data-text', this.textInput_.getAttribute('data-hidden-text'));
            this.textInput_.removeAttribute('data-hidden-text');
        }
    }

    private textInput_ : HTMLElement;
    private canvas_ : HTMLCanvasElement;
    private context_ : CanvasRenderingContext2D;
}