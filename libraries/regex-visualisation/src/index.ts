import { RegexEditor } from "./core/RegexEditor";
import { RegexVisualizer } from "./core/RegexVisualizer";
import { StringMatchEditor } from "./core/StringMatchEditor";

import './styles/main.less';
import './styles/debugger.less';
import { RegexDebugger } from "./core/RegexDebugger";

/** private scope vscode api variable according to: https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension */
(async function() {
    const vscode = typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : undefined;

    new RegexVisualizer(
        new RegexEditor(document.querySelector("#regex-wrapper > span")),
        new StringMatchEditor(document.querySelector("#match-wrapper > span"), document.querySelector("#match-wrapper .regex-match-highlighting")),
        new RegexDebugger(document.querySelector("#regex-debugger-overlay"), document.querySelector(".debug-icon"), { 
            regexHighlighting: {
                positionColor: "#095c32",
                backtrackingPositionColor: "#9e7f1b",
                backtrackingDirectionColor: "#bd090d",
                informativeColor: "#075f91"
            },
            matchHighlighting: {
                positionColor: "#2b85c2",
                groupColors: [
                    "#ad55b5",
                    "#8358b8",
                    "#576db5",
                    "#57a4b5",
                    "#57b591",
                    "#72b557",
                    "#a5b557",
                    "#b59a57"
                ]
            }
        }),
        vscode,
        {
            regexWait: 0,
            matchWait: 300
        }
    );
}());