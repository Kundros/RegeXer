import { RegexElement } from "@regexer/models/regexNFA/RegexElement";
import { StringReader } from "@regexer/helpers/StringReader"

export class Regexer{
    constructor(regexNFA : RegexElement)
    {
        this.root = regexNFA;
    }

    public match(matchString: string)
    {
        const stringReader = new StringReader(matchString);

        let character : string | null;
        while((character = stringReader.next()) != null)
        {

        }
    }

    private root : RegexElement;
}