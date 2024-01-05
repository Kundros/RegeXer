export class RegexDebugger {
    constructor(overlay : HTMLElement, openBtn : HTMLElement)
    {
        this.overlay_ = overlay;
        this.openBtn_ = openBtn;

        this.registerListeners();
    }

    public switchVisibility()
    {
        const overlay = this.overlay_;
        if(overlay.classList.contains('hidden'))
            overlay.classList.remove('hidden')
        else
            overlay.classList.add('hidden')
    }

    private registerListeners()
    {
        this.openBtn_.addEventListener('click', () => this.switchVisibility());
        this.overlay_.querySelector('.exit-debug').addEventListener('click', () => this.switchVisibility());
        this.overlay_.addEventListener('mousedown', (event: MouseEvent) => {
            if(event.target === this.overlay_)
                this.switchVisibility();
        });
    }

    private overlay_ : HTMLElement;
    private openBtn_ : HTMLElement;
}