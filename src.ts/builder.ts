import { getOp } from "./opcodes.js";

export function getPush(_value: number | bigint, length?: number): Array<number> {
    let value = BigInt(_value);
    const push = [ ];
    while (true) {
        push.unshift(Number(value & 0xffn));
        value >>= 8n;
        if (value === 0n) { break; }
    }
    if (length) {
        while (push.length < length) { push.unshift(0); }
    }
    push.unshift(0x60 + push.length - 1);
    return push;
}

type Literal = number | bigint;

type PushOp = { tag: string, value: Literal };
type MnemonicOp = { mnemonic: string, operands: Array<Op>, tag: string };
type TargetOp = { target: string };
type Op = MnemonicOp | PushOp | TargetOp;

type Label = { label: string };


class AsmBuilder {
    readonly clumps: Array<Op | Label>;
    readonly free: Set<string>;

    #nid: number;

    constructor() {
        this.clumps = [ ];
        this.free = new Set();
        this.#nid = 1;
    }

    #nextTag(prefix: string): string {
        return `$${ prefix }_${ this.#nid++ }`
    }

    label(label: string): void {
        this.clumps.push({ label });
    }

    jump(target: string, condition?: Literal | Op): void {
        if (condition == null) {
            this.#op("jump", [ { target } ]);
        } else {
            this.#op("jump", [ { target }, condition ]);
        }
    }

    op(mnemonic: string, args?: Array<Literal | Op>): MnemonicOp {
        mnemonic = mnemonic.toLowerCase();

        if (mnemonic.startsWith("jump")) {
            throw new Error(`invalid mnemonic for .op; use .jump instead`);
        }

        if (mnemonic.startsWith("push")) {
            throw new Error(`invalid mnemonic for .op; use .push instead`);
        }

        return this.#op(mnemonic, args);
    }

    #op(mnemonic: string, args?: Array<Literal | Op>): MnemonicOp {
        const operands = (args || []).map((a) => {
            if (typeof(a) === "number" || typeof(a) === "bigint") {
                return { tag: this.#nextTag("literal"), value: a };
            }

            if ("tag" in a) {
                if (this.free.has(a.tag)) {
                    let i = -1;
                    for (i = 0; i < this.clumps.length; i++) {
                        const clump = this.clumps[i];
                        if ("tag" in clump && clump.tag === a.tag) {
                            for (const clump of this.clumps.slice(i)) {
                                if ("label" in clump || ("mnemonic" in clump && (clump.mnemonic === "jump" || clump.mnemonic === "jumpi"))) {
                                    throw new Error(`operand will alter label structure`);
                                }
                            }
                            break;
                        }
                    }
                    this.clumps.splice(i, 1);
                    this.free.delete(a.tag);
                } else {
                    throw new Error(`operation is already captured: ${ a }`);
                }
            }

            if ("mnemonic" in a) {
                const info = getOp(a.mnemonic);
                if (info.outputs === 0) {
                    throw new Error(`negative stack delta: ${ a }`);
                }
            }

            return a;
        });

        const tag = this.#nextTag(mnemonic);
        this.free.add(tag);

        const op = { mnemonic, operands, tag };
        this.clumps.push(op);

        return op;
    }

    push(value: number): PushOp {
        const tag = this.#nextTag("push");
        this.free.add(tag);
        const op = { tag, value };
        this.clumps.push(op);
        return op;
    }

    // High-level interfaces
    block(body: (asm: AsmBuilder) => void): void {
    }

    addFunction(name: string, argCount: number, body: (asm: FunctionAsmBuilder) => void): void {
    }

    doCall(name: string, args: Array<Op>): void {
    }

    doIf(cond: Op, body: (asm: AsmBuilder) => void, elseBody?: (asm: AsmBuilder) => void) {
    }

    doFor(setup: Op, check: Op, action: Op, body: (asm: LoopAsmBuilder, index: string) => void): void {
    }

    doWhile(cond: Op, body: (asm: LoopAsmBuilder) => void): void {
    }

    doReturn(result: Op): void {
    }

    doJumptable(cond: Op, table: Array<string>): void {
    }

    get bytecode(): string {
        const widths: Map<string, number> = new Map();

        while (true) {
            const output: Array<string | number> = [ ];
            const targets: Map<string, number> = new Map();
            for (const clump of this.clumps) {
                if ("label" in clump) {
                    targets.set(clump.label, output.length);
                    output.push(getOp("jumpdest").opcode);

                } else {
                    const render = (op: Op) => {
                        if ("value" in op) {
                            getPush(op.value).forEach(b => { output.push(b); });

                        } else if ("target" in op) {
                            output.push(op.target);

                            let width = widths.get(op.target) || 1;
                            widths.set(op.target, width);

                            for (let i = 0; i < width; i++) { output.push(0); }

                        } else if ("mnemonic" in op) {
                            for (let i = op.operands.length - 1; i >= 0; i--) {
                                render(op.operands[i]);
                            }

                            output.push(getOp(op.mnemonic).opcode);
                        }
                    };
                    render(clump);
                }
            }

            let adjusted = false;

            for (let i = 0; i < output.length; i++) {
                const target = output[i];
                if (typeof(target) === "string") {
                    const width = widths.get(target);
                    const offset = targets.get(target);
                    if (width == null || offset == null) { throw new Error("internal"); }
                    const push = getPush(offset);
                    if (push.length <= width + 1) {
                        for (let j = 0; j < push.length; j++) {
                            output[i + j] = push[j];
                        }
                    } else {
                        widths.set(target, width + 1);
                        adjusted = true;
                    }
                }
            }

            if (!adjusted) {
                return Buffer.from(<Array<number>>output).toString("hex");
            }
        }
    }

    get assembly(): string {
        const output: Array<string> = [ ];
        for (const clump of this.clumps) {
            if ("label" in clump) {
                output.push(`$${ clump.label }:`);
            } else {
                const render = (op: Op) => {
                    if ("value" in op) {
                        const push = getPush(op.value);
                        output.push(`  PUSH${ push.length - 1 } ${ op.value }`);
                    } else if ("target" in op) {
                        output.push(`  PUSH ${ op.target }`);
                    } else if ("mnemonic" in op) {
                        for (let i = op.operands.length - 1; i >= 0; i--) {
                            render(op.operands[i]);
                        }
                        output.push(`  ${ op.mnemonic}`);
                    }
                };
                render(clump);
            }
        }
        return output.join("\n");
    }
}

class LoopAsmBuilder extends AsmBuilder {
    doBreak(): void {
    }

    doContinue(): void {
    }
}

class FunctionAsmBuilder extends AsmBuilder {
    doReturn(result: Op): void {
    }
}

const asm = new AsmBuilder();
asm.label("top");
const a = asm.op("add", [ 32, asm.op("msize") ])
const b = asm.op("add", [ 5, asm.push(6) ])
asm.op("mul", [ a, b ]);
asm.label("bottom");
asm.jump("bottom", 45);
console.dir(asm, { depth: null });

console.log(asm.assembly);
console.log(asm.bytecode);
