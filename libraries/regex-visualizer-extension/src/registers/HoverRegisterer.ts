import { RegexHover } from '../RegexHover';
import { Registerer } from './Registerer';

import * as vscode from 'vscode';

export class HoverRegisterer extends Registerer
{
    constructor(context : vscode.ExtensionContext)
    {
        super(context);
    }

    public register(): void 
    {
        this.regexHoverEnableChange();
        vscode.workspace.onDidChangeConfiguration((event : vscode.ConfigurationChangeEvent) => {
            if(event.affectsConfiguration('regexVisualizer.editor.hover.enable'))
            {
                this.regexHoverEnableChange();
            }
        });
    }

    private regexHoverEnableChange()
    {
        const regexHover = new RegexHover();
    
        if(vscode.workspace.getConfiguration().get('regexVisualizer.editor.hover.enable'))
        {
            this.regexHoverRegister_ = vscode.languages.registerHoverProvider('typescript', {
                provideHover(document : vscode.TextDocument, position : vscode.Position, token : vscode.CancellationToken) {
                    return regexHover.testRegexHover(document, position, token);
                }
            });
    
            this.context_.subscriptions.push(this.regexHoverRegister_);
        }
        else
        {
            this.regexHoverRegister_?.dispose();
        }
    }

    private regexHoverRegister_ : vscode.Disposable | undefined;
}