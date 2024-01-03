import { RegexEditor } from "./models/RegexEditor";
import { RegexVisualizer } from "./models/RegexVisualizer";
import { StringMatchEditor } from "./models/StringMatchEditor";

import './styles/main.less';

/** private scope vscode api variable according to: https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension */
(function() {
    const vscode = acquireVsCodeApi();

    const regexVisualizer = new RegexVisualizer(
        new RegexEditor(document.querySelector("#regex-wrapper > span")),
        new StringMatchEditor(document.querySelector("#match-wrapper > span")),
        vscode,
        {
            regexWait: 0,
            matchWait: 500
        }
    );
}());