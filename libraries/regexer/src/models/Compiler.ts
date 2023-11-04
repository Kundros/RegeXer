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
        /* check if is option character */
        if(character != '|')
            return false;

        let addElement : RegexElement;

        /* handle already existing option (option possible) */
        if(this.states.top() === stateType.OPTION_POSSIBLE)
        {
            this.states.pop();
            this.states.push(stateType.OPTION);

            return true;
        }

        /* handle string */
        if(this.stackElements.top() instanceof RegexString)
        {
            const stringElement = <RegexString>this.stackElements.top();
            const lastCharacter = stringElement.pop();

            if(stringElement.length == 0)
                this.stackElements.pop();

            addElement = new RegexString(lastCharacter);
        }
        else
        {
            addElement = this.stackElements.pop();
        }

        this.handleAddElement(new RegexOption([addElement]));
        this.states.push(stateType.OPTION);

        return true;
    }

    private addCharacter(character: string) : void
    {
        if(this.stackElements.top() instanceof RegexString)
        {
            (<RegexString>this.stackElements.top()).append(character);
            return;
        }

        this.handleAddElement(new RegexString(character));
    }

    private handleAddElement(element: RegexElement)
    {
        /* if last element was an option then there is possibility to contain another option */
        if(this.states.top() === stateType.OPTION && this.stackElements.top() instanceof RegexOption)
        {
            (<RegexOption>this.stackElements.top()).addOption(element);

            this.states.pop();
            this.states.push(stateType.OPTION_POSSIBLE); 

            return;
        }

        if(this.states.top() === stateType.OPTION_POSSIBLE)
            this.states.pop();

        this.stackElements.top().setNext(element);
        this.stackElements.push(element);
    }


    private states = new Stack<stateType>();
    private rootElement = new RegexElement();
    private stackElements = new Stack<RegexElement>();

    private static readonly specialCharacters_ = ['s', 'S', 'd', 'D', 'w', 'W'];
}