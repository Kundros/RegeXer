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
        /* check if is option character */
        if (character != '|')
            return false;
        let addElement;
        /* handle already existing option (option possible) */
        if (this.states.top() === stateType.OPTION_POSSIBLE) {
            this.states.pop();
            this.states.push(stateType.OPTION);
            return true;
        }
        /* handle string */
        if (this.stackElements.top() instanceof RegexString) {
            const stringElement = this.stackElements.top();
            const lastCharacter = stringElement.pop();
            if (stringElement.length == 0)
                this.stackElements.pop();
            addElement = new RegexString(lastCharacter);
        }
        else {
            addElement = this.stackElements.pop();
        }
        this.handleAddElement(new RegexOption([addElement]));
        this.states.push(stateType.OPTION);
        return true;
    }
    addCharacter(character) {
        if (this.stackElements.top() instanceof RegexString) {
            this.stackElements.top().append(character);
            return;
        }
        this.handleAddElement(new RegexString(character));
    }
    handleAddElement(element) {
        /* if last element was an option then there is possibility to contain another option */
        if (this.states.top() === stateType.OPTION && this.stackElements.top() instanceof RegexOption) {
            this.stackElements.top().addOption(element);
            this.states.pop();
            this.states.push(stateType.OPTION_POSSIBLE);
            return;
        }
        if (this.states.top() === stateType.OPTION_POSSIBLE)
            this.states.pop();
        this.stackElements.top().setNext(element);
        this.stackElements.push(element);
    }
    states = new Stack();
    rootElement = new RegexElement();
    stackElements = new Stack();
    static specialCharacters_ = ['s', 'S', 'd', 'D', 'w', 'W'];
}
