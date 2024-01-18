import { MatchData } from "@regexer/coreTypes/MatchTypes";
import { parse, PeggySyntaxError, RegexTypes } from "@core/RegexParser"
import { RegParseException } from "@exceptions/RegParseException";
import { RegMatchException } from "@exceptions/RegMatchException";
import { RegexParserErrors } from "@regexer/coreTypes/parserTypes";
import { RegexMatch } from "@regexer/core/RegexMatch";

import * as path from "path";


type workerReturn = {type: string, pid: number, data: unknown};

export class Regexer{
    constructor(regexString : string = "")
    {
        try{
            const data = parse(regexString);
            this.AST_ = data?.AST;
            this.NFA_ = data?.NFA;
        }
        catch(e) {
            const exception = e as PeggySyntaxError;
            const errorCode = Number.parseInt(exception.message) as RegexParserErrors;

            throw new RegParseException(exception.location.start.offset, exception.location.end.offset, errorCode);
        }

        this.worker_ = new Worker(new URL("./MatchingWorker", "file:///" + path.resolve(__filename)));
        this.worker_.postMessage({
            type: "init",
            data: {
                AST: this.AST_,
                NFA: this.NFA_
            }
        });
    }

    public async match(matchString : string) : Promise<{success: boolean, match: RegexMatch}>
    {
        const pid = this.nextPid++;

        const result = await new Promise((resolve, reject) => {
            this.worker_.postMessage({ type: "match", pid, data: matchString });

            this.worker_.onmessage = (data : unknown) => { 
                const returned = data as workerReturn;

                if(returned.pid != pid)
                    return;

                if(returned.type === "error")
                    reject(data);
                else
                    resolve(data);
            };
        });

        const returned = result as workerReturn;

        if(returned.type === 'error')
            throw new RegMatchException(returned.data as string);

        return {success: returned.type === 'succeded', match: new RegexMatch(returned.data as MatchData)};
    }

    private nextPid : number = 0;
    private worker_ : Worker;
    private AST_: RegexTypes.ASTRoot;
    private NFA_: RegexTypes.NFAtype[];
}