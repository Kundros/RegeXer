export { Regexer } from "@models/Regexer";
import { Regexer } from "@models/Regexer";

const test = new Regexer("(a|abc)");
test.match("c");