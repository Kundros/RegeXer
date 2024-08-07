import { ExtendedBindedFunction, GetArgsType } from "src/types/bindTypes";

/** 
 * @description Adds arguments and 'this' to the prototype of the binded function 
 */
export function extendedBind
    <
        Func extends (...args: unknown[]) => unknown, 
        This
    >
    (callFunction : Func, bindThis: This, ...args : GetArgsType<Func>) : ExtendedBindedFunction<Func, This>
{
    const bound : ExtendedBindedFunction<Func, This> = callFunction.bind(bindThis, ...args);

    bound.__boundThis__ = bindThis;
    bound.__boundArguments__ = args;

    return bound;
}