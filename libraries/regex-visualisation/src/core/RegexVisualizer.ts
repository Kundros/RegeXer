import { WebviewApi } from "vscode-webview";
import { Message, MessageBatchData, MessageErrorRegex, MessageMatchComplete, MessageMatchData, MessageRegexData, RegexData } from "types";
import { RegexEditor } from "./RegexEditor";
import { MatchingCompleteResponse, RegexMatch } from "@kundros/regexer";
import { StringMatchEditor } from "./StringMatchEditor";
import { RegexDebugger } from "./RegexDebugger";

export type RegexVisualizerOptions = {
    regexWait?: number,
    matchWait?: number,
}

export class RegexVisualizer {
    constructor(regexEditor : RegexEditor, stringMatchEditor : StringMatchEditor, debuggerWindow: RegexDebugger, vscode : WebviewApi<unknown>, options? : RegexVisualizerOptions)
    {
        this.regexEditor_ = regexEditor;
        this.stringMatchEditor_ = stringMatchEditor;
        this.vscode_ = vscode;
        this.debuggerWindow_ = debuggerWindow;

        this.options_ = {};
        this.options_.matchWait = options?.matchWait ?? 500;
        this.options_.regexWait = options?.regexWait ?? 500;

        this.registerListeners();

        this.resetMatches();

        this.vscode_.postMessage({
            type: 'regex_match_string',
            data: ''
        });
    }

    private registerListeners()
    {
        this.regexEditor_.bindEvent('input', (event: InputEvent, textElement: HTMLElement) => this.regexTextCallback(event, textElement));
        this.stringMatchEditor_.bindEvent('input', (event: InputEvent, textElement: HTMLElement) => this.matchTextCallback(event, textElement));
        window.addEventListener('message', (event : MessageEvent) => this.messageRecieve(event));

        document.addEventListener("regexDebbugerVisible", () => {
            this.debuggerWindow_.setRegexText(this.regexEditor_.textInput);
            this.debuggerWindow_.setMatchStringText(this.stringMatchEditor_.textInput);
        })
    }

    private resetMatches()
    {
        this.matches_ = [new RegexMatch()];
        this.debuggerWindow_.matches = this.matches_;
        this.steps_ = 0;
        this.debuggerWindow_.resetSteps();
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
            this.matchWait_ = setTimeout(() => {
                this.resetMatches();

                this.vscode_.postMessage({
                    type: 'regex_match_string',
                    data: textElement.textContent
                });
            }, this.options_.matchWait);
        }
        else
        {
            this.resetMatches();

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
                this.resetMatches();

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
                this.matches_[this.matches_.length-1].changeMatchInformation(RegexData.data);

                this.steps_ += RegexData.data.statesCount;
                this.debuggerWindow_.steps = this.steps_;

                this.stringMatchEditor_.updateMatchStatesMessage(RegexData.data.statesCount, this.matches_.length - (RegexData.data.success ? 0 : 1));

                break;
            }

            case 'regex_batch_data':
            {
                const batchData = message as MessageBatchData;
                const lastMatch = this.matches_[this.matches_.length-1];

                lastMatch.addBatch(batchData.data);

                this.debuggerWindow_.steps = lastMatch.statesCount;
                this.stringMatchEditor_.updateMatchStatesMessage(lastMatch.statesCount, 0);

                break;
            }

            case 'regex_matching_complete':
            {
                const completeFlag = message as MessageMatchComplete;

                if(completeFlag.data !== MatchingCompleteResponse.SUCCESS)
                    break;

                this.stringMatchEditor_.updateSignSuccess(this.matches_.length > 0 ? this.matches_[0].success : false);
                break;
            }
        }
    }
    
    private options_ : RegexVisualizerOptions;
    private matchWait_? : NodeJS.Timeout;
    private regexWait_? : NodeJS.Timeout;
    private regexData_? : RegexData;

    private matches_ : RegexMatch[];
    private steps_ : number;

    private regexEditor_ : RegexEditor;
    private stringMatchEditor_ : StringMatchEditor;
    private debuggerWindow_ : RegexDebugger;

    private vscode_ : WebviewApi<unknown>;
}