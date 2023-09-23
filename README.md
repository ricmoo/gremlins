Gremlins Language and Compiler
==============================

Gremlins in a high-level language for blockchain development.

**Like** Solidity: it compiles a high-level language to EVM bytecode.

**Unlike** Solidity: it is **not** for writing contracts, but instead for
querying on-chain data, synchronously with `eth_call`, with arbitrary logic
to return JavaScript-friendly results.

**TL;DR:** *Like a more nuanced multicall for read-only operations*


Features
--------

- **Tiny**; under 8kb for parser, compiler and code generator (16kb uncompessed)
- **Zero** dependencies
- **Easy** to use, with a TypeScript-inspired syntax
- **Aggregates** many operations together
- Providers **synchronous** access to blockchain data
- **Open Source**; 100% MIT licensed


Examples
--------

**MyAllowance.gizmo**

```typescript
/**
 *  Example: determine the current *actual* allowance of
 *  DAI for many addresses.
 *
 *  If a token has an infinite allowance, but the sender
 *  only has 4 DAI, the actual balance is 4 DAI, as that
 *  is all that would successfuly be transferable.
 */
interface Erc20 {
  balanceOf(address): uint;
  allowance(address): uint
}

function min(a: uint, b: uint): uint {
    if (a < b) { return a; }
    return b;
}

function main(sender: address, addresses: Array<address>) {
  const dai = <Erc20>0x6B175474E89094C44Da98b954EedeAC495271d0F;
  const result: Array<uint> = [ ];
  for (const address of addresses) {
    const balance = dai.balanceOf(address);
    const allowance = dai.allowance(addess, sender);
    result.push(min(balance, allowance));
  }
}
```

**Using:**

```javascript
const code = fs.readFileSync("MyAllowance.gizmo");

// Who the allowance permissions are being requested for
const sender = // who the allowances permit

// The addresses to query
const address = [
   // ...
];
const allowances: Array<bigint> = gremlins.eval(code, sender, addresses);
```

License
-------

MIT Licesnse.
