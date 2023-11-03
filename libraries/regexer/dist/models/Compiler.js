import { Stack } from "../structures/Stack.js";
import { StringReader } from "../helpers/StringReader.js";
import { stateType } from "../structures/stateType.js";
import { RegexElement } from "../models/regexNFA/RegexElement.js";
import { RegexString } from "../models/regexNFA/RegexString.js";
import { RegexOption } from "./regexNFA/RegexOption.js";
/**
 * Compiles string to executable regex NFA
 */
export class Compiler {
    compile(regexString) {
        const stringReader = new StringReader(regexString);
        this.stackElements.push(this.rootElement);
        /* Main loop compiling to executable regex NFA */
        let character;
        while ((character = stringReader.next()) != null) {
            /* Special and escaped characters must be handeled first */
            if (this.handleSpecialCharacter(character))
                continue;
            if (this.handleEscapedCharacter(character))
                continue;
            if (this.handleOption(character))
                continue;
            if (this.handleCharacter(character))
                continue;
        }
        return this.rootElement;
    }
    handleSpecialCharacter(character) {
        if (this.states.top() != stateType.ESCAPED)
            return false;
        if (Compiler.specialCharacters_.includes(character)) {
            this.states.pop();
            return true;
        }
        return false;
    }
    handleCharacter(character) {
        const characterCode = character.charCodeAt(0);
        if ((characterCode >= 65 && characterCode <= 90) ||
            (characterCode >= 97 && characterCode <= 122)) {
            this.addCharacter(character);
            return true;
        }
        return false;
    }
    handleEscapedCharacter(character) {
        if (this.states.top() == stateType.ESCAPED) {
            this.addCharacter("\\" + character);
            this.states.pop();
            return true;
        }
        if (character === '\\')
            this.states.push(stateType.ESCAPED);
        return false;
    }
    handleOption(character) {
        if (character === '|') {
            this.states.push(stateType.OPTION);
            const optionElement = new RegexOption([this.stackElements.pop()]);
            this.stackElements.top().setNext(optionElement);
            this.stackElements.push(optionElement);
            return true;
        }
        return false;
    }
    addCharacter(character) {
        if (this.stackElements.top() instanceof RegexString) {
            this.stackElements.top().append(character);
            return;
        }
        const characterNode = new RegexString(character);
        this.stackElements.top().setNext(characterNode);
        this.stackElements.push(characterNode);
    }
    states = new Stack();
    rootElement = new RegexElement();
    stackElements = new Stack();
    static specialCharacters_ = ['s', 'S', 'd', 'D', 'w', 'W'];
}
