import { RegexEditor } from "./models/RegexEditor";
import { RegexVisualizer } from "./models/RegexVisualizer";
import { StringMatchEditor } from "./models/StringMatchEditor";

import './styles/main.less';

/** private scope vscode api variable according to: https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension */
(function() {
    const vscode = acquireVsCodeApi();

    const regexVisualizer = new RegexVisualizer(
        new RegexEditor(document.querySelector("#regex-wrapper > span"), document.querySelector("#regex-wrapper > canvas")),
        new StringMatchEditor(document.querySelector("#match-wrapper > span"), document.querySelector("#match-wrapper > canvas")),
        vscode,
        {
            regexWait: 300,
            matchWait: 500
        }
    );
}());