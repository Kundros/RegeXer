import { StringReader } from "../helpers/StringReader.js";
import { RegexMatch } from "../models/RegexMatch.js";
import { Compiler } from "../models/Compiler.js";
export class Regexer {
    constructor(regexString) {
        this.root = Compiler.compile(regexString);
    }
    match(matchString) {
        const stringReader = new StringReader(matchString);
        let actionList = [];
        let character;
        while ((character = stringReader.next()) != null) {
        }
        return new RegexMatch();
    }
    root;
}
