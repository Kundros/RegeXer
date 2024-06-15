const path = require('path');

module.exports = function (source) {
  var callback = this.async();

  const regFindURL = /URL *\( *((?<comma>\"|\')(?:.(?<!\k<comma>)|\\\k<comma>)*\k<comma>) *, *((?:(?<comma2>\"|\')(?:.(?<!\k<comma2>)|\\\k<comma2>)*\k<comma2> *\+)? *path *\. *resolve *\( *__filename *\) *)\)/gm;

  // Perform your transformation logic using magicString
  // For example, let's replace all occurrences of 'foo' with 'bar'
  source = source.replace(regFindURL, (match, g1, g2, g3) => {
    return match.replace(g3, "import.meta.url");
  });

  callback(null, source);
};