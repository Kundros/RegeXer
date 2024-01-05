import { ElementHelper } from "./other/ElementHelper";

import '../styles/slider.less';

export type SliderOptions = {
    min?: number,
    max?: number,
    marginTop?: string,
    marginBottom?: string,
    thumb?: {
        width: string,
        height: string,
        borderRadius?: string,
        color?: string
    },
    track?: {
        height: string,
        width?: string,
        borderRadius?: string,
        color?: string
    },
    progress?: ProgressOptions,
    segments?: SegmentsOptions
};

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
    margin?: string,
    labels?: boolean,
    labelGap?: number
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

        this.segments_ = options?.segments ?? undefined;

        this.render();

        this.value = this.min_;

        if(this.segments_?.step != undefined && this.segments_?.step <= 0)
            this.segments_.step = 1;

        this.registerListeners();
    }

    public updateSegments()
    {
        if(this.segments_ === undefined) return;

        const bounding = this.canvas_.getBoundingClientRect();
        const allSteps = this.max_ - this.min_;
        const step = (this.track_.getBoundingClientRect().width) / allSteps;
        const offset = (bounding.width - this.track_.getBoundingClientRect().width)/2;

        let pos = 0;

        let skipStep = this.segments_?.step ?? this.segments_?.devideNumber ?? 10;
        const labels = this.segments_?.labels ?? false;

        if(this.segments_?.devideNumber > 0)
            skipStep = allSteps / (skipStep - 1);

        this.canvas_.width = bounding.width;
        this.canvas_.height = bounding.height;

        const linesHeight = labels ? bounding.height - 12 : bounding.height;

        if(skipStep < 1)
            skipStep = 1;

        this.context_.clearRect(0, 0, bounding.width, bounding.height);
        this.context_.save();
        this.context_.strokeStyle = this.segments_?.color ?? "#000000";
        this.context_.fillStyle = this.segments_?.color ?? "#000000";
        this.context_.font = "12px var(--vscode-editor-font-family, 'Roboto Mono'), monospace";
        this.context_.lineWidth = 1;
        
        let countSegments = 0;
        let labelGap = this.segments_?.labelGap ?? 1;

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
        if(val < this.min_ || val > this.max_) return;

        this.value_ = val;
        
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

    private render()
    {
        this.thumb_ = ElementHelper.wrapElement([], "div", ["cslider-thumb"]);
        this.progress_ = ElementHelper.wrapElement([], "div", ["cslider-progress"]);
        this.canvas_ = ElementHelper.wrapElement([], "canvas", ["cslider-canvas"]) as HTMLCanvasElement;

        this.context_ = this.canvas_.getContext("2d");

        this.track_ = ElementHelper.wrapElement([
            this.thumb_,
            this.progress_
        ], "div", ["cslider-track"]);

        this.wrapper_ = ElementHelper.wrapElement([
            this.track_,
            this.canvas_
        ], "div", ["cslider-wrapper"]);

        this.container_.append(this.wrapper_);

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

        const labels = this.segments_?.labels ?? false;
        const canvasHeight = this.options_?.segments?.height ?? "5px";

        if(labels)
            this.canvas_.style.height = "calc(" + canvasHeight + " + 12px)";
        else
            this.canvas_.style.height = canvasHeight;

        this.canvas_.style.marginTop = this.options_?.segments?.margin ?? "4px";

        this.updateThumb();
        this.updateProgress();
        this.updateSegments();
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

        this.value_ = doneSteps + this.min_;

        if(this.value_ < 0)
            this.value_ = this.min_;
        else if(this.value_ > allSteps)
            this.value_ = allSteps + this.min_;

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
        
        let observer = new ResizeObserver((entries) => {
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
    private segments_ : SegmentsOptions;
    private value_ : number;
    private options_ : SliderOptions;

    private container_ : Element;
    private thumb_ : HTMLElement;
    private progress_ : HTMLElement;
    private track_ : HTMLElement;
    private context_ : CanvasRenderingContext2D;
    private canvas_ : HTMLCanvasElement;
    private wrapper_ : HTMLElement;

    private drag_ : boolean;
}