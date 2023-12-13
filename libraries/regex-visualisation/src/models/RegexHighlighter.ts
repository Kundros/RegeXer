import { RegexTypes } from "@kundros/regexer/types/models/RegexParser";
import { ASTGroup, RegexStates } from "@kundros/regexer/types/models/parserTypes";

export class RegexHighlighter
{
    constructor()
    {}

    public static highlight(text : string, AST: RegexTypes.ASTRoot){
        if(AST.children && AST.children.length > 0)
        {
            text = this.highlightInternal(text, AST.children[0]);
        }

        return text;
    }

    private static highlightInternal(text : string, AST: RegexTypes.ASTtype){
        if(AST.type & RegexStates.GROUP)
        {
            AST = AST as ASTGroup;

            text =  "<span class='group'>" 
                        + text.slice(AST.start, AST.start) + 
                    "</span>" + 
                    text.slice(AST.start + 1, AST.end - 1) + 
                    "<span class='group-end'>" + 
                        text.slice(AST.end, AST.end) + 
                    "</span>";
        } 

        return text;
    }
}