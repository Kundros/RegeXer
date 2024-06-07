import { VisualizerWebview } from '../web/VisualizerWebview';
import { Handler } from './Handler';
import * as vscode from 'vscode';

export class CommandHandler extends Handler
{
	public register(): void 
    {
		this.visualizerWebview_ = new VisualizerWebview(this.context_);

		this.openRegexVisualizer_ = vscode.commands.registerCommand("regex-visualizer-extension.openRegexVisualizer", (regex?: string) => {
			this.visualizerWebview_?.show(regex);
		});

		this.updateRegRegexVisualizer_ = vscode.commands.registerCommand("regex-visualizer-extension.updateRegRegexVisualizer", (regex : string) => {
			this.visualizerWebview_?.updateRegex(regex);
		});

		this.context_.subscriptions.push(
			this.openRegexVisualizer_,
			this.updateRegRegexVisualizer_
		);
    }

	private visualizerWebview_ : VisualizerWebview | undefined;
	private openRegexVisualizer_ : vscode.Disposable | undefined;
	private updateRegRegexVisualizer_ : vscode.Disposable | undefined;
}