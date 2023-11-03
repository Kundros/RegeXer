import { RegexElement } from "@regexer/models/regexNFA/RegexElement";
import { StringReader } from "@regexer/helpers/StringReader"
import { RegexMatch } from "@regexer/models/RegexMatch";
import { actionType } from "@regexer/structures/actionType";
import { Compiler } from "@regexer/models/Compiler";

export class Regexer{
    constructor(regexString : string)
    {
        this.compiler = new Compiler();
        this.regexRoot = this.compiler.compile(regexString);
    }

    public match(matchString: string) : RegexMatch
    {
        const stringReader = new StringReader(matchString);

        let actionList: {action: actionType, element: RegexElement}[] = [];

        let character : string | null;
        while((character = stringReader.next()) != null)
        {
            
        }

        return new RegexMatch();
    }

    private compiler : Compiler;
    private regexRoot : RegexElement;
}