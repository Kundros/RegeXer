import * as vscode from 'vscode';

export class VisualizerWebview
{
    constructor(context : vscode.ExtensionContext)
    {
        this.context = context;
        this.panels_ = new Set();
    }

    public async show(regex? : string)
    {
        const visualizerHtml = require(
            "@kundros/regex-visualisation"
        ).default;
        
        const panel = vscode.window.createWebviewPanel(
            'regexVisualisation', 
            'Regex Visualisation & Debugging', 
            vscode.ViewColumn.Two, 
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, '..')],
                retainContextWhenHidden: true
            });

        this.panels_.add(panel);

        panel.onDidDispose(() => {
            this.panels_.delete(panel);
        });

        /* workaround replacing paths to vscode plugin paths */
        const fixedPathsHtml = visualizerHtml.replace(/file:\/\/\/(.*?\.(js|svg|png|jpg))/gi, (match : string, g1 : string) => { 
            let rootPath = this.context.extensionUri.path;
            if(rootPath[0] === '/' || rootPath[0] === '\\'){
                rootPath = rootPath.slice(1);
            }
            return panel.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, g1.replace(rootPath, ""))).toString(); 
        });

        panel.webview.html = fixedPathsHtml;

        if(regex !== undefined)
        {
            panel.webview.onDidReceiveMessage(
                async (message) => {
                    switch(message.type)
                    {
                        case 'ready':
                        {
                            await panel.webview.postMessage({
                                type: "send_regex",
                                data: regex
                            });
                            break;
                        }
                    }
                }
            );
        }
    }

    public async updateRegex(regex : string)
    {
        if(this.panels_.size === 0)
        {
            await this.show(regex);
            return;
        }

        this.panels_.forEach(async (panel) => {
            if(panel.visible)
            {
                await panel.webview.postMessage({
                    type: "send_regex",
                    data: regex
                });
            }
        });
    }

    public context : vscode.ExtensionContext;

    private panels_ : Set<vscode.WebviewPanel>;
}