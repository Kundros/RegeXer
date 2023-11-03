import { Stack } from "@regexer/structures/Stack"
import { StringReader } from "@regexer/helpers/StringReader"
import { stateType } from "@regexer/structures/stateType";
import { RegexElement } from "@regexer/models/regexNFA/RegexElement";
import { RegexCharacter } from "@regexer/models/regexNFA/RegexCharacter";
import { Regexer } from "@regexer/models/Regexer";

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
            if(this.handleSpecialCharacter(character))
                continue;
            if(this.handleEscapedCharacter(character))
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
            this.addCharacter(character);
            this.states.pop();
            return true;
        }
        
        if(character === '\\')
            this.states.push(stateType.ESCAPED);

        return false;
    }

    private addCharacter(character: string) : void
    {
        const characterNode = new RegexCharacter(character);

        this.stackElements.top().addNeighbour(characterNode);
        this.stackElements.push(characterNode);
    }


    private states = new Stack<stateType>();
    private rootElement = new RegexElement();
    private stackElements = new Stack<RegexElement>();

    private static readonly specialCharacters_ = ['s', 'S', 'd', 'D', 'w', 'W'];
}