import { RegexEditor } from "./core/RegexEditor";
import { RegexVisualizer } from "./core/RegexVisualizer";
import { StringMatchEditor } from "./core/StringMatchEditor";
import { RegexDebugger } from "./core/RegexDebugger";
import { chooseTheme, registerThemeChangeListener } from "./helpers/themeHelper";
import { themesSettings } from "./settings/themesSettings";

import './styles/main.less';
import './styles/debugger.less';

/** private scope vscode api variable according to: https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension */
(async function() {
    const vscode = typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : undefined;

    const theme = chooseTheme(vscode !== undefined, themesSettings);

    const regexEditor = new RegexEditor(
        document.querySelector("#regex-wrapper > span")
    );

    const stringMatchEditor = new StringMatchEditor(
        document.querySelector("#match-wrapper > span"), 
        document.querySelector("#match-wrapper .regex-match-highlighting"),
        theme
    );

    const regexDebugger = new RegexDebugger(
        document.querySelector("#regex-debugger-overlay"), 
        document.querySelector(".debug-icon"), 
        theme
    );

    registerThemeChangeListener(
        chooseTheme.bind(undefined, vscode !== undefined, themesSettings), 
        [
            stringMatchEditor,
            regexDebugger
        ]
    );

    new RegexVisualizer(
        regexEditor,
        stringMatchEditor,
        regexDebugger,
        vscode,
        {
            regexWait: 0,
            matchWait: 300,
            batchSize: 20000
        }
    );
}());