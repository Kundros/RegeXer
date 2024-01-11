import { RegexEditor } from "./core/RegexEditor";
import { RegexVisualizer } from "./core/RegexVisualizer";
import { StringMatchEditor } from "./core/StringMatchEditor";

import './styles/main.less';
import './styles/debugger.less';
import { RegexDebugger } from "./core/RegexDebugger";

/** private scope vscode api variable according to: https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension */
(function() {
    const vscode = acquireVsCodeApi();

    new RegexVisualizer(
        new RegexEditor(document.querySelector("#regex-wrapper > span")),
        new StringMatchEditor(document.querySelector("#match-wrapper > span")),
        new RegexDebugger(document.querySelector("#regex-debugger-overlay"), document.querySelector(".debug-icon")),
        vscode,
        {
            regexWait: 0,
            matchWait: 500
        }
    );
}());