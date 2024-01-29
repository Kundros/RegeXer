import * as vscode from 'vscode';

export abstract class Registerer
{
    constructor(context : vscode.ExtensionContext)
    {
        this.context_ = context;
    }

    public abstract register() : void;

    protected context_ : vscode.ExtensionContext;
}