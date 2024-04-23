import * as vscode from 'vscode';

export interface Handler
{
    onDidChangeConfiguration?(event : vscode.ConfigurationChangeEvent) : void;
}

export abstract class Handler
{
    constructor(context : vscode.ExtensionContext)
    {
        this.context_ = context;
    }

    public abstract register() : void;

    protected context_ : vscode.ExtensionContext;
}