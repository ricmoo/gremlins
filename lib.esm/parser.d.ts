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
}
export interface UnaryExpressionNode extends ExpressionNode {
    op: string;
    expr: ExpressionNode;
}
export interface BinaryExpressionNode extends ExpressionNode {
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
export declare function parse(code: string): ProgramNode;
//# sourceMappingURL=parser.d.ts.map