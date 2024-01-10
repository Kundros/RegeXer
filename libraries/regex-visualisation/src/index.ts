import { RegexEditor } from "./models/RegexEditor";
import { RegexVisualizer } from "./models/RegexVisualizer";
import { StringMatchEditor } from "./models/StringMatchEditor";

import './styles/main.less';
import './styles/debugger.less';
import { RegexDebugger } from "./models/RegexDebugger";
import { Slider } from "./models/Slider";

/** private scope vscode api variable according to: https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension */
(function() {
    const vscode = acquireVsCodeApi();

    const slider = new Slider(document.querySelector('.regex-debugger-timeline'), 
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
        actionBtns: {
            fwdBwd: true,
            endBegin: true,
            autoplay: true,
            margin: "18px 0 25px 0",
            icon: {
                color: "#a3a3a3",
                size: "80%"
            },
            wrapper: {
                background: "#44474d",
                padding: "5px",
                radius: "40px",
                maxWidth: "250px"
            }
        },
        durationOptions: {
            defaultDuration: 10,
            durationInput: true,
            background: "#44474d",
            textColor: "white",
            iconColor: "#a3a3a3",
            radius: "40px",
            padding: "5px 10px",
            maxWidth: "150px",
            info: true
        },
        editPositionBox: {
            background: "#44474d",
            textColor: "white",
            radius: "40px",
            padding: "5px 10px",
            maxWidth: "150px",
            info: true
        }
    });

    new RegexVisualizer(
        new RegexEditor(document.querySelector("#regex-wrapper > span")),
        new StringMatchEditor(document.querySelector("#match-wrapper > span")),
        new RegexDebugger(document.querySelector("#regex-debugger-overlay"), document.querySelector(".debug-icon")),
        slider,
        vscode,
        {
            regexWait: 0,
            matchWait: 500
        }
    );
}());