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
            devideNumber: 10,
            color: "#a3a3a3",
            labels: true
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