import { RegexEditor } from "./core/RegexEditor";
import { RegexVisualizer } from "./core/RegexVisualizer";
import { StringMatchEditor } from "./core/StringMatchEditor";

import './styles/main.less';
import './styles/debugger.less';
import { RegexDebugger } from "./core/RegexDebugger";
import { MatchHighlightingOptions } from "./core/coreTypes/matchHighlightOptions";

/** private scope vscode api variable according to: https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension */
(async function() {
    const vscode = typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : undefined;

    const matchHighlightingOptions : MatchHighlightingOptions = {
        positionColor: "#2b85c2",
        groupColors: [
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
    };

    new RegexVisualizer(
        new RegexEditor(
            document.querySelector("#regex-wrapper > span")
        ),
        new StringMatchEditor(
            document.querySelector("#match-wrapper > span"), 
            document.querySelector("#match-wrapper .regex-match-highlighting"),
            matchHighlightingOptions
        ),
        new RegexDebugger(document.querySelector("#regex-debugger-overlay"), document.querySelector(".debug-icon"), { 
            regexHighlighting: {
                positionColor: "#095c32",
                backtrackingPositionColor: "#9e7f1b",
                backtrackingDirectionColor: "#bd090d",
                informativeColor: "#075f91"
            },
            matchHighlighting: matchHighlightingOptions
        }),
        vscode,
        {
            regexWait: 0,
            matchWait: 300,
            batchSize: 20000
        }
    );
}());