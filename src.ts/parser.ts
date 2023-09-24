
import { parse as _parse, parser as _parser } from "./_parser.js";;

export interface Location {
    readonly offset: number;
    readonly line: number;
    readonly length: number;
    readonly source: string;
    readonly statement: boolean;
}

export interface Node {
    loc: Location;
}

export interface InterfaceNode extends Node {
}

export interface ExpressionNode extends Node {
}

export interface IdExpressionNode extends ExpressionNode {
    type: "id";
    value: string;
}

export interface LiteralExpressionNode extends ExpressionNode {
    type: "literal";
    value: string | number | boolean;
}

export interface UnaryExpressionNode extends ExpressionNode {
    type: "unary";
    op: string;
    expr: ExpressionNode;
}

export interface CastExpressionNode extends ExpressionNode {
    type: "cast";
    cast: string;
    expr: ExpressionNode;
}

export interface BinaryExpressionNode extends ExpressionNode {
    type: "binary-expr";
    left: ExpressionNode;
    op: string;
    right: ExpressionNode;
}

export interface StatementNode extends Node {
}

export interface FunctionNode extends Node {
}

export interface ProgramNode {
    ifaces: Array<InterfaceNode>;
    stats: Array<StatementNode>;
    funcs: Array<FunctionNode>;
}

export function parse(code: string): ProgramNode {
    return _parse(code);
}
