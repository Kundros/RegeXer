import { WebviewApi } from "vscode-webview";
import { Message, MessageRegex } from "types";
import { RegexEditor } from "./RegexEditor";
import { MatchBatchData, MatchData, MatchFlags, MatchResponse, RegParseException, RegexMatch, Regexer } from "@kundros/regexer";
import { StringMatchEditor } from "./StringMatchEditor";
import { RegexDebugger } from "./RegexDebugger";
import { RegexVisualizerOptions } from "./coreTypes/RegexVisualizerOptions";

export class RegexVisualizer {
    constructor(regexEditor : RegexEditor, stringMatchEditor : StringMatchEditor, debuggerWindow: RegexDebugger, vscode : WebviewApi<unknown> | undefined, options? : RegexVisualizerOptions)
    {
        this.regexEditor_ = regexEditor;
        this.stringMatchEditor_ = stringMatchEditor;
        this.vscode_ = vscode;
        this.debuggerWindow_ = debuggerWindow;

        this.options_ = options;
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
            MatchFlags.OPTION_NO_ERROR_RETURN |
            MatchFlags.ADD_GROUPS_TO_STATES
        );

        window.addEventListener("load", async () => {
            await this.updateRegex();
            if(this.vscode_ !== undefined)
            {
                this.vscode_.postMessage({ type: "ready" }); // tell vscode that web is loaded
            }
        });
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
        this.stringMatchEditor_.highlightMatches(this.regexEditor_.textInput.textContent);
        
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
            this.stringMatchEditor_.clearMatchesCanvas();
            this.regexEditor_.highlightError(parseError.getPosition());
        }

        if(this.debuggerWindow_.visible)
        {
            this.debuggerWindow_.setRegexText(this.regexEditor_.textInput);
            this.debuggerWindow_.resetSteps();
        }
    }

    private async updateMatch(matchString : string)
    {
        /* --- update match --- */
        this.resetMatches();
        this.stringMatchEditor_.setLoading();

        this.regexer_.matchInBatches(matchString, {
            batchCallback: this.batchCallback.bind(this),
            matchCallback: this.matchCallback.bind(this),
            completeCallback: this.completeCallback.bind(this),
            batchSize: this.options_.batchSize ?? 50000,
            forceStopRunning: true
        });
    }

    private batchCallback(batchData : MatchBatchData)
    {
        const lastMatch = this.matches_[this.matches_.length-1];

        lastMatch.addBatch(batchData);

        this.debuggerWindow_.steps = lastMatch.statesCount;
        this.stringMatchEditor_.updateMatchStatesMessage(lastMatch.statesCount, 0);
    }

    private matchCallback(matchData : MatchData) 
    {
        const topMatch = this.matches_[this.matches_.length-1];
        topMatch.changeMatchInformation(matchData);

        if(topMatch?.groups !== undefined)
        {
            this.stringMatchEditor_.matches = this.matches_;
            this.stringMatchEditor_.highlightGroups();
        }

        this.steps_ += matchData.statesCount;
        this.debuggerWindow_.steps = this.steps_;

        this.stringMatchEditor_.updateMatchStatesMessage(matchData.statesCount, this.matches_.length - (matchData.success ? 0 : 1));
    }

    private completeCallback(flag: MatchResponse)
    {
        if(flag & ~(MatchResponse.SUCCESS | MatchResponse.NO_MATCH))
            return;

        this.stringMatchEditor_.updateSignSuccess(this.matches_.length > 0 ? this.matches_[0].success : false);
    }

    /** 
     * Recieve message from vscode
     */
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

    private vscode_ ?: WebviewApi<unknown>;
}