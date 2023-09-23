import { parse } from "./parser.js";
console.dir(parse(`
a = "456";
b *= 456;
c = 0x456;
d |= c;
`), { depth: null });
//# sourceMappingURL=test.js.map