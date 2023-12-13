import { RegexVisualizer } from "./models/RegexVisualizer";
import { TextEditor } from "./models/TextEditor";

import './styles/main.less';

/** private scope vscode api variable according to: https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension */
(function() {
    const vscode = acquireVsCodeApi();

    const regexVisualizer = new RegexVisualizer(
        new TextEditor(document.querySelector("#regex-wrapper > span"), document.querySelector("#regex-wrapper > canvas")),
        new TextEditor(document.querySelector("#match-wrapper > span"), document.querySelector("#match-wrapper > canvas")),
        vscode
    );
}());