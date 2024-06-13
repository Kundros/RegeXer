/*
	code from is copied from stackoverflow solution, and adjusted to this project's needs:
	https://stackoverflow.com/questions/69956977/html-contenteditable-keep-caret-position-when-inner-html-changes
*/

export type CursorStat = { position: number, endPosition?: number, done: boolean, doneEnd?: boolean };

// get the cursor position from .editor start
export function getCursorPosition(parent: HTMLElement | ChildNode) 
{
	const selection = window.getSelection();
	const node = selection.focusNode;
	const offset = selection.focusOffset;

	const { position } = internalGetCursor(parent, node, offset, { position: 0, done: false });

	return position;
}

function internalGetCursor(parent: HTMLElement | ChildNode, node: Node, offset: number, stat: CursorStat) 
{
	if (stat.done) return stat;

	let currentNode = null;

	if (parent.childNodes.length == 0) 
	{
		stat.position += parent.textContent.length;
	} 
	else 
	{
		for (let i = 0; i < parent.childNodes.length && !stat.done; i++) 
		{
			currentNode = parent.childNodes[i];
			if (currentNode === node) 
			{
				stat.position += offset;
				stat.done = true;
				return stat;
			} 
			else 
				internalGetCursor(currentNode, node, offset, stat);
		}
	}

	return stat;
}

//find the child node and relative position and set it on range
export function setCursorPosition(parent: HTMLElement | ChildNode, position: number, endPosition?: number) 
{
	const sel = window.getSelection();

	let saveRange: Range | undefined;

	if (!endPosition) 
	{
		if (sel.rangeCount > 0)
			saveRange = sel.getRangeAt(0).cloneRange();

		sel.removeAllRanges();
	}

	console.log(!endPosition);

	const stat = { position: position, endPosition: endPosition, done: false, doneEnd: !endPosition };
	const range = internalSetCursor(parent, document.createRange(), stat);

	if (!stat.done && !endPosition) 
	{
		if (saveRange !== undefined)
			sel.addRange(saveRange);
		return saveRange;
	}

	if (!endPosition)
		range.collapse(true);

	if (!endPosition) 
	{
		sel.addRange(range);

		const tempElement = document.createElement('br');

		const caretBound = range.getBoundingClientRect();
		const parentBound = document.activeElement.getBoundingClientRect();

		if (caretBound.y - parentBound.y > parentBound.height - caretBound.height * 2 || caretBound.y - parentBound.y < 0) 
		{
			range.cloneRange().insertNode(tempElement);

			if (caretBound.y - parentBound.y - caretBound.height < 0) 
			{
				tempElement.scrollIntoView({
					block: 'start',
				});
				document.activeElement.scrollBy(0, caretBound.height);
			}
			else
				tempElement.scrollIntoView({
					block: 'end',
				});

			tempElement.remove();
		}
	}

	return range;
}

function internalSetCursor(parent: HTMLElement | ChildNode, range: Range, stat: CursorStat) 
{
	if (stat.done && stat.doneEnd) return range;

	if (parent.childNodes.length == 0) {
		if (parent.textContent.length >= stat.position && !stat.done) 
		{
			range.setStart(parent, stat.position);
			stat.done = true;

			if (!stat.endPosition)
				stat.doneEnd = true;
		}
		else 
		{
			stat.position -= parent.textContent.length;
		}

		if (parent.textContent.length >= stat.endPosition && !stat.doneEnd) 
		{
			range.setEnd(parent, stat.endPosition);
			stat.doneEnd = true;
		}
		else if (stat.endPosition) 
		{
			stat.endPosition -= parent.textContent.length;
		}
	}
	else 
	{
		for (let i = 0; i < parent.childNodes.length; i++) 
		{
			if (stat.done && stat.doneEnd)
				break;

			const currentNode = parent.childNodes[i];
			internalSetCursor(currentNode, range, stat);
		}
	}

	return range;
}

export function getPositionInNode(parent: HTMLElement | ChildNode) 
{
	const sel = window.getSelection();
	const node = sel.focusNode;
	const offset = sel.focusOffset;

	const { position } = internalGetPositionInNode(parent, node, offset, { position: 0, done: false, doneEnd: true });

	return position;
}

function internalGetPositionInNode(parent: HTMLElement | ChildNode, node: Node, offset: number, stat: CursorStat) 
{
	if (stat.done) return stat;

	let currentNode = null;
	if (parent.childNodes.length == 0) 
	{
		stat.position += parent.textContent.length;
	} 
	else 
	{
		for (let i = 0; i < parent.childNodes.length && !stat.done; i++) 
		{
			currentNode = parent.childNodes[i];

			if (currentNode === node) 
			{
				stat.position += offset;
				stat.done = true;
				return stat;
			} 
			else 
				internalGetCursor(currentNode, node, offset, stat);
		}
	}
	
	return stat;
}