import { ElementHelper } from "./other/ElementHelper";

import '../styles/slider.less';
// @ts-ignore
import beginSvg from '../assets/svgs/begin.svg';
// @ts-ignore
import arrowLeftSvg from '../assets/svgs/arrow-left.svg';
// @ts-ignore
import playSvg from '../assets/svgs/play.svg';
// @ts-ignore
import pauseSvg from '../assets/svgs/pause.svg';
// @ts-ignore
import arrowUpSvg from '../assets/svgs/up.svg';

export type SliderOptions = {
    min?: number,
    max?: number,
    marginTop?: string,
    marginBottom?: string,
    thumb?: ThumbOptions,
    track?: TrackOptions,
    progress?: ProgressOptions,
    segments?: SegmentsOptions,
    editable?: {
        grid?: [string | undefined, string | undefined, string | undefined],
        gap?: string,
        margin?: string

        actionBtns?: ActionBtnsOptions,
        durationOptions?: DurationOptions,
        editPositionBox?: EditPositionBox
    }
};

export type EditPositionBox = {
    textColor?: string,
    background?: string,
    radius?: string,
    fontSize?: string,
    padding?: string,
    info?: boolean,
    customInfoText?: string,
    maxWidth?: string
}

export type DurationOptions = {
    defaultDuration: number,
    durationInput?: boolean,
    iconColor?: string,
    textColor?: string,
    background?: string,
    radius?: string,
    fontSize?: string,
    padding?: string,
    maxWidth?: string,
    info?: boolean,
    customInfoText?: string,
    max?: number,
    min?: number
}

export type ActionBtnsOptions = {
    autoplay?: boolean,
    fwdBwd?: boolean,
    endBegin?: boolean

    icon?: {
        color?: string,
        background?: string,
        radius?: string,
        size?: string,
        padding?: string
    }

    wrapper?: {
        background?: string,
        radius?: string,
        width?: string,
        padding?: string,
        maxWidth?: string
    }
}

export type ThumbOptions = {
    width: string,
    height: string,
    borderRadius?: string,
    color?: string
}

export type TrackOptions = {
    height: string,
    width?: string,
    borderRadius?: string,
    color?: string
}

export type ProgressOptions = {
    height?: string,
    borderRadius?: string,
    color?: string,
    left?: string
}

export type SegmentsOptions = {
    color?: string,
    step?: number,
    devideNumber?: number,
    height?: string,
    marginTop?: string,
    labels?: boolean,
    labelGap?: number
}

export type SliderEvent = Event & {
    readonly detail : {
        readonly value : number;
    }
}

export class Slider{
    constructor(container : string | Element, options?: SliderOptions)
    {
        if(typeof container === 'string')
            this.container_ = document.querySelector(container);
        else
            this.container_ = container;

        this.options_ = options;

        this.min_ = options?.min ?? 0;
        this.max_ = options?.max ?? 100;
        if(this.min_ >= this.max_)
            this.min_ = this.max_;

        this.render();

        this.value = this.min_;

        if(this.options_?.segments?.step != undefined && this.options_?.segments?.step <= 0)
            this.options_.segments.step = 1;

        this.registerListeners();
    }

