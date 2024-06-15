import * as vscode from 'vscode';
import { CommandHandler } from './handlers/CommandHandler';
import { ProvidersHandler } from './handlers/ProvidersHandler';
import { Handler } from './handlers/Handler';

export function activate(context: vscode.ExtensionContext) {
	console.log("Regex visualizer extension is active!");

	const handlers : Handler[] = [
		new CommandHandler(context),
		new ProvidersHandler(context)
	];

	for(const handler of handlers)
	{
		handler.register();
		
		if(handler.onDidChangeConfiguration)
		{
			vscode.workspace.onDidChangeConfiguration(handler.onDidChangeConfiguration.bind(handler));
		}
	}
}

// TODO: This method is called when your extension is deactivated
