import { RegexElement } from "./RegexElement.js";
export class RegexOption extends RegexElement {
    constructor(options) {
        super();
        this.options = options ?? [];
    }
    addOption(option) {
        this.options.push(option);
    }
    options;
}