    public updateSegments()
    {
        const segments = this.options_?.segments;
        if(segments === undefined || this.canvas_ === undefined || this.context_ === undefined) return;

        const bounding = this.canvas_.getBoundingClientRect();
        const allSteps = this.max_ - this.min_;
        const step = (this.track_.getBoundingClientRect().width) / allSteps;
        const offset = (bounding.width - this.track_.getBoundingClientRect().width)/2;

        let pos = 0;

        let skipStep = segments?.step ?? segments?.devideNumber ?? 10;
        const labels = segments?.labels ?? false;

        if(segments?.devideNumber > 0)
            skipStep = allSteps / (skipStep - 1);

        this.canvas_.width = bounding.width;
        this.canvas_.height = bounding.height;

        const linesHeight = labels ? bounding.height - 12 : bounding.height;

        if(skipStep < 1)
            skipStep = 1;

        this.context_.clearRect(0, 0, bounding.width, bounding.height);
        this.context_.save();
        this.context_.strokeStyle = segments?.color ?? "#000000";
        this.context_.fillStyle = segments?.color ?? "#000000";
        this.context_.font = "12px var(--vscode-editor-font-family, 'Roboto Mono'), monospace";
        this.context_.lineWidth = 1;
        
        let countSegments = 0;
        let labelGap = segments?.labelGap ?? 1;

        for(let i = 0; i - .01 <= allSteps ; i+=skipStep)
        {
            pos = step * Math.round(i);

            const integer = Math.round(pos + offset);
            this.context_.beginPath();
            this.context_.moveTo(integer + .5, 0);
            this.context_.lineTo(integer + .5, linesHeight);

            if(labels)
            {
                const label = Math.round(i + this.min_).toString();
                const textWidth = this.context_.measureText(label).width;

                if(countSegments%labelGap === 0 || Math.round(i) === this.max_)
                {
                    let computePos = integer - textWidth/2;
                    if(integer - textWidth/2 < 0)
                        computePos = 0;
                    else if(integer + textWidth/2 > bounding.width)
                        computePos = bounding.width - textWidth;
    
                    this.context_.fillText(label, computePos, bounding.height);
                }
            }

            this.context_.stroke(); 
            countSegments++;
        }

        this.context_.restore();
    }

    public set value(val : number)
    {
        if(val <= this.min_) 
            val = this.min_;
        else if(val >= this.max_) 
            val = this.max_;

        this.value_ = val;
        
        if(this.positionEditInput_ !== undefined)
        {
            this.positionEditInput_.textContent = this.value_.toString();
        }

        this.container_.dispatchEvent(new CustomEvent("cslider", <SliderEvent>{ 
            detail: {
                value: this.value_
            }
        }));

        this.updateProgress();
        this.updateThumb();
    }

    public set max(val : number)
    {
        if(val < this.min_) 
            val = this.min_;

        this.max_ = val;

        if(this.max_ < this.value_) 
            this.value_ = this.max_;
        
        this.updateSegments();
        this.updateProgress();
        this.updateThumb();
    }

    public set min(val : number)
    {
        if(val > this.max_) 
            val = this.max_;
        
        this.min_ = val;

        if(this.min_ > this.value_) 
            this.value_ = this.min_;

        this.updateSegments();
        this.updateProgress();
        this.updateThumb();
    }

    public set autoplayDuration(val: number)
    {
        const durationOptions = this.options_?.editable?.durationOptions;
        let min = durationOptions?.min ?? 1;
        let max = durationOptions?.max ?? 1000;
        min = min < 0 ? 0 : min;
        if(val <= min) 
            val = min;
        else if(val >= max) 
            val = max;

        this.autoplayDuration_ = val;
        this.durationInput_.textContent = this.autoplayDuration_.toString();
    }

    public get parent()
    {
        return this.container_;
    }

    public get value()
    {
        return this.value_;
    }

    public get min()
    {
        return this.min_;
    }

    public get max()
    {
        return this.max_;
    }

    public get autoplayDuration()
    {
        return this.autoplayDuration_;
    }


