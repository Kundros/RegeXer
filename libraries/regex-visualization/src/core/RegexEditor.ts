import { 
    AST, 
    ASTGroup, 
    ASTIteration, 
    ASTOption, 
    ASTOptional, 
    ASTPrimitive, 
    ASTtype, 
    AstAnyCharacter, 
    AstEscapedSpecial, 
    GroupTypes, 
    RegexStates 
} from "@regexer/regex-engine";
import { TextEditor } from "./TextEditor";
import { getCursorPosition, setCursorPosition } from "./other/caretHelper";
import { handleAddElement, wrapElement } from "./other/elementHelper";

export class RegexEditor extends TextEditor
{
    /** @description highlights syntax of regular expression */
    public highlight(AST: ASTtype, isRoot: boolean = true) : Node[] | null
    {
        const elements : Node[] = [];
        
        if((AST as AST).children)
        {
            const element = AST as AST;
            const childrenCount = element.children.length;

            for(let i = 0 ; i < childrenCount ; i++){
                handleAddElement(elements, this.highlightInternal(element.children[i]), isRoot);
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

    /** @description highlights error position in regular expression */
    public highlightError(textPos : [number, number])
    {
        const text = this.textInput_.textContent;

        const pos = getCursorPosition(this.textInput_);
        
        this.textInput_.replaceChildren(...[
            document.createTextNode(text.slice(0, textPos[0])),
            wrapElement(text.slice(textPos[0], textPos[1]), "span", ["err-pos"]), 
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

            const groupElements = [];
            
            groupElements.push(wrapElement(openingBracket, "span", ["group-br"]));

            if(group.detailedType === GroupTypes.NON_CAPTURING)
            {
                groupElements.push(wrapElement("?:", "span", ["group-nonCapturing"]));
            }
            else if(group.detailedType === GroupTypes.NAMED)
            {
                groupElements.push(wrapElement([
                    document.createTextNode("?<"), 
                    wrapElement(group.name, "span", ["group-name"]), 
                    document.createTextNode(">")
                ], "span", ["group-named"]));
            }

            groupElements.push(...this.highlight(group, false));
            groupElements.push(wrapElement(closingBracket, "span", ["group-br"]));

            return wrapElement(groupElements, "span", ["group"]);
        }

        if(AST.type & RegexStates.OPTION)
        {
            const options = (AST as ASTOption).children;
            const optionElements : Node[] = [];

            options.forEach((option, idx) => {
                const optionChoice : Node[] = [];

                option.forEach(optionChoiceElement => {
                    handleAddElement(optionChoice, this.highlightInternal(optionChoiceElement), idx === options.length - 1);
                });

                optionElements.push(
                    wrapElement(optionChoice, "span", ["option-choice"])
                );

                if (idx !== options.length - 1)
                {
                    optionElements.push(wrapElement('|', "span", ['option-pipe']));
                }
            });

            return wrapElement(optionElements, "span", ['option']);
        }

        if(AST.type & (RegexStates.N_LIST | RegexStates.P_LIST))
        {
            const elements = [];

            const openingBracket = text.slice(AST.start, AST.start + 1);
            elements.push(wrapElement(openingBracket, "span", ["list-br"]));

            let skipInside = 1;
            if(AST.type & RegexStates.N_LIST)
            {
                skipInside++;
                elements.push(wrapElement('^', "span", ["list-neg"]));
            }

            const inside = text.slice(AST.start + skipInside, AST.end - 1);
            const closingBracket = text.slice(AST.end - 1, AST.end);

            elements.push(wrapElement(inside, "span", ["list-inside"]));
            elements.push(wrapElement(closingBracket, "span", ["list-br"]));

            return wrapElement(elements, "span", ["list"]);
        }

        if(AST.type & (RegexStates.ITERATION_ONE | RegexStates.ITERATION_ZERO))
        {
            const iteration = AST as ASTIteration;

            return wrapElement([
                this.highlightInternal(iteration.children[0]),
                wrapElement(text.slice(iteration.end - 1, iteration.end), "span", ["iteration-symbol"])
            ], "span", ["iteration"]);
        }

        if(AST.type & (RegexStates.ITERATION_RANGE))
        {
            const iteration = AST as ASTIteration;

            const secondRange = []; 

            if(iteration.range[0] !== iteration.range[1])
            {
                secondRange.push(wrapElement(",", "span", ["iteration-symbol"]))
                if(iteration.range[1])
                    secondRange.push(wrapElement(iteration.range[1].toString(), "span", ["iteration-range"]))
            }

            return wrapElement([
                this.highlightInternal(iteration.children[0]),
                wrapElement("{", "span", ["iteration-symbol"]),
                wrapElement(iteration.range[0].toString(), "span", ["iteration-range"]),
                ...secondRange,
                wrapElement("}", "span", ["iteration-symbol"])
            ], "span", ["iteration"]);
        }

        if(AST.type & (RegexStates.OPTIONAL))
        {
            const optional = AST as ASTOptional;

            return wrapElement([
                this.highlightInternal(optional.children[0]),
                wrapElement("?", "span", ["optional-symbol"])
            ], "span", ["iteration"]);
        }

        if(AST.type & RegexStates.PRIMITIVE)
        {
            const primitive = AST as ASTPrimitive;
            const char = text.slice(primitive.start, primitive.end);

            if(char === '\t')
                return wrapElement('\t', "span", ["tab-symbol"]);

            if(char === '\n')
                return wrapElement([document.createTextNode('\n')], "span", ["new-line-symbol"]);

            if(char.length > 1)
                return wrapElement([document.createTextNode(char)], "span", ["escaped-char"]);

            return document.createTextNode(char);
        }

        if(AST.type & RegexStates.ANY)
        {
            const any = AST as AstAnyCharacter;
            return wrapElement(text.slice(any.start, any.end), "span", ["any-symbol"]);
        }

        if(AST.type & RegexStates.SPECIAL)
        {
            const special = AST as AstEscapedSpecial;
            const char = text.slice(special.start, special.end);
            return wrapElement([document.createTextNode(char)], "span", ["special-char"]);
        }

        if(AST.type & RegexStates.END_STRING)
            return wrapElement('$', "span", ["EOS"]);
        if(AST.type & RegexStates.START_STRING)
            return wrapElement('^', "span", ["SOS"]);
    }
}