import { wrapElement } from "./other/ElementHelper";

import '../styles/slider.less';
import beginSvg from '../assets/svgs/begin.svg';
import arrowLeftSvg from '../assets/svgs/arrow-left.svg';
import playSvg from '../assets/svgs/play.svg';
import pauseSvg from '../assets/svgs/pause.svg';
import arrowUpSvg from '../assets/svgs/up.svg';

import { SliderOptions } from "./coreTypes/SliderOptions";

export type SliderEvent = Event & {
    readonly detail : {
        readonly value : number;
    }
}

/** @description customizable slider with action buttons */
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

        this.value_ = this.min_;

        if(this.options_?.segments?.step != undefined && this.options_?.segments?.step <= 0)
            this.options_.segments.step = 1;

        this.registerEvents();
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
        const labelGap = segments?.labelGap ?? 1;

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

    public get parent()
    {
        return this.container_;
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
            },
            bubbles: true
        }));

        this.updateProgress();
        this.updateThumb();
    }

    public get value()
    {
        return this.value_;
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

    public get max()
    {
        return this.max_;
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

    public get min()
    {
        return this.min_;
    }

    public set autoplaySpeed(val: number)
    {
        const speedOptions = this.options_?.editable?.speedOptions;
        const max = speedOptions?.max ?? 1000;
        let min = speedOptions?.min ?? 1;
        min = min < 0 ? 0 : min;

        if(val <= min) 
            val = min;
        else if(val >= max) 
            val = max;

        this.autoplaySpeed_ = val;
        this.speedInput_.textContent = this.autoplaySpeed_.toString();
    }

    public get autoplaySpeed()
    {
        return this.autoplaySpeed_;
    }


    private render()
    {
        this.thumb_ = wrapElement([], "div", ["cslider-thumb"]);
        this.progress_ = wrapElement([], "div", ["cslider-progress"]);

        this.track_ = wrapElement([
            this.thumb_,
            this.progress_
        ], "div", ["cslider-track"]);

        this.wrapper_ = wrapElement([
            this.track_
        ], "div", ["cslider-wrapper"]);

        this.editableContainer_ = wrapElement([], "div", ["cslider-manipulation"]);
        
        this.renderSegmentsContainer();
        this.renderEditPositionBox();
        this.renderActionBtns();
        this.renderSpeed();

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

    /** @description creates listener on play button and handles timing behind autoplay */
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

                this.autoplaying_ = setInterval(() => {
                    const timeDuration = (1/this.autoplaySpeed_) * 1000; // User can change duration during autoplay
                    const timeSpan = (Date.now() - lastTime) / timeDuration;
                    valueFloating += timeSpan;
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

        this.actionBtnsContainer_ = wrapElement([], "div", ["cslider-action-btns"]);
        this.editableContainer_.append(this.actionBtnsContainer_);

        if(actionBtnsOptions?.endBegin)
        {
            const beginElement = wrapElement([], "div", ["cslider-action-begin"]);
            beginElement.innerHTML = beginSvg;
            this.actionBtnsContainer_.append(beginElement);
            beginElement.addEventListener("click", () => {
                this.value = this.min_;
            });
        }

        if(actionBtnsOptions?.fwdBwd)
        {
            const backwardElement = wrapElement([], "div", ["cslider-action-backward"]);
            backwardElement.innerHTML = arrowLeftSvg;
            this.actionBtnsContainer_.append(backwardElement);
            backwardElement.addEventListener("click", () => {
                this.value = this.value_ - 1;
            });
        }

        if(actionBtnsOptions?.autoplay)
        {
            const autoplay = wrapElement([], "div", ["cslider-action-autoplay"]);
            autoplay.innerHTML = playSvg + pauseSvg;
            autoplay.querySelector("svg:last-child").classList.add("cslider-hidden");
            this.actionBtnsContainer_.append(autoplay);
            this.handleAutoplay(autoplay);
            
        }

        if(actionBtnsOptions?.fwdBwd)
        {
            const forwardElement = wrapElement([], "div", ["cslider-action-forward"]);
            forwardElement.innerHTML = arrowLeftSvg;
            this.actionBtnsContainer_.append(forwardElement);
            forwardElement.addEventListener("click", () => {
                this.value = this.value_ + 1;
            });
        }

        if(actionBtnsOptions?.endBegin)
        {
            const endElement = wrapElement([], "div", ["cslider-action-end"]);
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

    private renderSpeed()
    {
        const speedOptions = this.options_?.editable?.speedOptions;
        if(speedOptions?.speedInput === undefined || this.editableContainer_ === undefined)
        {
            this.autoplaySpeed = speedOptions?.defaultSpeed ?? 1;
            return;
        }

        const arrows = wrapElement([], "span", ["cslider-arrows-wrapper"]);
        arrows.innerHTML = arrowUpSvg + arrowUpSvg;


        this.speedInput_ = wrapElement([], "span", ["cslider-editable-speed"], [["contenteditable", "true"]]);

        this.speedInputWrapper_ = wrapElement([
            this.speedInput_,
            arrows
        ], "div", ["cslider-custom-speed"]);

        this.editableContainer_.append(this.speedInputWrapper_);

        this.speedInputWrapper_.style.background = speedOptions.background ?? "none";
        this.speedInputWrapper_.style.borderRadius = speedOptions.radius ?? "0px";
        this.speedInputWrapper_.style.padding = speedOptions.padding ?? "0";
        this.speedInputWrapper_.style.maxWidth = speedOptions.maxWidth ?? "100%";

        this.speedInput_.style.color = speedOptions.textColor ?? "black";
        this.speedInput_.style.fontSize = speedOptions.fontSize ?? "min(1.3rem, 60cqh)";
        this.speedInput_.textContent = speedOptions.defaultSpeed.toString();

        if(speedOptions.info)
        {
            this.speedInputWrapper_.append(
                wrapElement([
                    new Text("i"),
                    wrapElement(speedOptions?.customInfoText ?? "Autoplay speed as (1/speed) seconds per frame", "span", ["cslider-speed-info-text"])
                ], "div", ["cslider-speed-info"])
            );
        }

        if(speedOptions.iconColor)
        {
            this.speedInputWrapper_.querySelectorAll("svg").forEach(icon => {
                icon.style.fill = speedOptions.iconColor;
            });
        }

        this.autoplaySpeed = speedOptions.defaultSpeed;

        const up = arrows.querySelector("svg:first-child");
        const down = arrows.querySelector("svg:last-child");

        up.addEventListener("click", () => {
            this.autoplaySpeed = this.autoplaySpeed_ + (.1 * (10 ** Math.floor(this.autoplaySpeed_ / 1).toString().length));
        });

        down.addEventListener("click", () => {
            this.autoplaySpeed = this.autoplaySpeed_ - (.1 * (10 ** Math.floor(this.autoplaySpeed_ / 2).toString().length));
        });

        this.speedInput_.addEventListener("input", () => {
            if(!/^[\d]*?$/.test(this.speedInput_.textContent))
            { 
                this.speedInput_.textContent = this.autoplaySpeed_.toString();
                return;
            }
            const val = Number.parseFloat(this.speedInput_.textContent);

            if(Number.isNaN(val)) return;

            this.autoplaySpeed = val;
        });
    }

    private renderEditPositionBox()
    {
        const editPositionOptions = this.options_?.editable?.editPositionBox;
        if(editPositionOptions === undefined || this.editableContainer_ === undefined) return;

        this.positionEditInput_ = wrapElement(this.min_.toString(), "span", ["cslider-edit-position"], [["content-editable", "true"]]); 
        this.positionEditInputWrapper_ = wrapElement(
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
                wrapElement([
                    new Text("i"),
                    wrapElement(editPositionOptions?.customInfoText ?? "Current value inside slider <min, max>", "span", ["cslider-edit-position-info-text"])
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

        this.canvas_ = wrapElement([], "canvas", ["cslider-canvas"]) as HTMLCanvasElement;
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

    private hadnleMouseup()
    {
        this.drag_ = false;
        document.body.style.cursor = "unset";
    }

    private registerEvents()
    {
        this.thumb_.addEventListener("mousedown", (event : MouseEvent) => this.hadnleMousedown(event));
        this.track_.addEventListener("mousedown", (event : MouseEvent) => this.hadnleMousedown(event));
        document.addEventListener("mousemove", (event : MouseEvent) => this.hadnleMousemove(event));
        document.addEventListener("mouseup", () => this.hadnleMouseup());
        
        const observer = new ResizeObserver((entries) => {
            entries.forEach(() => {
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
    private autoplaySpeed_ : number;
    private options_? : SliderOptions;
    private autoplaying_? : NodeJS.Timeout;

    private container_ : Element;
    private thumb_? : HTMLElement;
    private progress_? : HTMLElement;
    private track_? : HTMLElement;
    private wrapper_? : HTMLElement;

    private context_? : CanvasRenderingContext2D;
    private canvas_? : HTMLCanvasElement;
    private actionBtnsContainer_? : HTMLElement;
    private editableContainer_? : HTMLElement;
    private speedInputWrapper_? : HTMLElement;
    private speedInput_? : HTMLElement;
    private positionEditInput_? : HTMLElement;
    private positionEditInputWrapper_? : HTMLElement;

    private drag_ : boolean = false;
}