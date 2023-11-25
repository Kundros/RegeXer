export { Regexer } from "@models/Regexer";
import { Regexer } from "@models/Regexer";

const test = new Regexer("a(a|b|c|d|e|f|g)*a");

setInterval(async () => {
    try
    {
        console.time("Estimated: ");

        const res = await test.match("abbbbbcccdefffffggggggggggfffeffffa");
        console.log(res);
        const result = await test.match("abbbbbcccdefffffggggggggggfffeffoffa");
        console.log(result);

        console.timeEnd("Estimated: ");
    }
    catch(e){ console.log(e); }
}, 1000);