import { RegexElement } from "./RegexElement.js";
export class RegexString extends RegexElement {
    constructor(str) {
        super();
        this.string_ = str;
    }
    append(str) {
        this.string_ += str;
    }
    pop() {
        const saveLast = this.string_[this.string_.length - 1];
        this.string_ = this.string_.slice(0, -1);
        return saveLast;
    }
    get string() {
        return this.string_;
    }
    get length() {
        return this.string_.length;
    }
    string_;
}
