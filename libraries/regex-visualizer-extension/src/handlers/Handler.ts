import * as vscode from 'vscode';

export abstract class Handler
{
    constructor(context : vscode.ExtensionContext)
    {
        this.context_ = context;
    }

    public abstract register() : void;
    public onDidChangeConfiguration?(event : vscode.ConfigurationChangeEvent) : void;

    protected context_ : vscode.ExtensionContext;
}