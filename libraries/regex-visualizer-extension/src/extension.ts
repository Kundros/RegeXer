import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const visualizerHtml = require("@kundros/regex-visualisation").default;
	console.log("regex visualizer extension is active now!");

	let disposable = vscode.commands.registerCommand('regex-visualizer-extension.regexvisualizer', async () => {
		let panel = vscode.window.createWebviewPanel(
			'regexVisualisation', 
			'Regex Visualisation & Debugging', 
			vscode.ViewColumn.Two, 
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, '..')]
			});

		/* workaround replacing paths to vscode plugin paths */
		let fixedPathsHtml = visualizerHtml.replace(/file:\/\/\/(.*?\.(js|svg|png|jpg))/gm, (match : string, g1 : string) => { 
			let rootPath = context.extensionUri.path;
			if(rootPath[0] === '/' || rootPath[0] === '\\'){
				rootPath = rootPath.slice(1);
			}
			return panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, g1.replace(rootPath, ""))).toString(); 
		});

		// Handle messages from the webview
		/*panel.webview.onDidReceiveMessage(
			async message => {
			},
			undefined,
			context.subscriptions
		);*/
			
		panel.webview.html = fixedPathsHtml;
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
