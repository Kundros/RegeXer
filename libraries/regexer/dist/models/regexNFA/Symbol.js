import { RegexElement } from "RegexElement.js";
export class Symbol extends RegexElement {
    constructor(symbol) {
        super();
        this.symbol_ = symbol;
    }
    get symbol() {
        return this.symbol_;
    }
    symbol_;
}
