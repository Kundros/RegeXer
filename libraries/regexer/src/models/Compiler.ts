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
    public static compile(regexString: string) : RegexElement
    {
        let states = new Stack<stateType>();
        let rootElement = new RegexElement();
        let stackElements = new Stack<RegexElement>();
        const stringReader = new StringReader(regexString);

        stackElements.push(rootElement);
        
        /* Main loop compiling to executable regex NFA */
        let character: string | null;
        while((character = stringReader.next()) != null)
        {
            if(this.isRegexCharacter(character, states.top()))
            {
                const characterNode = new RegexCharacter(character);

                stackElements.top().addNeighbour(characterNode);
                stackElements.push(characterNode);
            }
        }

        return rootElement;
    }

    private static isRegexCharacter(character: string, state: stateType){
        const characterCode = character.charCodeAt(0);
            
        return (characterCode >= 65 && characterCode <= 90) ||
               (characterCode >= 97 && characterCode <= 122);
    }
}