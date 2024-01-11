import { RegexMatch } from "@kundros/regexer";
import { Slider, SliderEvent } from "./Slider";
import { sliderSettings } from "./settings/SliderSettings";

export class RegexDebugger {
    constructor(overlay : HTMLElement, openBtn : HTMLElement)
    {
        this.overlay_ = overlay;
        this.openBtn_ = openBtn;
        this.slider_ = new Slider(this.overlay_.querySelector('.regex-debugger-timeline'), sliderSettings);
        this.regexText_ = this.overlay_.querySelector('.regex-debugger-regex');
        this.matchText_ = this.overlay_.querySelector('.regex-debugger-string');

        this.registerListeners();
    }

    public switchVisibility()
    {
        const overlay = this.overlay_;
        if(overlay.classList.contains('hidden'))
        {
            document.dispatchEvent(new Event("regexDebbugerVisible"));
            overlay.classList.remove('hidden')
        }
        else
            overlay.classList.add('hidden')
    }

    public setRegexText(node : HTMLElement, createClone : boolean = true){
        this.regexText_.innerHTML = "";
        let nodeToInsert : HTMLElement = (createClone) ? (node.cloneNode(true) as HTMLElement) : (node);
        nodeToInsert.contentEditable = "false";

        this.regexText_.append(nodeToInsert);
    }

    public set matches(matches : RegexMatch[]){
        this.matches_ = matches;
    }

    public set steps(steps: number)
    {
        this.slider_.max = steps;
        this.slider_.value = 1;
    }

    private visualizeStep(step: number)
    {
    }

    private registerListeners()
    {
        this.openBtn_.addEventListener('click', () => this.switchVisibility());
        this.overlay_.querySelector('.exit-debug').addEventListener('click', () => this.switchVisibility());
        this.overlay_.addEventListener('mousedown', (event: MouseEvent) => {
            if(event.target === this.overlay_)
                this.switchVisibility();
        });
        this.slider_.parent.addEventListener("cslider", (event : SliderEvent) => {
            // TODO
        });
    }

    private overlay_ : HTMLElement;
    private openBtn_ : HTMLElement;
    private regexText_ : HTMLElement;
    private matchText_ : HTMLElement;
    private matches_ : RegexMatch[];
    private slider_ : Slider;
}