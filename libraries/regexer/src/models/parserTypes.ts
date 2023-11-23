/* AST types */

export type ASTtype 
    = 
    AST | 
    ASTPrimitive | 
    ASTRoot;

export type AST = 
{
    type: number,
    children: ASTtype[]
}

export type ASTPrimitive = AST &
{
    chr: string
}

export type ASTRoot = AST &
{
    modifiers: number
}

export type ASTGroup = AST & 
{
    detailedType: string,
    name: string | undefined,
    end: number
}

/* NFA type */

export type NFAState = 
{
    ASTelement: ASTtype | undefined,
    transitions: NFATransition[]
}

export type ASTEnd = typeof RegexStates.END

/* StateTypes */

export type RootState = 
{
    AST: ASTRoot,
    NFA: NFAState[]
}

export type PrimitiveState = 
{
    AST: ASTPrimitive,
    NFA: NFAState[]
}

/* other */

export type NFATransition = [string | null, number];

export const RegexStates = {
    END: 0x0,
    NULL: 0x1,
    ROOT: 0x2,
    PRIMITIVE: 0x4,
    OPTION: 0x8,
    ITERATION_ZERO: 0x10,
    ITERATION_ONE: 0x20,
    ITERATION_END: 0x40,
    GROUP: 0x80,
    OPTIONAL: 0x100,
    P_LIST: 0x200,
    N_LIST: 0x400
} as const;

export type RegexStates = typeof RegexStates[keyof typeof RegexStates];

export const Modifiers = {
    NONE: undefined,
    g: 0x1,
    m: 0x2,
    i: 0x4,
    y: 0x8,
    u: 0x10,
    v: 0x20,
    s: 0x40,
    d: 0x80
}

export type Modifiers = typeof Modifiers[keyof typeof Modifiers];