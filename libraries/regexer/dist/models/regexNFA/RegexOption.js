import { RegexElement } from "./RegexElement.js";
export class RegexOption extends RegexElement {
    constructor(options) {
        super();
        this.options_ = options ?? [];
    }
    addOption(option) {
        this.options_.push(option);
    }
    get options() {
        return this.options_;
    }
    options_;
}
