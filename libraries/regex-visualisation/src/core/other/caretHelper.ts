/*
    code from is copyed from stackoverflow solution, and adjusted to this project's needs:
    https://stackoverflow.com/questions/69956977/html-contenteditable-keep-caret-position-when-inner-html-changes
*/

export type CursorStat = { pos : number, done: boolean };

// get the cursor position from .editor start
export function getCursorPosition(parent : HTMLElement | ChildNode) {
    const sel = window.getSelection();
    const node = sel.focusNode;
    const offset = sel.focusOffset;
  
    const { pos } = internalGetCursor(parent, node, offset, { pos: 0, done: false});

    return pos;
  }

  function internalGetCursor(parent : HTMLElement | ChildNode, node : Node, offset : number, stat : CursorStat){
    if (stat.done) return stat;
  
    let currentNode = null;
    if (parent.childNodes.length == 0) {
      stat.pos += parent.textContent.length;
    } else {
      for (let i = 0; i < parent.childNodes.length && !stat.done; i++) {
        currentNode = parent.childNodes[i];
        if (currentNode === node) {
          stat.pos += offset;
          stat.done = true;
          return stat;
        } else internalGetCursor(currentNode, node, offset, stat);
      }
    }
    return stat;
  }
  
  //find the child node and relative position and set it on range
  export function setCursorPosition(parent : HTMLElement | ChildNode, pos : number, newRange: boolean = false) 
  {
    const sel = window.getSelection();

    let saveRange : Range | undefined;
    
    if(!newRange)
    {
      if(sel.rangeCount > 0)
        saveRange = sel.getRangeAt(0).cloneRange();

      sel.removeAllRanges();
    }
    
    let stat = { pos, done: false };
    const range = internalSetCursor(parent, document.createRange(), stat);

    if(!stat.done && !newRange)
    {
      if(saveRange !== undefined)
        sel.addRange(saveRange);
      return saveRange;
    }

    range.collapse(true);
    if(!newRange)
    {
      sel.addRange(range);

      const tempElement = document.createElement('br');

      const caretBound = range.getBoundingClientRect();
      const parentBound = document.activeElement.getBoundingClientRect();

      if(caretBound.y - parentBound.y > parentBound.height - caretBound.height*2 || caretBound.y - parentBound.y < 0)
      {
        range.cloneRange().insertNode(tempElement);

        if(caretBound.y - parentBound.y - caretBound.height < 0)
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

  function internalSetCursor(parent : HTMLElement | ChildNode, range : Range, stat : CursorStat){
    if (stat.done) return range;
  
    if (parent.childNodes.length == 0) {
      if (parent.textContent.length >= stat.pos) {
        range.setStart(parent, stat.pos);
        stat.done = true;
      } else {
        stat.pos = stat.pos - parent.textContent.length;
      }
    } else {
      for (let i = 0; i < parent.childNodes.length && !stat.done; i++) {
        let currentNode = parent.childNodes[i];
        internalSetCursor(currentNode, range, stat);
      }
    }
    return range;
  }

export function getPositionInNode(parent : HTMLElement | ChildNode)
  {
    const sel = window.getSelection();
    const node = sel.focusNode;
    const offset = sel.focusOffset;
  
    const { pos } = internalGetPositionInNode(parent, node, offset, { pos: 0, done: false});

    return pos;
  }

  function internalGetPositionInNode(parent : HTMLElement | ChildNode, node : Node, offset : number, stat : CursorStat)
  {
    if (stat.done) return stat;
  
    let currentNode = null;
    if (parent.childNodes.length == 0) {
      stat.pos += parent.textContent.length;
    } else {
      for (let i = 0; i < parent.childNodes.length && !stat.done; i++) {
        currentNode = parent.childNodes[i];
        if (currentNode === node) {
          stat.pos += offset;
          stat.done = true;
          return stat;
        } else internalGetCursor(currentNode, node, offset, stat);
      }
    }
    return stat;
  }