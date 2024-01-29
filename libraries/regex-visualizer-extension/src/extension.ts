import * as vscode from 'vscode';
import { CommandRegisterer } from './registers/CommandRegisterer';
import { HoverRegisterer } from './registers/HoverRegisterer';

export function activate(context: vscode.ExtensionContext) {
	console.log("Regex visualizer extension is active!");

	new CommandRegisterer(context).register();
	new HoverRegisterer(context).register();
}

// This method is called when your extension is deactivated
export function deactivate() {}
