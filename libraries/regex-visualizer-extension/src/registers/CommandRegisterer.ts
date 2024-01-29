import { VisualizerWebview } from '../VisualizerWebview';
import { Registerer } from './Registerer';
import * as vscode from 'vscode';

export class CommandRegisterer extends Registerer
{
	constructor(context : vscode.ExtensionContext)
	{
		super(context);
	}

	public register(): void 
    {
		this.visualizerWebview_ = new VisualizerWebview(this.context_);

		const openRegexVisualizer = vscode.commands.registerCommand("regex-visualizer-extension.openRegexVisualizer", (regex?: string) => {
			this.visualizerWebview_?.show(regex);
		});

		const updateRegRegexVisualizer = vscode.commands.registerCommand("regex-visualizer-extension.updateRegRegexVisualizer", (regex : string) => {
			this.visualizerWebview_?.updateRegex(regex);
		});

		this.context_.subscriptions.push(
			openRegexVisualizer,
			updateRegRegexVisualizer
		);
    }

	private visualizerWebview_ : VisualizerWebview | undefined;
}