/* AST types */

export type ASTtype 
    = 
    AST | 
    ASTPrimitive | 
    ASTRoot |
    ASTGroup |
    ASTOption |
    ASTOptional |
    ASTIteration |
    ASTList;

export type AST = 
{
    type: RegexStates,
    start: number,
    end: number,
    children: ASTtype[]
}

export type ASTNoChildren = 
{
    type: RegexStates,
    start: number,
    end: number
}

export type ASTPrimitive = ASTNoChildren &
{
    chr: string
}

export type ASTRoot = AST &
{
    modifiers: number
}

export type ASTGroup = AST & 
{
    detailedType: GroupTypes,
    name: string | undefined,
    end: number
}

export type ASTOption = ASTNoChildren & 
{
    children: ASTtype[][]
}

export type ASTOptional = AST;

export type ASTIteration = AST & 
{
    lazy: boolean,
    start: number,
    end: number | undefined
}

export type ASTList = ASTNoChildren & 
{
    neg: boolean
}

/* NFA type */

export type NFAState = 
{
    ASTelement: ASTtype | undefined,
    transitions: NFATransition[]
}

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

export type GroupState = 
{
    AST: ASTGroup,
    NFA: NFAState[]
}

export type OptionState = 
{
    AST: ASTOption,
    NFA: NFAState[]
}

export type OptionalState = 
{
    AST: ASTOptional,
    NFA: NFAState[]
}

export type IterationState = 
{
    AST: ASTIteration,
    NFA: NFAState[]
}

export type ListState =
{
    AST: ASTList,
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
    ITERATION_RANGE: 0x40,
    ITERATION_END: 0x80,
    GROUP: 0x100,
    OPTIONAL: 0x200,
    P_LIST: 0x400,
    N_LIST: 0x800
} as const;

export type RegexStates = typeof RegexStates[keyof typeof RegexStates];

export const Modifiers = {
    NONE: 0x0,
    g: 0x1,
    m: 0x2,
    i: 0x4,
    y: 0x8,
    u: 0x10,
    v: 0x20,
    s: 0x40,
    d: 0x80
} as const;

export type Modifiers = typeof Modifiers[keyof typeof Modifiers];

export const GroupTypes = {
    CAPTURING: 'C',
    NON_CAPTURING: 'NC',
    NAMED: 'N'
} as const;

export type GroupTypes = typeof GroupTypes[keyof typeof GroupTypes];