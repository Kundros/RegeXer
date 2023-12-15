import { RegexTypes } from "@kundros/regexer/types/models/RegexParser";
import { AST, ASTGroup, ASTIteration, ASTOption, ASTPrimitive, RegexStates } from "@kundros/regexer";

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
                this.handleAddElement(elements, this.highlightInternal(text, AST.children[i]));
            }
        }

        return elements;
    }

    private static highlightInternal(text : string, AST: RegexTypes.ASTtype){

        if(AST.type & RegexStates.GROUP)
        {
            AST = AST as ASTGroup;

            const openingBracket = text.slice(AST.start, AST.start + 1);
            const inside = text.slice(AST.start + 1, AST.end - 1);
            const closingBracket = text.slice(AST.end - 1, AST.end);

            return this.wrapElement([
                    this.wrapElement(openingBracket, "span", ["group-br"]),
                    ...this.highlight(text, AST),
                    this.wrapElement(closingBracket, "span", ["group-br"])
                ], "span", ["group"]
            );
        }

        if(AST.type & RegexStates.OPTION)
        {
            const options = (AST as ASTOption).children;


            let optionElements : Node[] = [];

            options.forEach((option, idx) => {
                let optionChoice : Node[] = [];
                option.forEach(optionChoiceElement => {
                    this.handleAddElement(optionChoice, this.highlightInternal(text, optionChoiceElement));
                });

                optionElements.push(
                    this.wrapElement(optionChoice, "span", ["option-choice"])
                );

                if (idx !== options.length - 1)
                    optionElements.push(this.wrapElement('|', "span", ['option-pipe']));
            });

            return this.wrapElement(optionElements, "span", ['option']);
        }

        if(AST.type & RegexStates.PRIMITIVE)
        {
            return document.createTextNode((AST as ASTPrimitive).chr);
        }
    }

    private static handleAddElement(elements: Node[], element: Node)
    {
        if(element instanceof Text && elements.length > 0 && elements[elements.length-1] instanceof Text){
            (elements[elements.length-1] as Text).textContent += element.textContent;
            return;
        }
        elements.push(element);
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