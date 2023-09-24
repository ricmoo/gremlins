
// [ OPCODE, inputs = 0, outputs = 0, effectDepth = inputs ];
const ops: Record<string, Array<number>> = {
    // STOP and Arithmentic Operations
    stop: [ 0x00, 0, 0 ],
    add: [ 0x01, 2 ],
    mul: [ 0x02, 2 ],
    sub: [ 0x03, 2 ],
    div: [ 0x04, 2 ],
    sdiv: [ 0x05, 2 ],
    mod: [ 0x06, 2 ],
    smod: [ 0x07, 2 ],
    addmod: [ 0x08, 3 ],
    mulmod: [ 0x09, 3 ],
    exp: [ 0x0a, 2 ],
    signextend: [ 0x0b, 2 ],

    // Comparison and Bitwise Logic Operations
    lt: [ 0x10, 2 ],
    gt: [ 0x11, 2 ],
    slt: [ 0x12, 2 ],
    sgt: [ 0x13, 2 ],
    eq: [ 0x14, 2 ],
    iszero: [ 0x15, 1 ],
    and: [ 0x16, 2 ],
    or: [ 0x17, 2 ],
    xor: [ 0x18, 2 ],
    not: [ 0x19, 1 ],
    byte: [ 0x1a, 2 ],
    shl: [ 0x1b, 2 ],
    shr: [ 0x1c, 2 ],
    sar: [ 0x1d, 2 ],

    // Keccak256
    keccak256: [ 0x20, 2 ],

    // Environmental Information
    address: [ 0x30 ],
    balance: [ 0x31, 1 ],
    origin: [ 0x32 ],
    caller: [ 0x33 ],
    callvalue: [ 0x34 ],
    calldataload: [ 0x35, 1 ],
    calldatasize: [ 0x36 ],
    calldatacopy: [ 0x37, 3, 0 ],
    codesize: [ 0x38 ],
    codecopy: [ 0x39, 3, 0 ],
    gasprice: [ 0x3a ],
    extcodesize: [ 0x3b, 1 ],
    extcodecopy: [ 0x3c, 4, 0 ],
    returndatasize: [ 0x3d ],
    returndatacopy: [ 0x3e, 3, 0 ],
    extcodehash: [ 0x3f, 1 ],

    // Block Information
    blockhash: [ 0x40, 1 ],
    coinbase: [ 0x41 ],
    timestamp: [ 0x42 ],
    number: [ 0x43 ],
    difficulty: [ 0x44 ],
    gaslimit: [ 0x45 ],
    chainid: [ 0x46 ],
    selfbalance: [ 0x47 ],

    // Stack, Memory, Storage and Fow Operations
    pop: [ 0x50, 1 ],
    mload: [ 0x51, 1 ],
    mstore: [ 0x52, 2, 0 ],
    mstore8: [ 0x53, 2, 0 ],
    sload: [ 0x54, 1 ],
    sstore: [ 0x55, 2, 0 ],
    jump: [ 0x56, 1, 0 ],
    jumpi: [ 0x57, 2, 0 ],
    pc: [ 0x58 ],
    msize: [ 0x59 ],
    gas: [ 0x5a ],
    jumpdest: [ 0x5b, 0, 0 ],

    // System Operations
    create: [ 0xf0, 3 ],
    call: [ 0xf1, 7 ],
    callcode: [ 0xf2, 7 ],
    "return": [ 0xf3, 2, 0 ],
    delegatecall: [ 0xf4, 6 ],
    create2: [ 0xf5, 4 ],
    staticcall: [ 0xfa, 6 ],
    revert: [ 0xfd, 2, 0 ],
    invalid: [ 0xfe, 0, 0 ],
    selfdestruct: [ 0xff, 1, 0 ],
};

for (let i = 0; i < 32; i++) {
    ops[`push${ i + 1 }`] = [ 0x60 + i ];
}

for (let i = 0; i < 16; i++) {
    ops[`dup${ i + 1 }`] = [ 0x80 + i, 1, 2, i + 2 ];
    ops[`swap${ i + 1 }`] = [ 0x90 + i, 0, 0, i + 2 ];
}

for (let i = 0; i < 5; i++) {
    ops[`log${ i + 1 }`] = [ 0xa0 + i, 2 + i, 0 ];
}

export interface OpInfo {
    mnemonic: string;
    opcode: number;
    inputs: number;
    outputs: number;
    effectDepth: number;
}