    private render()
    {
        this.thumb_ = ElementHelper.wrapElement([], "div", ["cslider-thumb"]);
        this.progress_ = ElementHelper.wrapElement([], "div", ["cslider-progress"]);

        this.track_ = ElementHelper.wrapElement([
            this.thumb_,
            this.progress_
        ], "div", ["cslider-track"]);

        this.wrapper_ = ElementHelper.wrapElement([
            this.track_
        ], "div", ["cslider-wrapper"]);

        this.editableContainer_ = ElementHelper.wrapElement([], "div", ["cslider-manipulation"]);
        
        this.renderSegmentsContainer();
        this.renderEditPositionBox();
        this.renderActionBtns();
        this.renderDuration();

        this.container_.append(this.wrapper_);
        this.wrapper_.append(this.editableContainer_);

        this.thumb_.style.width = this.options_?.thumb?.width ?? "10px";
        this.thumb_.style.height = this.options_?.thumb?.height ?? "10px";
        this.thumb_.style.borderRadius = this.options_?.thumb?.borderRadius ?? "5px";
        this.thumb_.style.backgroundColor = this.options_?.thumb?.color ?? "#34c6eb";

        this.track_.style.backgroundColor = this.options_?.track?.color ?? "#d9d9d9";
        this.track_.style.width = this.options_?.track?.width ?? "calc(100% - 10px)";
        this.track_.style.height = this.options_?.track?.height ?? "5px";
        this.track_.style.borderRadius = this.options_?.track?.borderRadius ?? "5px";

        this.progress_.style.backgroundColor = this.options_?.progress?.color ?? this.options_?.thumb?.color ?? "#34c6eb";
        this.progress_.style.height = this.options_?.progress?.height ?? this.options_?.track?.height ?? "5px";
        this.progress_.style.left = this.options_?.progress?.left ?? "0px";
        this.progress_.style.borderRadius = this.options_?.progress?.borderRadius ?? this.options_?.track?.borderRadius ?? "5px";

        this.wrapper_.style.marginTop = this.options_?.marginTop ?? "0px";
        this.wrapper_.style.marginBottom = this.options_?.marginTop ?? "0px";

        this.editableContainer_.style.gridTemplateColumns = 
            (this.options_?.editable?.grid[0] ?? "1fr") + " " + 
            (this.options_?.editable?.grid[1] ?? "40%") + " " +
            (this.options_?.editable?.grid[2] ?? "1fr");
        this.editableContainer_.style.margin = this.options_?.editable?.margin ?? "5px 0";
        this.editableContainer_.style.gap = this.options_?.editable?.gap ?? "0";

        const labels = this.options_?.segments?.labels ?? false;
        const canvasHeight = this.options_?.segments?.height ?? "5px"

        this.canvas_.style.marginTop = this.options_?.segments?.marginTop ?? "4px";
        this.canvas_.style.height = (labels) ? ("calc(" + canvasHeight + " + 12px)") : canvasHeight;;

        this.updateThumb();
        this.updateProgress();
        this.updateSegments();
    }

    private handleAutoplay(autoplay : HTMLElement)
    {
        autoplay.addEventListener("click", () => {
            const playbtn = autoplay.querySelector("svg:first-child");
            const pausebtn = autoplay.querySelector("svg:last-child");
            if(playbtn.classList.contains("cslider-hidden"))
            {
                playbtn.classList.remove("cslider-hidden");
                pausebtn.classList.add("cslider-hidden");
                if(this.autoplaying_ !== undefined)
                    clearInterval(this.autoplaying_);
            }
            else
            {
                pausebtn.classList.remove("cslider-hidden");
                playbtn.classList.add("cslider-hidden");

                let lastTime = Date.now();
                let valueFloating = this.value_;
                const minMaxDiff = this.max_ - this.min_;

                this.autoplaying_ = setInterval(() => {
                    const timeDuration = this.autoplayDuration_ * 1000; // User can change duration during autoplay
                    const timeSpan = (Date.now() - lastTime) / timeDuration;
                    valueFloating = minMaxDiff*timeSpan + valueFloating;
                    let integerTemp = Math.floor(valueFloating);
                    
                    if(integerTemp > this.max_)
                        integerTemp = this.max_;

                    if(integerTemp !== this.value_)
                        this.value = integerTemp;

                    lastTime = Date.now();

                    if(this.value_ >= this.max_)
                    {
                        clearInterval(this.autoplaying_);
                        playbtn.classList.remove("cslider-hidden");
                        pausebtn.classList.add("cslider-hidden");
                    }
                }, 10);
            }
        });
    }

