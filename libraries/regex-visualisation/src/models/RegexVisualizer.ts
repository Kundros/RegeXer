import { TextEditor } from "./TextEditor";
import { Regexer } from "@kundros/regexer";

export class RegexVisualizer {
    constructor(regexEditor : TextEditor, stringEditor : TextEditor)
    {
        this.regexEditor_ = regexEditor;
        this.stringEditor_ = stringEditor;

        this.regexEditor_.bindEvent('input', (event: InputEvent, text: string) => this.regexTextCallback(event, text));

    }

    private regexTextCallback(event: InputEvent, text: string) 
    {
    }

    private regexer : Regexer;
    private regexEditor_ : TextEditor;
    private stringEditor_ : TextEditor;
}