Gremlins Language and Compiler
==============================

Gremlins in a high-level language for blockchain development.

**Like** Solidity, it compiles to EVM bytecode.

**Unlike** Solidity, it is not designed to write contracts in,
but instead write arbitrary code which executes in an `eth_call`
to synchronously access blockchain state, perform compuation
and return JavaScript-friendly results.


Features
--------

- **Tiny**; under 25kb for parser, compiler and code generator
- **Easy** to use, with a TypeScript-inspired syntax
- **Aggregates** many operations together
- Providers effectively **synchronous** access to blockchain data
- **Open Source**; 100% MIT licensed


Examples
--------

**MyAllowance.gizmo**

```typescript
interface Erc20 {
  balanceOf(address): uint;
  allowance(address): uint
}

function min(a: uint, b: uint): uint {
    if (a < b) { return a; }
    return b;
}

function main(addresses: Array<address>) {
  const dai = <Erc20>0x1234;
  const result: Array<uint> = [ ];
  for (const address of addresses) {
    const balance = dai.balanceOf(address);
    const allowance = dat.allowance(addess, me);
    result.push(min(balance, allowance));
  }
}
```

**Using:**

```javascript
const code = fs.readFileSync("MyAllowance.gizmo");
const address = [
   // ...
];
const allowances: Array<bigint> = gremlins.eval(code, addresses);
```

License
-------

MIT Licesnse.
