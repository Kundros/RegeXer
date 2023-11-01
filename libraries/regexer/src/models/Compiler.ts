import { Stack } from "@regexer/structures/Stack"

export class Compiler
{
    public static compile(regexString: string)
    {
        let states = new Stack<string>;
        const stringReader = new StringReader(regexString);
        
        let character: string | null;
        while((character = stringReader.next()) != null)
        {
            
        }
    }
}