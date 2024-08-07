import { AppTheme, FrontendThemes, Themed } from "src/types/themeTypes";

export function chooseTheme(isWebview : boolean, themes : FrontendThemes) : AppTheme
{
    if(!isWebview)
        return themes.dark;

    const isLight = document.querySelector("body.vscode-light");

    if(isLight !== undefined && isLight !== null)
        return themes.light;
    
    const isContrast = document.querySelector("body.vscode-high-contrast");

    if(isContrast !== undefined && isContrast !== null)
        return themes.dark;

    return themes.dark;
}

function updateGeneralThemeColors(theme : AppTheme)
{
    const bodyElement = document.querySelector("body");

    const generalColors = theme.generalColors;

    bodyElement.style.setProperty("--rgx-primary-widget-color", generalColors.primaryWidget ?? "#16191c");
    bodyElement.style.setProperty("--rgx-secondary-widget-color", generalColors.secondaryWidget ?? "#323941");

    bodyElement.style.setProperty("--rgx-main-text-color", generalColors.mainText ?? "#faf0e6");
    bodyElement.style.setProperty("--rgx-secondary-text-color", generalColors.secondaryText ?? "#999999");
    bodyElement.style.setProperty("--rgx-terciary-text-color", generalColors.terciaryText ?? "#525666");

    bodyElement.style.setProperty("--rgx-body-background-color", generalColors.bodyBackground ?? "#24292e");
    bodyElement.style.setProperty("--rgx-selection-background", generalColors.selection ?? "#7fa8e7");
}

export function registerThemeChangeListener(themeGenerator : () => AppTheme, themed : Themed[])
{
    const numberOfCallers = themed.length;

    updateGeneralThemeColors(themeGenerator());

    const observer = new MutationObserver(() => {
        const theme = themeGenerator();

        for(let i = 0 ; i < numberOfCallers ; i++)
        {
            themed[i].changeTheme(theme);   
        }

        updateGeneralThemeColors(theme);
    });

    observer.observe(document.body, { attributeFilter: ['class'] });
}

export { AppTheme };
