import { StringReader } from "@helpers/StringReader"
import { RegexMatch } from "@models/RegexMatch";
import { parse, customTypes } from "@models/regexParser"
import { RegCompileException } from "@exceptions/RegCompileException";

export class Regexer{
    constructor(regexString : string = "")
    {
        try{
            const data = parse(regexString);
            this.AST_ = data?.AST;
            this.NFA_ = data?.NFA;
        }
        catch(e) {
            console.log(e);
            throw new RegCompileException("unable to parse regex");
        }
    }

    public match(matchString : string) : RegexMatch
    {
        const stringReader = new StringReader(matchString);

        let character : string | null;
        while((character = stringReader.next()) != null)
        {
            
        }

        return new RegexMatch();
    }

    private AST_: customTypes.ASTRoot;
    private NFA_: customTypes.NFAState[];
}