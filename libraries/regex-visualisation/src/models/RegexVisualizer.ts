import { WebviewApi } from "vscode-webview";
import { TextEditor } from "./TextEditor";
import { Message, MessageRegexData, RegexData } from "types";
import { getCursorPosition, setCursorPosition } from "./other/caretHelper";
import { RegexHighlighter } from "./RegexHighlighter";

export class RegexVisualizer {
    constructor(regexEditor : TextEditor, stringEditor : TextEditor, vscode : WebviewApi<unknown>)
    {
        this.regexEditor_ = regexEditor;
        this.stringEditor_ = stringEditor;
        this.vscode_ = vscode;

        this.regexEditor_.bindEvent('input', (event: InputEvent, textElement: HTMLElement) => this.regexTextCallback(event, textElement));
        window.addEventListener('message', (event : MessageEvent) => this.messageRecieve(event));
    }

    private regexTextCallback(event : InputEvent, textElement : HTMLElement) 
    {
        this.vscode_.postMessage({
            type: 'regex_update',
            data: textElement.innerText
        });
    }

    private messageRecieve(event : MessageEvent){
        const message = event.data as Message;

        switch(message.type){
            case 'regex_data':
            {
                const RegexData = message as MessageRegexData;

                this.regexData_ = RegexData.data;

                console.log(this.regexData_.AST);

                const textElement = this.regexEditor_.textInput;

                const pos = getCursorPosition(textElement);
                textElement.replaceChildren(...RegexHighlighter.highlight(textElement.innerText, this.regexData_.AST));
                setCursorPosition(textElement, pos);

                break;
            }
        }
    }

    private regexData_? : RegexData;
    private regexEditor_ : TextEditor;
    private stringEditor_ : TextEditor;
    private vscode_ : WebviewApi<unknown>;
}