import { WebviewApi } from "vscode-webview";
import { TextEditor } from "./TextEditor";
import { RegexMatch } from "@kundros/regexer";
import { Message, MessageRegexData } from "types";

export class RegexVisualizer {
    constructor(regexEditor : TextEditor, stringEditor : TextEditor, vscode : WebviewApi<unknown>)
    {
        this.regexEditor_ = regexEditor;
        this.stringEditor_ = stringEditor;
        this.vscode_ = vscode;

        this.regexEditor_.bindEvent('input', (event: InputEvent, text: string) => this.regexTextCallback(event, text));
        window.addEventListener('message', this.messageRecieve);
    }

    private regexTextCallback(event : InputEvent, text : string) 
    {
        this.vscode_.postMessage({
            type: 'regex_update',
            data: text
        });
    }

    private messageRecieve(event : MessageEvent){
        const message = event.data as Message;

        switch(event.type){
            case 'regex_data':
            {
                const RegexData = message as MessageRegexData;

                break;
            }
        }
    }

    private regexEditor_ : TextEditor;
    private stringEditor_ : TextEditor;
    private vscode_ : WebviewApi<unknown>;
}