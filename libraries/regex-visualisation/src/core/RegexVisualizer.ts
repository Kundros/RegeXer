import { WebviewApi } from "vscode-webview";
import { Message, MessageRegex } from "types";
import { RegexEditor } from "./RegexEditor";
import { MatchBatchData, MatchData, MatchFlags, MatchResponse, RegParseException, RegexMatch, Regexer } from "@kundros/regexer";
import { StringMatchEditor } from "./StringMatchEditor";
import { RegexDebugger } from "./RegexDebugger";

export type RegexVisualizerOptions = {
    regexWait?: number,
    matchWait?: number,
}

export class RegexVisualizer {
    constructor(regexEditor : RegexEditor, stringMatchEditor : StringMatchEditor, debuggerWindow: RegexDebugger, vscode : WebviewApi<unknown> | undefined, options? : RegexVisualizerOptions)
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

        this.regexer_ = new Regexer( 
            MatchFlags.SHORTEN_BACKTRACKING | 
            MatchFlags.BACKTRACKED_FROM_EXACT |
            MatchFlags.BACKTRACK_TRIM_POSITION |
            MatchFlags.OPTION_ENTERS_SHOW_ACTIVE |
            MatchFlags.OPTION_SHOW_FIRST_ENTER |
            MatchFlags.REMOVE_STATES_WO_EFFECT |
            MatchFlags.OPTION_NO_ERROR_RETURN
        );

        if(this.stringMatchEditor_.isIdle)
            this.updateRegex();
    }

    private registerListeners()
    {
        this.regexEditor_.bindEvent('input', (event: InputEvent, textElement: HTMLElement) => this.regexTextCallback(textElement, event));
        this.stringMatchEditor_.bindEvent('input', (event: InputEvent, textElement: HTMLElement) => this.matchTextCallback(textElement, event));
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

    private regexTextCallback(textElement : HTMLElement, event?: InputEvent) 
    {
        if(this.regexWait_ != undefined)
            clearTimeout(this.regexWait_);

        if(this.options_.regexWait > 0)
        {
            this.regexWait_ = setTimeout(async () => {
                this.updateRegex(textElement.textContent);
            }, this.options_.regexWait);
        }
        else
        {
            this.updateRegex(textElement.textContent);
        }
    }

    private matchTextCallback(textElement : HTMLElement, event?: InputEvent)
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
                this.updateMatch(textElement.textContent);
            }, this.options_.matchWait);
        }
        else
        {
            this.resetMatches();
            this.updateMatch(textElement.textContent);
        }
    }

    private async updateRegex(regexString : string = "")
    {
        this.stringMatchEditor_.setLoading();
        try
        {
            await this.regexer_.parse(regexString);
            this.debuggerWindow_.offset = regexString[0] === "/" ? 1 : 0;

            this.regexEditor_.highlight(this.regexer_.AST);

            /* --- update match --- */
            this.matchTextCallback(this.stringMatchEditor_.textInput);
        }
        catch(exception : unknown) // invalid regex
        {
            const parseError = exception as RegParseException;
            this.stringMatchEditor_.setSignIdle();
            this.regexEditor_.highlightError(parseError.getPosition());
        }
    }

    private async updateMatch(matchString : string)
    {
        /* --- update match --- */
        this.resetMatches();
        this.stringMatchEditor_.clearMatchesCanvas();
        this.stringMatchEditor_.setLoading();

        const that = this;
        this.regexer_.matchInBatches(matchString, {
            batchCallback(batchData : MatchBatchData) {
                const lastMatch = that.matches_[that.matches_.length-1];

                lastMatch.addBatch(batchData);

                that.debuggerWindow_.steps = lastMatch.statesCount;
                that.stringMatchEditor_.updateMatchStatesMessage(lastMatch.statesCount, 0);
            },
            matchCallback(matchData : MatchData) {
                that.matches_[that.matches_.length-1].changeMatchInformation(matchData);

                that.steps_ += matchData.statesCount;
                that.debuggerWindow_.steps = that.steps_;

                if(matchData.start !== undefined && matchData.end !== undefined)
                {
                    that.stringMatchEditor_.highlightMatch(matchData.start, matchData.end);
                }

                that.stringMatchEditor_.updateMatchStatesMessage(matchData.statesCount, that.matches_.length - (matchData.success ? 0 : 1));
            },
            completeCallback(flag: MatchResponse)
            {
                if(flag & ~(MatchResponse.SUCCESS | MatchResponse.NO_MATCH))
                    return;

                that.stringMatchEditor_.updateSignSuccess(that.matches_.length > 0 ? that.matches_[0].success : false);
            },
            batchSize: 50000,
            forceStopRunning: true
        });
    }


    private async messageRecieve(event : MessageEvent)
    {
        const message = event.data as Message;

        switch(message.type){
            case 'send_regex': {
                const regexMessage = message as MessageRegex;
                this.regexEditor_.text = regexMessage.data;
                this.updateRegex(regexMessage.data);
                break;
            }
        }
    }
    
    private options_ : RegexVisualizerOptions;
    private matchWait_? : NodeJS.Timeout;
    private regexWait_? : NodeJS.Timeout;

    private matches_ : RegexMatch[];
    private steps_ : number;

    private regexEditor_ : RegexEditor;
    private stringMatchEditor_ : StringMatchEditor;
    private debuggerWindow_ : RegexDebugger;
    private regexer_ : Regexer;

    private vscode_ : WebviewApi<unknown>;
}