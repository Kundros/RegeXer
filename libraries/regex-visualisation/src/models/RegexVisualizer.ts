import { WebviewApi } from "vscode-webview";
import { TextEditor } from "./TextEditor";
import { Message, MessageErrorRegex, MessageMatchData, MessageRegexData, RegexData } from "types";
import { getCursorPosition, setCursorPosition } from "./other/caretHelper";
import { RegexEditor } from "./RegexEditor";
import { RegexMatch } from "@kundros/regexer";
import { StringMatchEditor } from "./StringMatchEditor";

export type RegexVisualizerOptions = {
    regexWait?: number,
    matchWait?: number,
}

export class RegexVisualizer {
    constructor(regexEditor : RegexEditor, stringMatchEditor : StringMatchEditor, vscode : WebviewApi<unknown>, options? : RegexVisualizerOptions)
    {
        this.regexEditor_ = regexEditor;
        this.stringMatchEditor_ = stringMatchEditor;
        this.vscode_ = vscode;

        this.options_ = {};
        this.options_.matchWait = options?.matchWait ?? 500;
        this.options_.regexWait = options?.regexWait ?? 500;

        this.regexEditor_.bindEvent('input', (event: InputEvent, textElement: HTMLElement) => this.regexTextCallback(event, textElement));
        this.stringMatchEditor_.bindEvent('input', (event: InputEvent, textElement: HTMLElement) => this.matchTextCallback(event, textElement));
        window.addEventListener('message', (event : MessageEvent) => this.messageRecieve(event));
    }

    private regexTextCallback(event : InputEvent, textElement : HTMLElement) 
    {
        if(this.regexWait_ != undefined)
            clearTimeout(this.regexWait_);

        this.stringMatchEditor_.setLoading();
        if(this.options_.regexWait > 0)
        {
            this.regexWait_ = setTimeout(() => {
                this.vscode_.postMessage({
                    type: 'regex_update',
                    data: textElement.textContent
                });
            }, this.options_.regexWait);
        }
        else
        {
            this.vscode_.postMessage({
                type: 'regex_update',
                data: textElement.textContent
            });
        }
    }

    private matchTextCallback(event : InputEvent, textElement : HTMLElement)
    {
        if(this.stringMatchEditor_.isIdle)
            return;

        if(this.matchWait_ != undefined)
            clearTimeout(this.matchWait_);

        this.stringMatchEditor_.setLoading();
        if(this.options_.matchWait > 0)
        {
            this.stringMatchEditor_.setLoading();
            this.matchWait_ = setTimeout(() => {
                this.vscode_.postMessage({
                    type: 'regex_match_string',
                    data: textElement.textContent
                });
            }, this.options_.matchWait);
        }
        else
        {
            this.vscode_.postMessage({
                type: 'regex_match_string',
                data: textElement.textContent
            });
        }
    }

    private async messageRecieve(event : MessageEvent)
    {
        const message = event.data as Message;

        switch(message.type){
            case 'regex_data':
            {
                const RegexData = message as MessageRegexData;

                this.regexData_ = RegexData.data;
                this.regexEditor_.highlight(this.regexData_.AST);

                /* --- update match --- */
                this.vscode_.postMessage({
                    type: 'regex_match_string',
                    data: this.stringMatchEditor_.textInput.textContent
                });

                break;
            }

            case 'regex_invalid':
            {
                const RegexData = message as MessageErrorRegex;

                this.regexEditor_.highlightError([RegexData.data.from, RegexData.data.to]);
                this.stringMatchEditor_.setSignIdle();

                break;
            }

            case 'regex_match_data':
            {
                const RegexData = message as MessageMatchData;

                Object.setPrototypeOf(RegexData.data.match, RegexMatch.prototype);
                
                const match = RegexData.data.match;

                this.stringMatchEditor_.updateSignSuccess(RegexData.data.success);

                break;
            }
        }
    }
    
    private options_ : RegexVisualizerOptions;
    private matchWait_? : NodeJS.Timeout;
    private regexWait_? : NodeJS.Timeout;
    private regexData_? : RegexData;
    private regexEditor_ : RegexEditor;
    private stringMatchEditor_ : StringMatchEditor;
    private vscode_ : WebviewApi<unknown>;
}