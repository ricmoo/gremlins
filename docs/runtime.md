Runtime
=======

The EVM uses 32-byte words (e-words) while the Gremlin runtime
uses mostly 4-byte words (g-words).

The one exception is the Stack Pointer, which is stored as a 32-byte
value, because it is accessed often and because it allows `mload`
to access the values after it without having conditional shifts.

Value Format
------------

All values are stored as 4-bytes, with the first byte indicating the
type. The last 3 bytes provide a pointer within the heap to additional
space used for the value.

Memory Layout
-------------

0      Stack Pointer (`SP`)
32     Return pointer (`RP`)
36     Log Pointer (`LP`)
...    reserved
64     Heap start (initially 32 e-words or 256 g-words)
1088   Heap Free Map (1 e-word; each bit indcates a free g-word in the heap)
1120   Initial Stack

Memory Allocation
-----------------

All stack values are stored relative to the `SP` and all va. This is
because the Heap can be resized.

To resize the heap, we move (using the Identity function) the stack
and heap map 33 e-words to the right, allocating an additional 1024
bytes of data (256 g-words) as well as an additional word for the
Heap Free Map, which should be initialized to 0.
