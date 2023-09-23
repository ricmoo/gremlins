Application Binary Interface
============================

The ABI for *Gremlins* is quite different from the standard ABI
encoding.

Key Differences:

- Inline types; no external ABI required, as the values themselves encode their type
- JavaScript focused; includes values for things like `null` and `Array<any>`
- Non-canonical output; **do not** rely on hashing results to test equality


Each value is a 4-byte word which includes 1 type byte and 3 offset bytes,
indicating an offset into the data where the remaining data (if any) is
located.

It is quite likely that there is non-relevant data interspersed with
the data. This is intentional to reduce the overhead of creating a
copy of possible fragmented data, but has the consequence of providing
a canonical value.


Types
-----

- `0b0000` - null
- `0b0001` - reserved
- `0b0010` - false
- `0b0011` - true
- `0b0100` - uint (links to 32 byte)
- `0b0101` - int (links to 32 bytes)
- `0b0110` - address (links to 20 bytes)
- `0b0111` - hash (links to 32 bytes)
- `0b1000` - bytes (links to 4 byte length + length bytes)
- `0b1001` - string (links to 4 byte length + length bytes)
- `0b1010` - array (see Arrays)
- `0b1011` - keyed object *(future)*


Arrays
------

Arrays are implemented as a vector with an 8-byte header indicating
current length (4-bytes) and current capacity (4-bytes).


Keyed Object
------------

Future... This will behave like a JavaScript object with key-value
pairs.
