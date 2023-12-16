import { RegexTypes } from "@kundros/regexer/types/models/RegexParser";
import { AST, ASTGroup, ASTIteration, ASTOption, ASTPrimitive, RegexStates } from "@kundros/regexer";

export class RegexHighlighter
{
    constructor()
    {}

    public static highlight(text : string, AST: RegexTypes.ASTtype, isRoot: boolean = true){
        let elements : Node[] = [];
        
        
        if((AST as AST).children)
        {
            AST = AST as AST;
            const childrenCount = AST.children.length;

            for(let i = 0 ; i < childrenCount ; i++){
                this.handleAddElement(elements, this.highlightInternal(text, AST.children[i]), isRoot);
            }
        }

        return elements;
    }

    private static highlightInternal(text : string, AST: RegexTypes.ASTtype) : Node
    {

        if(AST.type & RegexStates.GROUP)
        {
            AST = AST as ASTGroup;

            const openingBracket = text.slice(AST.start, AST.start + 1);
            const inside = text.slice(AST.start + 1, AST.end - 1);
            const closingBracket = text.slice(AST.end - 1, AST.end);

            return this.wrapElement([
                this.wrapElement(openingBracket, "span", ["group-br"]),
                ...this.highlight(text, AST, false),
                this.wrapElement(closingBracket, "span", ["group-br"])
            ], "span", ["group"]);
        }

        if(AST.type & RegexStates.OPTION)
        {
            const options = (AST as ASTOption).children;
            let optionElements : Node[] = [];

            options.forEach((option, idx) => {
                let optionChoice : Node[] = [];

                option.forEach(optionChoiceElement => {
                    this.handleAddElement(optionChoice, this.highlightInternal(text, optionChoiceElement), idx === options.length - 1);
                });

                optionElements.push(
                    this.wrapElement(optionChoice, "span", ["option-choice"])
                );

                if (idx !== options.length - 1)
                    optionElements.push(this.wrapElement('|', "span", ['option-pipe']));
            });

            return this.wrapElement(optionElements, "span", ['option']);
        }

        if(AST.type & (RegexStates.N_LIST | RegexStates.P_LIST))
        {
            let elements = [];

            const openingBracket = text.slice(AST.start, AST.start + 1);
            elements.push(this.wrapElement(openingBracket, "span", ["list-br"]));

            let skipInside = 1;
            if(AST.type & RegexStates.N_LIST)
            {
                skipInside++;
                elements.push(this.wrapElement('^', "span", ["list-neg"]));
            }

            const inside = text.slice(AST.start + skipInside, AST.end - 1);
            const closingBracket = text.slice(AST.end - 1, AST.end);

            elements.push(this.wrapElement(inside, "span", ["list-inside"]));
            elements.push(this.wrapElement(closingBracket, "span", ["list-br"]));

            return this.wrapElement(elements, "span", ["list"]);
        }

        if(AST.type & (RegexStates.ITERATION_ONE | RegexStates.ITERATION_ZERO))
        {
            AST = AST as ASTIteration;

            return this.wrapElement([
                this.highlightInternal(text, AST.children[0]),
                this.wrapElement(text.slice(AST.end - 1, AST.end), "span", ["iteration-symbol"])
            ], "span", ["iteration"]);
        }

        if(AST.type & RegexStates.PRIMITIVE)
        {
            let char = (AST as ASTPrimitive).chr;

            if(char === '\t')
                return this.wrapElement('\t', "span", ["tab-symbol"]);

            if(char === '\n')
                return this.wrapElement([document.createTextNode('\n')], "span", ["new-line-symbol"]);

            return document.createTextNode(char);
        }

        if(AST.type & RegexStates.END_STRING)
            return this.wrapElement('$', "span", ["EOS"]);
        if(AST.type & RegexStates.START_STRING)
            return this.wrapElement('^', "span", ["SOS"]);
    }

    private static handleAddElement(elements: Node[], element?: Node, specialBr: boolean = true)
    {
        if(element === undefined)
            return;

        const lastNode = (elements.length > 0) ? elements[elements.length-1] : undefined;

        if(element instanceof Text && lastNode instanceof Text){
            lastNode.textContent += element.textContent;
            return;
        } 

        if(specialBr)
        {
            if(element instanceof HTMLElement && element.classList.contains('new-line-symbol'))
            {
                this.removeLastBr(lastNode);

                element.appendChild(document.createElement("br"));
                console.log("test ");
                elements.push(element);

                return;
            }

            this.removeLastBr(lastNode);
        }

        elements.push(element);
    }

    private static removeLastBr(lastNode : Node)
    {
        if(lastNode instanceof HTMLElement && lastNode.classList.contains('new-line-symbol'))
        {
            const br = lastNode.querySelector("br");
            if(br !== null)
                lastNode.removeChild(br);
        }
    }


    private static wrapElement(toWrap : string | Node[], elTag = "span", elClasses : string[] = [], attributes : [string, string][] = [])
    {
        let element = document.createElement(elTag);

        if(elClasses.length > 0)
            element.classList.add(...elClasses);

            attributes.forEach(attribute => {
                element.setAttribute(attribute[0], attribute[1]);
            });

        if(typeof toWrap === "string")
            element.innerText = toWrap;
        else
            element.append(...toWrap);

        return element;
    }
}