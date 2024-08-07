import { FrontendThemes } from "../types/themeTypes";

export const themesSettings : FrontendThemes = 
{
    light: 
    {
        matchHighlighting: 
        {
            positionColor: "#5ba6d9",
            groupColors: 
            [
                "#a399d1",
                "#b995e6",
                "#d492d1",
                "#db819f",
                "#ed6258",
                "#e37944",
                "#ebb331",
                "#c4b06e",
                "#c6d98d"
            ]
        },
        regexHighlighting: 
        {
            positionColor: "#15c260",
            backtrackingPositionColor: "#e3b00e",
            backtrackingDirectionColor: "#bd090d",
            informativeColor: "#0d92de"
        },
        generalColors: {
            primaryWidget: "#e1e1e1",
            secondaryWidget: "#c3c8cb",
            mainText: "#111112",
            secondaryText: "#3d3e47",
            terciaryText: "#525666",
            bodyBackground: "#fcfcfc",
            selection: "#8bbff0"
        }
    },
    dark: 
    {
        matchHighlighting: 
        {
            positionColor: "#2b85c2",
            groupColors: 
            [
                "#754628",
                "#8c781f",
                "#657a2a",
                "#354a28",
                "#15451d",
                "#105c45",
                "#10235c",
                "#360f7a",
                "#5a0f7a"
            ]
        },
        regexHighlighting: 
        {
            positionColor: "#095c32",
            backtrackingPositionColor: "#9e7f1b",
            backtrackingDirectionColor: "#bd090d",
            informativeColor: "#075f91"
        },
        generalColors: {
            primaryWidget: "#16191c",
            secondaryWidget: "#323941",
            mainText: "#faf0e6",
            secondaryText: "#999999",
            terciaryText: "#525666",
            bodyBackground: "#24292e",
            selection: "#7fa8e7"
        }
    }
};