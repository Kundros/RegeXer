import { SliderOptions } from "../types/sliderOptions";

export const sliderSettings : SliderOptions =
{
    min: 1,
    max: 1,
    segments: { 
        devideNumber: 12,
        color: "#a3a3a3",
        labels: true
    },
    editable: {
        actionBtns: {
            fwdBwd: true,
            endBegin: true,
            autoplay: true,
        },

        speedOptions: {
            defaultSpeed: 5,
            speedInput: true,
            info: true
        },

        editPositionBox: {
            info: true
        }
    }
};