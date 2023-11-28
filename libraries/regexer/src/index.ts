export { Regexer } from "@models/Regexer";
import { Regexer } from "@models/Regexer";

import { writeFile } from 'fs'

const test = new Regexer("a(a|b|c|d|e|f|g)+a+[a-zA-Z0-9]+");

//setInterval(
    (async () => {
    try
    {
        console.time("Estimated: ");

        const res = await test.match("abbbbbcccdefffffggggggggggfffeffffaa");
        console.log(res);
        writeFile('output1.json', JSON.stringify(res), () => {});

        const result = await test.match("abbbbbcccdefffffggggggggggfffeffoaffakgroegwoovomvomqawkmdopqadppedqqqdgwgqdrergddqwfwegergrekgerklgretklgrtkleklmewrfgwwfwfwjfwnjehejkgherjkgnwregrejrgerjgejgegdbnjkdbjernktbejkgddfnbkjdkjetgenrlgjnjnsgdenjkgejnegjjwdhtbbikegegegeomeimvoerjgeioejgeoigjeoierjgoeigjeogjegekfdmgoiejgeroigejgeodmoirevbedrgoierjerdiogjergedrojgroejggojieirjgeogedrgmgpedogkeg1");
        console.log(result);
        writeFile('output2.json', JSON.stringify(result), () => {});
        
        const res2 = await test.match("aa");
        console.log(res2);
        writeFile('output3.json', JSON.stringify(res2), () => {});

        const res3 = await test.match("aaa");
        console.log(res3);
        writeFile('output4.json', JSON.stringify(res3), () => {});

        console.timeEnd("Estimated: ");
    }
    catch(e){ console.log(e); }
})()
//, 1000);