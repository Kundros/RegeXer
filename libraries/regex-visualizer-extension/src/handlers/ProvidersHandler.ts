import { RegexHover } from "../providers/RegexHover";
import { Handler } from "./Handler";

import * as vscode from 'vscode';

export class ProvidersHandler extends Handler
{
    constructor(context : vscode.ExtensionContext)
    {
        super(context);
    }

    public register() : void 
    {
        if(vscode.workspace.getConfiguration().get('regexVisualizer.editor.hover.enable'))
        {
            this.regexHoverRegister_ = vscode.languages.registerHoverProvider(['typescript', 'javascript'], new RegexHover());

            this.context_.subscriptions.push(
                this.regexHoverRegister_
            );
        }
        else
        {
            this.regexHoverRegister_?.dispose();
        }
    }

    public onDidChangeConfiguration(event : vscode.ConfigurationChangeEvent) : void
    {
        if(event.affectsConfiguration('regexVisualizer.editor.hover.enable'))
        {
            this.register();
        }
    };

    private regexHoverRegister_ : vscode.Disposable | undefined;
}