const fs = require('fs');

const validateOptions = (options) => {
    if(options === undefined)
        return;

    if (typeof options !== 'object') 
    {
        throw new Error('Invalid options. Expected an object.');
    }

    if (options.target) 
    {
        if(typeof options.target !== 'string' || !["web", "node"].includes(options.target))
            throw new Error('Invalid value of target: got ' + options.target + " expected (web | node)");
    }
};

module.exports = function (source) {
    const callback = this.async();
    const options = this.getOptions();
  
    validateOptions(options);
  
    const regFindURL = /\/\* *custom-worker-loader\?webpackPath *\: *(?<comma>\"|\')(?<path>(?:.(?<!\k<comma>)|\\\k<comma>)*)\k<comma> *\*\/ *(?<comma2>\"|\')(?:.(?<!\k<comma2>)|\\\k<comma2>)*\k<comma2> */gm;
    const target = options?.target ?? "web";

    source = source.replace(regFindURL, (match, comma, path) => {
        path = path.replace("[target]", target);
        console.log('The original file was here:', this.resourcePath);

        const filePath = this.resourcePath.split("/").slice(0, -1).join("/") + "/" + path;
        let fileContent = fs.readFileSync(filePath, 'utf-8');
        fileContent = fileContent.replace(/\\/gm, "\\\\");
        fileContent = fileContent.replace(/\`/gm, "\\\`");
        fileContent = fileContent.replace(/\$\{([^{}]*?)\}/gm, "\\\$\\{$1\\}");
        return "URL.createObjectURL(new Blob([\`" + fileContent + "\`], { type: 'text/javascript' }))";
    });
  

    callback(null, source);
  };