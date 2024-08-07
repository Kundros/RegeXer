export type SliderOptions = {
    min?: number,
    max?: number,
    segments?: SegmentsOptions,
    editable?: {
        actionBtns?: ActionBtnsOptions,
        speedOptions?: SpeedOptions,
        editPositionBox?: EditPositionBox
    }
};

export type EditPositionBox = {
    info?: boolean,
    customInfoText?: string
}

export type SpeedOptions = {
    defaultSpeed: number,
    speedInput?: boolean,
    info?: boolean,
    customInfoText?: string,
    max?: number,
    min?: number
}

export type ActionBtnsOptions = {
    autoplay?: boolean,
    fwdBwd?: boolean,
    endBegin?: boolean
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