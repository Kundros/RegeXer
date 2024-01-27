import * as vscode from 'vscode';
import { VisualizerWebview } from './VisualizerWebview';
import { HoverHelper } from './HoverHelper';

export function activate(context: vscode.ExtensionContext) {
	console.log("regex visualizer extension is active now!");

	const visualizer = new VisualizerWebview(context);
	const hoverHelper = new HoverHelper();

	const regexvisualizerDisposable = vscode.commands.registerCommand('regex-visualizer-extension.regexvisualizer', (regex? : string) => {
		visualizer.show(regex);
	});

	const hoverRegexDisposable = vscode.languages.registerHoverProvider('typescript', {
		provideHover(document : vscode.TextDocument, position : vscode.Position, token : vscode.CancellationToken) {
			return hoverHelper.testRegexHover(document, position, token);
		}
	});

	context.subscriptions.push(
		regexvisualizerDisposable, 
		hoverRegexDisposable
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
