import { AST, ASTGroup, ASTIteration, ASTOption, ASTPrimitive, ASTtype, AstEscapedSpecial, GroupTypes, RegexStates } from "@kundros/regexer";
import { TextEditor, TextEditorOptions } from "./TextEditor";
import { getCursorPosition, setCursorPosition } from "./other/caretHelper";
import { ElementHelper } from "./other/ElementHelper";

export class RegexEditor extends TextEditor
{
    constructor(textInput : HTMLElement, options?: TextEditorOptions)
    {
        super(textInput, options);
    }

    public highlight(AST: ASTtype, isRoot: boolean = true) : Node[] | null
    {
        let elements : Node[] = [];
        
        if((AST as AST).children)
        {
            const element = AST as AST;
            const childrenCount = element.children.length;

            for(let i = 0 ; i < childrenCount ; i++){
                ElementHelper.handleAddElement(elements, this.highlightInternal(element.children[i]), isRoot);
            }
        }

        if(isRoot)
        {
            const pos = getCursorPosition(this.textInput_);
            this.textInput_.replaceChildren(...elements);
            setCursorPosition(this.textInput_, pos);

            this.updateText();
        }
        else
            return elements;
    }

    public highlightError(textPos : [number, number])
    {
        const text = this.textInput_.textContent;

        const pos = getCursorPosition(this.textInput_);
        
        this.textInput_.replaceChildren(...[
            document.createTextNode(text.slice(0, textPos[0])),
            ElementHelper.wrapElement(text.slice(textPos[0], textPos[1]), "span", ["err-pos"]), 
            document.createTextNode(text.slice(textPos[1], text.length))
        ]);

        setCursorPosition(this.textInput_, pos);

        this.updateText();
    }

    private highlightInternal(AST: ASTtype) : Node
    {
        const text = this.textInput_.textContent;

        if(AST.type & RegexStates.GROUP)
        {
            const group = AST as ASTGroup;

            const openingBracket = text.slice(group.start, group.start + 1);
            const closingBracket = text.slice(group.end - 1, group.end);

            let groupElements = [];
            
            groupElements.push(ElementHelper.wrapElement(openingBracket, "span", ["group-br"]));

            if(group.detailedType === GroupTypes.NON_CAPTURING)
            {
                groupElements.push(ElementHelper.wrapElement("?:", "span", ["group-nonCapturing"]));
            }
            else if(group.detailedType === GroupTypes.NAMED)
            {
                groupElements.push(ElementHelper.wrapElement([
                    document.createTextNode("?<"), 
                    ElementHelper.wrapElement(group.name, "span", ["group-name"]), 
                    document.createTextNode(">")
                ], "span", ["group-named"]));
            }

            groupElements.push(...this.highlight(group, false));
            groupElements.push(ElementHelper.wrapElement(closingBracket, "span", ["group-br"]));

            return ElementHelper.wrapElement(groupElements, "span", ["group"]);
        }

        if(AST.type & RegexStates.OPTION)
        {
            const options = (AST as ASTOption).children;
            let optionElements : Node[] = [];

            options.forEach((option, idx) => {
                let optionChoice : Node[] = [];

                option.forEach(optionChoiceElement => {
                    ElementHelper.handleAddElement(optionChoice, this.highlightInternal(optionChoiceElement), idx === options.length - 1);
                });

                optionElements.push(
                    ElementHelper.wrapElement(optionChoice, "span", ["option-choice"])
                );

                if (idx !== options.length - 1)
                {
                    optionElements.push(ElementHelper.wrapElement('|', "span", ['option-pipe']));
                }
            });

            return ElementHelper.wrapElement(optionElements, "span", ['option']);
        }

        if(AST.type & (RegexStates.N_LIST | RegexStates.P_LIST))
        {
            let elements = [];

            const openingBracket = text.slice(AST.start, AST.start + 1);
            elements.push(ElementHelper.wrapElement(openingBracket, "span", ["list-br"]));

            let skipInside = 1;
            if(AST.type & RegexStates.N_LIST)
            {
                skipInside++;
                elements.push(ElementHelper.wrapElement('^', "span", ["list-neg"]));
            }

            const inside = text.slice(AST.start + skipInside, AST.end - 1);
            const closingBracket = text.slice(AST.end - 1, AST.end);

            elements.push(ElementHelper.wrapElement(inside, "span", ["list-inside"]));
            elements.push(ElementHelper.wrapElement(closingBracket, "span", ["list-br"]));

            return ElementHelper.wrapElement(elements, "span", ["list"]);
        }

        if(AST.type & (RegexStates.ITERATION_ONE | RegexStates.ITERATION_ZERO))
        {
            const iteration = AST as ASTIteration;

            return ElementHelper.wrapElement([
                this.highlightInternal(iteration.children[0]),
                ElementHelper.wrapElement(text.slice(iteration.end - 1, iteration.end), "span", ["iteration-symbol"])
            ], "span", ["iteration"]);
        }

        if(AST.type & RegexStates.PRIMITIVE)
        {
            const primitive = AST as ASTPrimitive;
            const char = text.slice(primitive.start, primitive.end);

            if(char === '\t')
                return ElementHelper.wrapElement('\t', "span", ["tab-symbol"]);

            if(char === '\n')
                return ElementHelper.wrapElement([document.createTextNode('\n')], "span", ["new-line-symbol"]);

            if(char.length > 1)
                return ElementHelper.wrapElement([document.createTextNode(char)], "span", ["escaped-char"]);

            return document.createTextNode(char);
        }

        if(AST.type & RegexStates.SPECIAL)
        {
            const special = AST as AstEscapedSpecial;
            const char = text.slice(special.start, special.end);
            return ElementHelper.wrapElement([document.createTextNode(char)], "span", ["special-char"]);
        }

        if(AST.type & RegexStates.END_STRING)
            return ElementHelper.wrapElement('$', "span", ["EOS"]);
        if(AST.type & RegexStates.START_STRING)
            return ElementHelper.wrapElement('^', "span", ["SOS"]);
    }
}