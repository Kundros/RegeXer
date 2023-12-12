import { WebviewApi } from "vscode-webview";
import { TextEditor } from "./TextEditor";
import { RegexMatch } from "@kundros/regexer";

import '../styles/main.less';

export class RegexVisualizer {
    constructor(regexEditor : TextEditor, stringEditor : TextEditor, vscode : WebviewApi<unknown>)
    {
        this.regexEditor_ = regexEditor;
        this.stringEditor_ = stringEditor;

        this.regexEditor_.bindEvent('input', (event: InputEvent, text: string) => this.regexTextCallback(event, text));
    }

    private async regexTextCallback(event: InputEvent, text: string) 
    {
        this.vscode_.postMessage({
            type: 'regex_update',
            data: text
        });
    }

    private regexEditor_ : TextEditor;
    private stringEditor_ : TextEditor;
    private vscode_ : WebviewApi<unknown>;
}