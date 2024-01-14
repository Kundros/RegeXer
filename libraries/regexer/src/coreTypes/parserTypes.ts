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
    ASTList |
    ASTEOS |
    ASTSOS |
    AstEscapedSpecial;

export type NFAtype
    =
    NFAState |
    NFAStateList

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

export type ASTEOS = ASTNoChildren;
export type ASTSOS = ASTNoChildren;

export type AstEscapedSpecial = ASTNoChildren & {
    special: 'w' | 'W' | 'd' | 'D' | 's' | 'S'
}

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

export type NFAStateList = 
{
    ASTelement: ASTtype | undefined,
    transitions: Set<string>
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
    NFA: NFAStateList[]
}

export type EOSState =
{
    AST: ASTEOS,
    NFA: NFAState[]
}

export type SOSState =
{
    AST: ASTSOS,
    NFA: NFAState[]
}

export type EscapedSpecialState = 
{
    AST: AstEscapedSpecial,
    NFA: NFAStateList[]
}

/* other */

export type NFATransition = [string | null, number];

export const RegexStates = {
    END: 0x0,
    NULL: 0x1,
    ROOT: 0x2,
    PRIMITIVE: 0x4,
    OPTION: 0x8,
    OPTION_END: 0x10,
    ITERATION_ZERO: 0x20,
    ITERATION_ONE: 0x40,
    ITERATION_RANGE: 0x80,
    ITERATION_END: 0x100,
    GROUP: 0x200,
    OPTIONAL: 0x400,
    P_LIST: 0x800,
    N_LIST: 0x1000,
    LIST_END: 0x2000,
    START_STRING: 0x4000,
    END_STRING: 0x8000,
    SPECIAL: 0x10000,
    GROUP_END: 0x20000
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

export const RegexParserErrors = {
    LIST_END: 0x1,
    LIST_IN: 0x2,
    GROUP_END: 0x4,
    ITERATION_OVER: 0x8,
    OPTIONAL_OVER: 0x10
} as const;

export type RegexParserErrors = typeof RegexParserErrors[keyof typeof RegexParserErrors];