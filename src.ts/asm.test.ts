import { AsmBuilder, op } from "./asm.js";

const asm = new AsmBuilder();

asm.label("test");

asm.block("malloc", (asm) => {
    asm.comment("do stuff here");
    asm.ops(op("add", [ 4, op("mul", [ 2, 3 ]) ]));
    asm.label("insideMalloc");
});

asm.goto("test");

asm.dump();

console.log("CODE\n", asm.code);
