import { Stack } from "@regexer/structures/Stack"
import { StringReader } from "@regexer/helpers/StringReader"
import { stateType } from "@regexer/structures/stateType";
import { RegexElement } from "@regexer/models/regexNFA/RegexElement";
import { RegexString } from "@regexer/models/regexNFA/RegexString";
import { Regexer } from "@regexer/models/Regexer";
import { RegexOption } from "./regexNFA/RegexOption";

/**
 * Compiles string to executable regex NFA
 */
export class Compiler
{
    public compile(regexString: string) : RegexElement
    {
        const stringReader = new StringReader(regexString);

        this.stackElements.push(this.rootElement);
        
        /* Main loop compiling to executable regex NFA */
        let character: string | null;
        while((character = stringReader.next()) != null)
        {
            /* Special and escaped characters must be handeled first */
            if(this.handleSpecialCharacter(character))
                continue;
            if(this.handleEscapedCharacter(character))
                continue;
            if(this.handleOption(character))
                continue;
            if(this.handleCharacter(character))
                continue;
        }

        return this.rootElement;
    }

    private handleSpecialCharacter(character: string) : boolean
    {
        if(this.states.top() != stateType.ESCAPED)
            return false;

        if(Compiler.specialCharacters_.includes(character))
        {
            this.states.pop();
            return true;
        }

        return false;
    }

    private handleCharacter(character: string) : boolean
    {
        const characterCode = character.charCodeAt(0);

        if((characterCode >= 65 && characterCode <= 90) ||
            (characterCode >= 97 && characterCode <= 122))
        {
            this.addCharacter(character);
            return true;
        }

        return false;
    }

    private handleEscapedCharacter(character: string) : boolean
    {
        if(this.states.top() == stateType.ESCAPED)
        {
            this.addCharacter("\\" + character);
            this.states.pop();
            return true;
        }
        
        if(character === '\\')
            this.states.push(stateType.ESCAPED);

        return false;
    }

    private handleOption(character: string)
    {
        if(character === '|')
        {
            this.states.push(stateType.OPTION);
            const optionElement = new RegexOption([this.stackElements.pop()]);
            this.stackElements.top().setNext(optionElement);
            this.stackElements.push(optionElement);
            return true;
        }

        return false;
    }

    private addCharacter(character: string) : void
    {
        if(this.stackElements.top() instanceof RegexString)
        {
            (<RegexString>this.stackElements.top()).append(character);
            return;
        }

        const characterNode = new RegexString(character);

        this.stackElements.top().setNext(characterNode);
        this.stackElements.push(characterNode);
    }


    private states = new Stack<stateType>();
    private rootElement = new RegexElement();
    private stackElements = new Stack<RegexElement>();

    private static readonly specialCharacters_ = ['s', 'S', 'd', 'D', 'w', 'W'];
}