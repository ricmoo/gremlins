export type Literal = number | string;
export type Op = {
    op: string;
    operands: Array<Op | Literal>;
    depth?: number;
    name?: string;
};
export type Label = {
    label: string;
};
export type Comment = {
    comment: string;
};
export declare function op(mnemonic: string, args: Array<Op | Literal>): Op;
export declare class AsmBuilder {
    #private;
    constructor();
    get bytecode(): string;
    get code(): string;
    ops(op: Op): null | string;
    block(prefix: string, builder: (asm: AsmBuilder) => void): void;
    label(label: string): void;
    comment(comment: string): void;
    goto(label: string): void;
    dump(): void;
}
//# sourceMappingURL=asm.d.ts.map