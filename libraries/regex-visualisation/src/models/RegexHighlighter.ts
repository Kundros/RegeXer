import { RegexTypes } from "@kundros/regexer/types/models/RegexParser";
import { AST, ASTGroup, ASTPrimitive, RegexStates } from "@kundros/regexer";

export class RegexHighlighter
{
    constructor()
    {}

    public static highlight(text : string, AST: RegexTypes.ASTtype){
        let elements : Node[] = [];
        
        
        if((AST as AST).children)
        {
            AST = AST as AST;
            const childrenCount = AST.children.length;

            for(let i = 0 ; i < childrenCount ; i++){
                elements.push(...this.highlightInternal(text, AST.children[i]));
            }
        }

        return elements;
    }

    private static highlightInternal(text : string, AST: RegexTypes.ASTtype){
        let elements : Node[] = [];

        if(AST.type & RegexStates.GROUP)
        {
            AST = AST as ASTGroup;

            const openingBracket = text.slice(AST.start, AST.start + 1);
            const inside = text.slice(AST.start + 1, AST.end - 1);
            const closingBracket = text.slice(AST.end - 1, AST.end);

            elements.push(
                this.wrapElement([
                    this.wrapElement(openingBracket, "span", ["group-br"]),
                    ...this.highlight(text, AST),
                    this.wrapElement(closingBracket, "span", ["group-br"])
                ], "span", ["group"])
            )
        } 

        if(AST.type & RegexStates.PRIMITIVE)
        {
            elements.push(document.createTextNode((AST as ASTPrimitive).chr));
        }

        return elements;
    }

    private static wrapElement(toWrap : string | Node[], elTag = "span", elClasses = [])
    {
        let element = document.createElement(elTag);

        if(elClasses.length > 0)
            element.classList.add(...elClasses);

        if(typeof toWrap === "string")
            element.innerText = toWrap;
        else
            element.append(...toWrap);

        return element;
    }
}