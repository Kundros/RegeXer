export * from "@core/Regexer";
export * from "@core/RegexMatch"
export * from "@regexer/exceptions/RegParseException"
export * from "@exceptions/RegMatchException"
export * from "@regexer/coreTypes/parserTypes";
export { MatchComplete, MatchResultsTypes } from "@regexer/coreTypes/MatchWorkerTypes"

/*import { Regexer } from "@models/Regexer";

const test = new Regexer("a(a|b|c|d|e|f|g)+a+[a-zA-Z0-9]+");
test.newParse("abcd");

//setInterval(
    (async () => {
    try
    {
        console.time("Estimated: ");

        await testParse("abbbbbcccdefffffggggggggggfffeffffaa", "output1.json");
        await testParse("abbbbbcccdefffffggggggggggfffeffoaffakgroegwoovomvomqawkmdopqadppedqqqdgwgqdrergddqwfwegergrekgerklgretklgrtkleklmewrfgwwfwfwjfwnjehejkgherjkgnwregrejrgerjgejgegdbnjkdbjernktbejkgddfnbkjdkjetgenrlgjnjnsgdenjkgejnegjjwdhtbbikegegegeomeimvoerjgeioejgeoigjeoierjgoeigjeogjegekfdmgoiejgeroigejgeodmoirevbedrgoierjerdiogjergedrojgroejggojieirjgeogedrgmgpedogkeg1", "output2.json");
        await testParse("aa", "output3.json");
        await testParse("aaa012opqrst", "output4.json");
        await testParse("a_012opqrst", "output5.json");

        console.timeEnd("Estimated: ");
    }
    catch(e){ console.log(e); }
})()
//, 1000);

async function testParse(matchString : string, out: string){
    const res = await test.match(matchString);
    if(res.success)
    {
        console.log(matchString.slice(res.match.start, res.match.end));
    }
    console.log(res.match);
}*/