    private renderActionBtns()
    {
        const actionBtnsOptions = this.options_?.editable?.actionBtns;
        if(actionBtnsOptions === undefined || this.editableContainer_ === undefined) return;

        this.actionBtnsContainer_ = ElementHelper.wrapElement([], "div", ["cslider-action-btns"]);
        this.editableContainer_.append(this.actionBtnsContainer_);

        if(actionBtnsOptions?.endBegin)
        {
            const beginElement = ElementHelper.wrapElement([], "div", ["cslider-action-begin"]);
            beginElement.innerHTML = beginSvg;
            this.actionBtnsContainer_.append(beginElement);
            beginElement.addEventListener("click", () => {
                this.value = this.min_;
            });
        }

        if(actionBtnsOptions?.fwdBwd)
        {
            const backwardElement = ElementHelper.wrapElement([], "div", ["cslider-action-backward"]);
            backwardElement.innerHTML = arrowLeftSvg;
            this.actionBtnsContainer_.append(backwardElement);
            backwardElement.addEventListener("click", () => {
                this.value = this.value_ - 1;
            });
        }

        if(actionBtnsOptions?.autoplay)
        {
            const autoplay = ElementHelper.wrapElement([], "div", ["cslider-action-autoplay"]);
            autoplay.innerHTML = playSvg + pauseSvg;
            autoplay.querySelector("svg:last-child").classList.add("cslider-hidden");
            this.actionBtnsContainer_.append(autoplay);
            this.handleAutoplay(autoplay);
            
        }

        if(actionBtnsOptions?.fwdBwd)
        {
            const forwardElement = ElementHelper.wrapElement([], "div", ["cslider-action-forward"]);
            forwardElement.innerHTML = arrowLeftSvg;
            this.actionBtnsContainer_.append(forwardElement);
            forwardElement.addEventListener("click", () => {
                this.value = this.value_ + 1;
            });
        }

        if(actionBtnsOptions?.endBegin)
        {
            const endElement = ElementHelper.wrapElement([], "div", ["cslider-action-end"]);
            endElement.innerHTML = beginSvg;
            this.actionBtnsContainer_.append(endElement);
            endElement.addEventListener("click", () => {
                this.value = this.max_;
            });
        }

        const iconOptions = actionBtnsOptions?.icon;

        if(iconOptions)
        {
            const icons = this.actionBtnsContainer_.querySelectorAll("div svg");
            const wrappers = this.actionBtnsContainer_.querySelectorAll("div");

            const color = iconOptions?.color ?? "black";
            const radius = iconOptions?.radius ?? "0px";
            const size = iconOptions?.size ?? "100%";
            const background = iconOptions?.background ?? "none";
            const padding = iconOptions?.padding ?? "0";

            icons.forEach((icon : HTMLElement) => {
                icon.style.fill = color;
            });

            wrappers.forEach((wrapper : HTMLElement) => {
                wrapper.style.background = background;
                wrapper.style.width = size;
                wrapper.style.borderRadius = radius;
                wrapper.style.padding = padding;
            });
        }

        const wrapperOptions = actionBtnsOptions?.wrapper;

        if(wrapperOptions?.background || wrapperOptions?.radius || wrapperOptions?.width || wrapperOptions?.padding)
        {
            const radius = wrapperOptions?.radius ?? "0px";
            const width = wrapperOptions?.width ?? "100%";
            const background = wrapperOptions?.background ?? "none";
            const padding = wrapperOptions?.padding ?? "0";
            const maxWidth = wrapperOptions?.maxWidth ?? "100%";

            this.actionBtnsContainer_.style.borderRadius = radius;
            this.actionBtnsContainer_.style.width = width;
            this.actionBtnsContainer_.style.background = background;
            this.actionBtnsContainer_.style.padding = padding;
            this.actionBtnsContainer_.style.maxWidth = maxWidth;
        }
    }

