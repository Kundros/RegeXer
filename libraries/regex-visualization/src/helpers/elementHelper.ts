export function handleAddElement(elements: Node[], element?: Node, specialBr: boolean = true)
{
    if(element === undefined)
        return;

    const lastNode = (elements.length > 0) ? elements[elements.length-1] : undefined;

    if(element instanceof Text && lastNode instanceof Text){
        lastNode.textContent += element.textContent;
        return;
    } 

    if(specialBr)
        handleBreakLine(elements, element);

    elements.push(element);
}

export function wrapElement(toWrap : string | Node[], elTag = "span", elClasses : string[] = [], attributes : [string, string][] = [])
{
    const element = document.createElement(elTag);

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

export function handleBreakLine(elements: Node[], element: Node)
{
    const lastNode = (elements.length > 0) ? elements[elements.length-1] : undefined;

    if(element instanceof HTMLElement && element.classList.contains('new-line-symbol'))
    {
        removeLastBreakLine(lastNode);

        element.appendChild(document.createElement("br"));
        elements.push(element);

        return;
    }

    removeLastBreakLine(lastNode);
}

export function removeLastBreakLine(lastNode : Node)
{
    if(lastNode instanceof HTMLElement && lastNode.classList.contains('new-line-symbol'))
    {
        const br = lastNode.querySelector("br");
        if(br !== null)
            lastNode.removeChild(br);
    }
}
