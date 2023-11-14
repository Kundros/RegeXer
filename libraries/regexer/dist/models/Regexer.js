import { StringReader } from "../helpers/StringReader.js";
import { RegexMatch } from "./RegexMatch.js";
import { RegexParser } from "../models/RegexParser.js";
export class Regexer {
    constructor(regexString) {
        this.compiler = new RegexParser();
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
