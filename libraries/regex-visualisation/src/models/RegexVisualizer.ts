import { TextEditor } from "./TextEditor";

export class RegexVisualizer {
    constructor(regexEditor : TextEditor, stringEditor : TextEditor)
    {
        this.regexEditor_ = regexEditor;
        this.stringEditor_ = stringEditor;
    }

    private regexer;
    private regexEditor_ : TextEditor;
    private stringEditor_ : TextEditor;
}