export function getOp(mnemonic: string): OpInfo {
    const info = ops[mnemonic.toLowerCase()];
    if (info == null) { throw new Error(`unknown OPCODE mnemonic: ${ mnemonic }`); }

    return {
        mnemonic,
        opcode: info[0],
        inputs: info[1] || 0,
        outputs: info[2] || 1,
        effectDepth: (info[3] != null) ? info[3]: (info[1] || 0)
    };
}

function checkLabel(label: string): string {
    if (!label.match(/^[a-z][a-z0-9]*$/)) {
        throw new Error(`invalid label: ${ JSON.stringify(label) }`);
    }
    return label;
}
console.log(getOp, checkLabel);

export type Literal = number | string;
export type Op = { op: string, operands: Array<Op | Literal>, depth?: number, name?: string };
export type Label = { label: string };
export type Comment = { comment: string };

function isLiteral(value: any): value is Literal {
    return (typeof(value) === "number" || typeof(value) === "string");
}

function isOp(value: any): value is Op {
    return (typeof(value) === "object" && "op" in value);
}

function isLabel(value: any): value is Label {
    return (typeof(value) === "object" && "label" in value);
}

function isComment(value: any): value is Comment {
    return (typeof(value) === "object" && "comment" in value);
}

/*
function countDelta(op: Op | Literal | Label | Comment): number {
    if (isOp(op)) {
        const info = getOp(op.op);
        let depth = info.outputs - info.inputs;
        for (const o of op.operands) {
            depth += countDelta(o);
        }
        return depth;
    } else if (typeof(op) === "number" || typeof(op) === "string") {
        return 1;
    }

    return 0;
}
*/

export function op(mnemonic: string, args: Array<Op | Literal>): Op {
    const op = getOp(mnemonic);
    if (op.inputs != args.length) {
        throw new Error(`${ mnemonic } expects ${ op.inputs }; got ${ args } (${ args.length })`);
    }
    return { op: mnemonic, operands: args };
}

export function getByteCode(): void {
}

export function getAsm(ops: Array<Op | Label | Comment>): string {
    let output: Array<string> = [ ];
    const descend = (op: Op | Label | Comment) => {
        if (isLabel(op)) {
            output.push(op.label);
        } else if (isComment(op)) {
            output.push(`; ${ op.comment}`);
        } else if (isOp(op)) {
            const expand = (op: Op | Literal): string => {
                if (isLiteral(op)) { return String(op); }
                return `${ op.op }(${ op.operands.map(o => expand(o)).join(",") })`;
            };
            output.push(expand(op));
        } else {
            throw new Error(`invalid thing: ${ op }`);
        }
    };
    for (const op of ops) { descend(op); }
    return output.join("\n");
}

/*
export class AsmBuilder {
    #tree: Array<Op | Label | Comment>;

    #prefix: Array<string>;

    #nid: number;

    constructor() {
        this.#tree = [ ];
        this.#prefix = [ ];
        this.#nid = 1;
    }

    #nextId(): string {
        return `${ this.#nid++ }`;
    }

    get bytecode(): string {
        return "0x";
    }

    get code(): string {
        let output: Array<string> = [ ];
        const descend = (op: Op | Label | Comment) => {
            if (isLabel(op)) {
                output.push(op.label);
            } else if (isComment(op)) {
                output.push(`; ${ op.comment}`);
            } else {
                const expand = (op: Op | Literal): string => {
                    if (isLiteral(op)) { return String(op); }
                    return `${ op.op }(${ op.operands.map(o => expand(o)).join(",") })`;
                };
                output.push(expand(op));
            }
        };
        for (const op of this.#tree) { descend(op); }
        return output.join("\n");
    }

    ops(op: Op): null | string {
        const depth =  countDelta(op);
        if (depth === 0) {
            this.#tree.push(op);
            return null
        }

        const name = this.#label(this.#nextId());
        this.#tree.push(Object.assign({ depth, name }, op));
        return name;
    }

    block(prefix: string, builder: (asm: AsmBuilder) => void): void {
        this.#prefix.push(prefix);
        const asm = new AsmBuilder();
        asm.#prefix = this.#prefix;
        builder(asm);
        asm.#tree.forEach((op) => this.#tree.push(op));
        this.#prefix.pop();
    }

    #label(label: string): string {
        return "$" + this.#prefix.join("_") + "_" + label;
    }

    label(label: string): void {
        this.#tree.push({ label: this.#label(label) });
    }

    comment(comment: string): void {
        this.#tree.push({ comment });
    }

    goto(label: string): void {
        this.ops(op("JUMP", [ this.#label(label) ]));
    }

    dump() {
        console.dir(this.#tree, { depth: null });
    }
}
*/
