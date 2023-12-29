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
  export function setCursorPosition(parent : HTMLElement | ChildNode, pos : number) 
  {
    const sel = window.getSelection();

    sel.removeAllRanges();
    
    const range = internalSetCursor(parent, document.createRange(), { pos, done: false });

    range.collapse(true);
    sel.addRange(range);
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