    private renderDuration()
    {
        const durationOptions = this.options_?.editable?.durationOptions;
        if(durationOptions?.durationInput === undefined || this.editableContainer_ === undefined)
        {
            this.autoplayDuration = durationOptions?.defaultDuration ?? 1;
            return;
        }

        const arrows = ElementHelper.wrapElement([], "span", ["cslider-arrows-wrapper"]);
        arrows.innerHTML = arrowUpSvg + arrowUpSvg;


        this.durationInput_ = ElementHelper.wrapElement([], "span", ["cslider-editable-duration"], [["contenteditable", "true"]]);

        this.durationInputWrapper_ = ElementHelper.wrapElement([
            this.durationInput_,
            arrows
        ], "div", ["cslider-custom-speed"]);

        this.editableContainer_.append(this.durationInputWrapper_);

        this.durationInputWrapper_.style.background = durationOptions.background ?? "none";
        this.durationInputWrapper_.style.borderRadius = durationOptions.radius ?? "0px";
        this.durationInputWrapper_.style.padding = durationOptions.padding ?? "0";
        this.durationInputWrapper_.style.maxWidth = durationOptions.maxWidth ?? "100%";

        this.durationInput_.style.color = durationOptions.textColor ?? "black";
        this.durationInput_.style.fontSize = durationOptions.fontSize ?? "min(1.3rem, 60cqh)";
        this.durationInput_.textContent = durationOptions.defaultDuration.toString();

        if(durationOptions.info)
        {
            this.durationInputWrapper_.append(
                ElementHelper.wrapElement([
                    new Text("i"),
                    ElementHelper.wrapElement(durationOptions?.customInfoText ?? "Autoplay duration in seconds (minimally 1s)", "span", ["cslider-speed-info-text"])
                ], "div", ["cslider-speed-info"])
            );
        }

        if(durationOptions.iconColor)
        {
            this.durationInputWrapper_.querySelectorAll("svg").forEach(icon => {
                icon.style.fill = durationOptions.iconColor;
            });
        }

        this.autoplayDuration = durationOptions.defaultDuration;

        const up = arrows.querySelector("svg:first-child");
        const down = arrows.querySelector("svg:last-child");

        up.addEventListener("click", () => {
            this.autoplayDuration = this.autoplayDuration_ + (.5 * (10 ** Math.floor(this.autoplayDuration_ / 10).toString().length));
        });

        down.addEventListener("click", () => {
            this.autoplayDuration = this.autoplayDuration_ - (.5 * (10 ** Math.floor(this.autoplayDuration_ / 15).toString().length));
        });

        this.durationInput_.addEventListener("input", () => {
            if(!/^[\d]*?$/.test(this.durationInput_.textContent))
            { 
                this.durationInput_.textContent = this.autoplayDuration_.toString();
                return;
            }
            const val = Number.parseFloat(this.durationInput_.textContent);

            if(Number.isNaN(val)) return;

            this.autoplayDuration = val;
        });
    }

    private renderEditPositionBox()
    {
        const editPositionOptions = this.options_?.editable?.editPositionBox;
        if(editPositionOptions === undefined || this.editableContainer_ === undefined) return;

        this.positionEditInput_ = ElementHelper.wrapElement(this.min_.toString(), "span", ["cslider-edit-position"], [["content-editable", "true"]]); 
        this.positionEditInputWrapper_ = ElementHelper.wrapElement(
            [
                this.positionEditInput_
            ], "div", ["cslider-edit-position-wrapper"]);

        this.editableContainer_.append(this.positionEditInputWrapper_);

        this.positionEditInputWrapper_.style.borderRadius = editPositionOptions?.radius ?? "0px";
        this.positionEditInputWrapper_.style.padding = editPositionOptions?.padding ?? "0";
        this.positionEditInputWrapper_.style.maxWidth = editPositionOptions?.maxWidth ?? "100%";
        this.positionEditInputWrapper_.style.background = editPositionOptions?.background ?? "none";

        this.positionEditInput_.style.color = editPositionOptions?.textColor ?? "white";
        this.positionEditInput_.style.fontSize = editPositionOptions?.fontSize ?? "min(1.3rem, 60cqh)";

        if(editPositionOptions.info)
        {
            this.positionEditInputWrapper_.append(
                ElementHelper.wrapElement([
                    new Text("i"),
                    ElementHelper.wrapElement(editPositionOptions?.customInfoText ?? "Current value inside slider <min, max>", "span", ["cslider-edit-position-info-text"])
                ], "div", ["cslider-edit-position-info"])
            );
        }

        this.positionEditInput_.addEventListener("input", () => {
            if(!/^[\d]*?$/.test(this.positionEditInput_.textContent))
            { 
                this.positionEditInput_.textContent = this.value_.toString();
                return;
            }
            const val = Number.parseInt(this.positionEditInput_.textContent);

            if(Number.isNaN(val)) return;

            this.value = val;
        });
    }

