# Change Log

All notable changes to the "Regex Visualizer" extension will be documented in this file.

## [Unreleased]

## [0.0.1] - 2024-01-28

### Added

- Regex Visualizer library v0.0.1, supports limited level of debugging.
- Regexer library v0.0.1, supports limited number of functionality.
- Webview to display, debug & visualize regular expressions.
- ECMAScript (JavaScript) regular expression specification support (not fully integrated).
- On regex hover show option to display in webview.
- Setting: enable/disable hover on regex.
- Setting: enable/disable new webview on new regex from vscode.
- Visualizer window supports some level of debugging
- Matching is async and can be interupted

## [0.0.2] - 2024-02-01

### Added

- Groups while matching, on final match and each state of groups (not visualizing yet)
- Flag to disable/enable groups on each state if there is at least one (not visualizing yet)
- Highlighting of any symbol '.'
- Matches are displayed even if the matching wasn't finished

### Fixed

- infinite loop prevention while matching. For example: ()+

## [0.0.3] - 2024-03-20

### Added

- Groups are visualized
- Range iterations support

### Changed

- Highlighting optimizations
- Fonts are loaded locally
- Strict typescript

### Fixed

- Highlighting - was incorrect sometimes for multiline expressions
- Mozilla styles
- (.) character backtracking wasn't working properly

## [0.0.4] - 2024-04-21

### Changed

- Highlighting slightly shifted

### Fixed

- list now correctly generates states and displays them
- shortened backtracking (old pos > new pos)

## [0.0.5] - 2024-05-05

### Changed

- removed help cursor on match info icon

### Fixed

- .js extension support hover (editor)
- literal notation of regex display correct valid sign

## [0.1.0] - 2024-06-24

- Release

## [0.1.1] - 2024-08-08

### Changed

- Refactored code
- Updated description

### Fixed

- White mode displaying

## [0.1.2] - 2024-08-08

### Fixed

- Bad image embeding in readme