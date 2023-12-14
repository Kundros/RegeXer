// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Regexer } from "@kundros/regexer";
import { MessageRegexData } from '@kundros/regex-visualisation/types';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	const visualizerHtml = require("@kundros/regex-visualisation").default;
	console.log("regex visualizer extension is active now!");

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('regex-visualizer-extension.helloWorld', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		let panel = vscode.window.createWebviewPanel(
			'regexVisualisation', 
			'Regex Visualisation & Debugging', 
			vscode.ViewColumn.Two, 
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, '..')]
			});

		/* workaround replacing paths to vscode plugin paths */
		let fixedPathsHtml = visualizerHtml.replace(/file:\/\/\/(.*\.js)/gm, (match : string, g1 : string) => { 
			let rootPath = context.extensionUri.path;
			if(rootPath[0] === '/' || rootPath[0] === '\\'){
				rootPath = rootPath.slice(1);
			}
			return panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, g1.replace(rootPath, ""))).toString(); 
		});

		let regexer : Regexer = new Regexer();

		// Handle messages from the webview
		panel.webview.onDidReceiveMessage(
			message => {
			  switch (message.type) {
				case 'regex_update':
				{
					try{
						regexer.newParse(message.data);

						const sendMessage : MessageRegexData = { type: 'regex_data', data: {
							NFA: regexer.NFA,
							AST: regexer.AST
						} };
	
						panel.webview.postMessage(sendMessage); // post parsed data back to webview
					}
					catch(e)
					{}

				  	return;
				}
			  }
			},
			undefined,
			context.subscriptions
		);
			
		panel.webview.html = fixedPathsHtml;
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
