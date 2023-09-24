
import { parse } from "./parser.js";

console.dir(parse(`
/*
a = 456 * (b << 3) > 45;
const b = !3 + 8 * 5 && true;
let c = 0;
while (c < 5) {
  c += 1;
  if (c == 1) {
    a += 1;
  } else { //if (c == 2) {
    a += 2;
  }
}
*/
interface Foo {
  bar(uint, bar: uint): uint256;
  baz(): uint;
}

function min(a: uint, b: uint): uint {
  if (a < b) { return a; }
  return b;
}


return 34 + 5;

interface Bar {
  bar(uint, bar: uint): uint256;
  baz(): uint;
}

`), { depth: null });
