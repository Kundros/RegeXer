import { SliderOptions } from "../Slider";

export const sliderSettings : SliderOptions =
{
    min: 1,
    max: 1,
    marginTop: "10px",
    track: {
        height: "9px",
        color: "#44474d"
    },
    progress: {
        height: "3px",
        left: "3px",
        color: "#c370d4"
    },
    thumb: {
        width: "14px",
        borderRadius: "7px",
        height: "14px",
        color: "#b04beb"
    },
    segments: { 
        devideNumber: 12,
        color: "#a3a3a3",
        labels: true
    },
    editable: {
        margin: "18px 0 25px 0",
        grid: ["1fr", "fit-content(45%)", "1fr"],
        gap: "10px",

        actionBtns: {
            fwdBwd: true,
            endBegin: true,
            autoplay: true,

            icon: {
                color: "#a3a3a3",
                size: "80%"
            },
            wrapper: {
                background: "#44474d",
                padding: "5px 15px",
                radius: "40px",
                maxWidth: "220px"
            }
        },

        speedOptions: {
            defaultSpeed: 5,
            speedInput: true,
            background: "#44474d",
            textColor: "white",
            iconColor: "#a3a3a3",
            radius: "40px",
            padding: "5px 0",
            maxWidth: "150px",
            info: true
        },

        editPositionBox: {
            background: "#44474d",
            textColor: "white",
            radius: "40px",
            padding: "5px 0",
            maxWidth: "150px",
            info: true
        }
    }
};