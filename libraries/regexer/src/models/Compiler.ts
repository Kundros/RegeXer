import { Stack } from "@regexer/structures/Stack"
import { StringReader } from "@regexer/helpers/StringReader"
import { stateType } from "@regexer/structures/stateType";
import { RegexElement } from "@regexer/models/regexNFA/RegexElement";
import { RegexSymbol } from "@regexer/models/regexNFA/RegexSymbol";
import { Regexer } from "@regexer/models/Regexer";

/**
 * Compiles string to executable regex NFA
 */
export class Compiler
{
    public static compile(regexString: string) : Regexer
    {
        let states = new Stack<stateType>;
        const stringReader = new StringReader(regexString);

        let rootRegexNFA : RegexElement = new RegexElement();

        
        /* Main loop compiling to executable regex NFA */
        let character: string | null;
        while((character = stringReader.next()) != null)
        {
            const characterCode = character.charCodeAt(0);
            if(
                (characterCode >= 65  && characterCode <= 90) ||
                (characterCode >= 97 && characterCode <= 122)
            )
            {
                rootRegexNFA.addFolowingElement(new RegexSymbol(character));
            }
        }

        return new Regexer(rootRegexNFA);
    }
}