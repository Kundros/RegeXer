import { RegexElement } from "@models/regexNFA/RegexElement";
import { StringReader } from "@helpers/StringReader"
import { RegexMatch } from "@models/RegexMatch";
import { actionType } from "@structures/actionType";
import { RegexParser } from "@regexer/models/RegexParser";

export class Regexer{
    constructor(regexString : string)
    {
        this.compiler = new RegexParser();
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

    private compiler : RegexParser;
    private regexRoot : RegexElement;
}