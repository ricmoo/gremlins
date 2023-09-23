"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parser_js_1 = require("./parser.js");
console.dir((0, parser_js_1.parse)(`
a = "456";
b *= 456;
c = 0x456;
d |= c;
`), { depth: null });
//# sourceMappingURL=test.js.map