import { RegexElement } from "./RegexElement.js";
export class RegexCharacter extends RegexElement {
    constructor(symbol) {
        super();
        this.symbol_ = symbol;
    }
    get symbol() {
        return this.symbol_;
    }
    symbol_;
}
