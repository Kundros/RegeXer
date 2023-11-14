import { RegexHandeler } from "./RegexHandeler.js";
export class StringHandeler extends RegexHandeler {
    constructor() {
        super();
    }
    tryParse(character) {
        throw new Error("Method not implemented.");
    }
    updateStates(states) {
        throw new Error("Method not implemented.");
    }
}
