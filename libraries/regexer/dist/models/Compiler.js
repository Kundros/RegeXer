import { Stack } from "../structures/Stack.js";
import { StringReader } from "../helpers/StringReader.js";
import { RegexElement } from "../models/regexNFA/RegexElement.js";
import { RegexCharacter } from "../models/regexNFA/RegexCharacter.js";
/**
 * Compiles string to executable regex NFA
 */
export class Compiler {
    static compile(regexString) {
        let states = new Stack();
        let rootElement = new RegexElement();
        let stackElements = new Stack();
        const stringReader = new StringReader(regexString);
        stackElements.push(rootElement);
        /* Main loop compiling to executable regex NFA */
        let character;
        while ((character = stringReader.next()) != null) {
            if (this.isRegexCharacter(character, states.top())) {
                const characterNode = new RegexCharacter(character);
                stackElements.top().addNeighbour(characterNode);
                stackElements.push(characterNode);
            }
        }
        return rootElement;
    }
    static isRegexCharacter(character, state) {
        const characterCode = character.charCodeAt(0);
        return (characterCode >= 65 && characterCode <= 90) ||
            (characterCode >= 97 && characterCode <= 122);
    }
}
