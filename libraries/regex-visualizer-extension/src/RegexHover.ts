import * as vscode from 'vscode';

export class RegexHover
{
    public testRegexHover(document : vscode.TextDocument, position : vscode.Position, token : vscode.CancellationToken)
    {
        /* init regex finder regexes */
        const rIgnoreStartConstruct = /(?<=^RegExp\s*\(\s*)/;
        const rIgnoreEndConstruct = /(?<!\s*\+\s*)(?=\s*\))/;
        const rfindString = /(?<comma>[\"\'])(?:\\\k<comma>|(?!\k<comma>)[^\\\n\r]|\\(?!\k<comma>).)*?\k<comma>/g;
        const rfindStrings = /(?:(?<comma>[\"\'])(?:\\\k<comma>|(?!\k<comma>)[^\\\n\r]|\\(?!\k<comma>).)*?\k<comma>(?!\s*(\"|\'))\s*?\+?\s*?)+/;
        const rfindRegex = /(?<!\/)\/(?!\*)(?<val>([^\/\\\n\r]|\\[^\n\r])+)\/(g|m|i|x|s|u|U|A|J|D)*/g;
        const rfindRegexWConstructorFlags = /(,\s*(?<comma2>[\"\'])(g|m|i|x|s|u|U|A|J|D)*\k<comma2>)?/;

        const rfindRegexWConstructor = new RegExp(
            rIgnoreStartConstruct.source + 
            "(?<regex>" +
            rfindRegex.source + 
            ")" +
            rfindRegexWConstructorFlags.source + 
            rIgnoreEndConstruct.source
        );

        const rfindRegexWConstructorMultiple = new RegExp(
            rIgnoreStartConstruct.source + 
            "(?<regex>(?:(?:" +
            rfindString.source +
            "|" +
            rfindRegex.source +
            "\\s*\\.\\s*source\\s*)(?!\\s*(\\\"|\\'))\\s*?\\+?\\s*?)+)" +
            rfindRegexWConstructorFlags.source + 
            rIgnoreEndConstruct.source
        );

        let match: RegExpExecArray | null;

        /* regex with constructor */
        const wordRange = document.getWordRangeAtPosition(position);
        const word = document.getText(wordRange);

        if(word === "RegExp") {
            const searchInText = document.getText().slice(document.offsetAt(wordRange?.start ?? new vscode.Position(0, 0)));

            /* with literal notation */
            if((match = rfindRegexWConstructor.exec(searchInText)) !== null) {
                let regex = match.groups?.regex ?? "";
                return this.createHover(regex, true, false);
            }	

            /* with multiple */
            if((match = rfindRegexWConstructorMultiple.exec(searchInText)) !== null) {
                let regex = match.groups?.regex ?? "";
                let final = "";
                let one : RegExpExecArray | null;

                let findOne = new RegExp("(?<str>" + rfindString.source + ")|" + rfindRegex.source, "g");
                while((one = findOne.exec(regex)) !== null)
                {
                    if(one.groups?.str)
                    {
                        final += one.groups?.str.substring(1, one.groups?.str.length-1);
                    }
                    else if(one.groups?.val)
                    {
                        final += one.groups?.val;
                    }
                }

                try{
                    return this.createHover(RegExp(final).source);
                }
                catch(e)
                {
                    return this.createHover(final, false);
                }
            }
        }

        /* regex with literal notation */
        const lineText = document.lineAt(position).text;
        const trimmedLineText = lineText.replace(rfindStrings, (match) => " ".repeat(match.length)); // ignore string which could contain "/"
        const lineStart = document.offsetAt(document.lineAt(position).range.start);
        const cursorAt = document.offsetAt(position);
        const lineCursorAt = cursorAt-lineStart;

        while((match = rfindRegex.exec(trimmedLineText)) !== null) {
            const startMatch = rfindRegex.lastIndex-match[0].length;

            if(lineCursorAt >= startMatch && lineCursorAt < rfindRegex.lastIndex) {
                return this.createHover(lineText.slice(rfindRegex.lastIndex - match[0].length, rfindRegex.lastIndex), true, false);
            }
        }
    }

    private createHover(regex : string, valid: boolean = true, addShlashed : boolean = true)
    {
        let commentCommandUri : vscode.Uri;

        if(vscode.workspace.getConfiguration().get('regexVisualizer.editor.hover.newWindow'))
        {
            commentCommandUri = vscode.Uri.parse(`command:regex-visualizer-extension.openRegexVisualizer?${encodeURIComponent(JSON.stringify([regex]))}`);
        }
        else
        {
            commentCommandUri = vscode.Uri.parse(`command:regex-visualizer-extension.updateRegRegexVisualizer?${encodeURIComponent(JSON.stringify([regex]))}`);
        }

        const markdown = new vscode.MarkdownString(`[Open with Regex visualizer & debugger](${commentCommandUri})`);
        const slash = addShlashed ? "/" : "";
        markdown.isTrusted = true;
        markdown.appendCodeblock(slash + regex + slash + (valid ? "🟢": "🔴"), "typescript");
        return new vscode.Hover(markdown);
    }

}