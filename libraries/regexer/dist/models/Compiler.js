import { Stack } from "@regexer/structures/Stack";
export class Compiler {
    static compile(regexString) {
        let states = new Stack;
        const stringReader = new StringReader(regexString);
        let character;
        while ((character = stringReader.next()) != null) {
        }
    }
}
