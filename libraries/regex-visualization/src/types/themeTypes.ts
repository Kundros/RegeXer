import { MatchHighlightingOptions, RegexHighlightingOptions } from "./highlightTypes";

export type Themed = {
    changeTheme : (theme : AppTheme) => void
}

export type GeneralThemeColorsOptions = {
    primaryWidget?: string,
    secondaryWidget?: string,
    mainText?: string,
    secondaryText?: string,
    terciaryText?: string,
    bodyBackground?: string,
    selection?: string
}

export type AppTheme = {
    matchHighlighting: MatchHighlightingOptions,
    regexHighlighting: RegexHighlightingOptions,
    generalColors: GeneralThemeColorsOptions
}

export type FrontendThemes = { 
    light?: AppTheme,
    dark?: AppTheme,
    contrast?: AppTheme
};