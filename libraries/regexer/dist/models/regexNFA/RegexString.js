import { RegexElement } from "./RegexElement.js";
export class RegexString extends RegexElement {
    constructor(str) {
        super();
        this.string_ = str;
    }
    append(str) {
        this.string_ += str;
    }
    get string() {
        return this.string_;
    }
    get length() {
        return this.string_.length;
    }
    string_;
}
