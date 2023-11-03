import { StringReader } from "../helpers/StringReader.js";
import { RegexMatch } from "../models/RegexMatch.js";
import { Compiler } from "../models/Compiler.js";
export class Regexer {
    constructor(regexString) {
        this.compiler = new Compiler();
        this.regexRoot = this.compiler.compile(regexString);
    }
    match(matchString) {
        const stringReader = new StringReader(matchString);
        let actionList = [];
        let character;
        while ((character = stringReader.next()) != null) {
        }
        return new RegexMatch();
    }
    compiler;
    regexRoot;
}
