/*--
 Type 'ExtendedBindedFunction' with its helper types:
    - removes all arguments that were already binded:
        // -- if --
        func (arg1, arg2)
        const newFunc = func.bind(undefined, arg1)
        // -- then --
        newFunc(arg2)
    - adds to prototype of that function 2 properties:
        __boundThis__ : this argument (1st)
        __boundArguments__ : array of arguments (2nd..n)

 --*/

 export type ExtendedBindedFunction
    <
        Func extends (...args: unknown[]) => unknown, 
        This
    > = 
    (
        Func extends (...args : infer A) => infer B
        ? (...args : ArrayDropN<A, GetArgsType<Func>['length']>) => B 
        : never
    )
    &
    {
        __boundThis__ : This,
        __boundArguments__ : GetArgsType<Func>
    };

type ArrayDropN
    <
        Func extends unknown[], 
        N extends number
    > = 
    Func extends [...RepeatEmptyN<[], N>, ...infer Rest] ? Rest : [];

type RepeatEmptyN
    <
        AnyArr extends unknown[], 
        N extends number
    > = 
    AnyArr['length'] extends N ? AnyArr : RepeatEmptyN<[...AnyArr, unknown], N>;

export type GetArgsType<Func extends (...args: unknown[]) => unknown> = 
    Func extends (...args: infer A) => unknown 
    ? A 
    : never;