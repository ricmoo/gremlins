"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asm_js_1 = require("./asm.js");
const asm = new asm_js_1.AsmBuilder();
asm.label("test");
asm.block("malloc", (asm) => {
    asm.comment("do stuff here");
    asm.ops((0, asm_js_1.op)("add", [4, (0, asm_js_1.op)("mul", [2, 3])]));
    asm.label("insideMalloc");
});
asm.goto("test");
asm.dump();
console.log("CODE\n", asm.code);
//# sourceMappingURL=asm.test.js.map