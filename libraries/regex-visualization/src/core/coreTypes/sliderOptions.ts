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
        speedOptions?: SpeedOptions,
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

export type SpeedOptions = {
    defaultSpeed: number,
    speedInput?: boolean,
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