    private renderSegmentsContainer()
    {
        if(this.options_?.segments === undefined) return;

        this.canvas_ = ElementHelper.wrapElement([], "canvas", ["cslider-canvas"]) as HTMLCanvasElement;
        this.context_ = this.canvas_.getContext("2d");

        this.wrapper_.append(this.canvas_);
    }

    private hadnleMousedown(event : MouseEvent)
    {
        this.drag_ = true;
        document.body.style.cursor = "pointer";
        this.hadnleMousemove(event);
    }

    private updateThumb()
    {
        const halfThumb = this.thumb_.offsetWidth/2;
        const allSteps = this.max_ - this.min_;
        const progressPercent = ((this.value_ - this.min_) / allSteps) * 100;

        this.thumb_.style.left = "calc(" + progressPercent + "% - " + halfThumb + "px)";
    }

    private updateProgress()
    {
        const allSteps = this.max_ - this.min_;
        const progressPercent = ((this.value_ - this.min_) / allSteps) * 100;

        const options = this.options_?.progress;

        if(options?.left !== undefined)
            this.progress_.style.width = "calc(" + progressPercent + "% - " + options?.left + ")";
        else
            this.progress_.style.width = progressPercent + "%";
    }

    private hadnleMousemove(event : MouseEvent)
    {
        if(!this.drag_) return;

        const bounding = this.track_.getBoundingClientRect();
        const allSteps = this.max_ - this.min_;
        const step = bounding.width / allSteps;
        const crudePos = bounding.width - (event.clientX - bounding.x);
        const doneSteps = allSteps - Math.ceil((crudePos / step) - .5); // shift by .5 to be exactly in half between 2 nodes

        this.value = doneSteps + this.min_;

        this.updateThumb();
        this.updateProgress();
    }

    private hadnleMouseup(event : MouseEvent)
    {
        this.drag_ = false;
        document.body.style.cursor = "unset";
    }

    private registerListeners()
    {
        this.thumb_.addEventListener("mousedown", (event : MouseEvent) => this.hadnleMousedown(event));
        this.track_.addEventListener("mousedown", (event : MouseEvent) => this.hadnleMousedown(event));
        document.addEventListener("mousemove", (event : MouseEvent) => this.hadnleMousemove(event));
        document.addEventListener("mouseup", (event : MouseEvent) => this.hadnleMouseup(event));
        
        const observer = new ResizeObserver((entries) => {
            entries.forEach((entry) => {
                this.updateThumb();
                this.updateProgress();
                this.updateSegments();
            });    
        });
        
        observer.observe(this.container_);
    }

    private min_ : number;
    private max_ : number;
    private value_ : number;
    private autoplayDuration_ : number;
    private options_ : SliderOptions;
    private autoplaying_? : NodeJS.Timeout;

    private container_ : Element;
    private thumb_ : HTMLElement;
    private progress_ : HTMLElement;
    private track_ : HTMLElement;
    private wrapper_ : HTMLElement;

    private context_? : CanvasRenderingContext2D;
    private canvas_? : HTMLCanvasElement;
    private actionBtnsContainer_? : HTMLElement;
    private editableContainer_? : HTMLElement;
    private durationInputWrapper_? : HTMLElement;
    private durationInput_? : HTMLElement;
    private positionEditInput_? : HTMLElement;
    private positionEditInputWrapper_? : HTMLElement;

    private drag_ : boolean;
}