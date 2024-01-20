export class ElementHelper
{
    public static handleAddElement(elements: Node[], element?: Node, specialBr: boolean = true)
    {
        if(element === undefined)
            return;

        const lastNode = (elements.length > 0) ? elements[elements.length-1] : undefined;

        if(element instanceof Text && lastNode instanceof Text){
            lastNode.textContent += element.textContent;
            return;
        } 

        if(specialBr)
            this.hangleBreakline(elements, element);

        elements.push(element);
    }

    public static wrapElement(toWrap : string | Node[], elTag = "span", elClasses : string[] = [], attributes : [string, string][] = [])
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

    private static hangleBreakline(elements: Node[], element: Node)
    {
        const lastNode = (elements.length > 0) ? elements[elements.length-1] : undefined;

        if(element instanceof HTMLElement && element.classList.contains('new-line-symbol'))
        {
            this.removeLastBreakline(lastNode);

            element.appendChild(document.createElement("br"));
            elements.push(element);

            return;
        }

        this.removeLastBreakline(lastNode);
    }

    private static removeLastBreakline(lastNode : Node)
    {
        if(lastNode instanceof HTMLElement && lastNode.classList.contains('new-line-symbol'))
        {
            const br = lastNode.querySelector("br");
            if(br !== null)
                lastNode.removeChild(br);
        }
    }
}