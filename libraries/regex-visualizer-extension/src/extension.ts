import * as vscode from 'vscode';
import { VisualizerWebview } from './VisualizerWebview';
import { RegexHover } from './RegexHover';

export function activate(context: vscode.ExtensionContext) {
	console.log("regex visualizer extension is active now!");

	const visualizer = new VisualizerWebview(context);
	const hoverHelper = new RegexHover();

	const openRegexVisualizerDisposable = vscode.commands.registerCommand('regex-visualizer-extension.openRegexVisualizer', (regex? : string) => {
		visualizer.show(regex);
	});

	const updateRegRegexVisualizerDisposable = vscode.commands.registerCommand('regex-visualizer-extension.updateRegRegexVisualizer', (regex : string) => {
		visualizer.updateRegex(regex);
	});

	const hoverRegexDisposable = vscode.languages.registerHoverProvider('typescript', {
		provideHover(document : vscode.TextDocument, position : vscode.Position, token : vscode.CancellationToken) {
			return hoverHelper.testRegexHover(document, position, token);
		}
	});

	context.subscriptions.push(
		openRegexVisualizerDisposable, 
		updateRegRegexVisualizerDisposable,
		hoverRegexDisposable
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
