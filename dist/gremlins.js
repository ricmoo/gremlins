// [ OPCODE, inputs = 0, outputs = 0, effectDepth = inputs ];
const ops = {
    // STOP and Arithmentic Operations
    stop: [0],
    add: [1, 2, 1],
    mul: [2, 2, 1],
    sub: [3, 2, 1],
    div: [4, 2, 1],
    sdiv: [5, 2, 1],
    mod: [6, 2, 1],
    smod: [7, 2, 1],
    addmod: [8, 3, 1],
    mulmod: [9, 3, 1],
    exp: [10, 2, 1],
    signextend: [11, 2, 1],
    // Comparison and Bitwise Logic Operations
    lt: [0x10, 2, 1],
    gt: [0x11, 2, 1],
    slt: [0x12, 2, 1],
    sgt: [0x13, 2, 1],
    eq: [0x14, 2, 1],
    iszero: [0x15, 1, 1],
    and: [0x16, 2, 1],
    or: [0x17, 2, 1],
    xor: [0x18, 2, 1],
    not: [0x19, 1, 1],
    byte: [0x1a, 2, 1],
    shl: [0x1b, 2, 1],
    shr: [0x1c, 2, 1],
    sar: [0x1d, 2, 1],
    // Keccak256
    keccak256: [0x20, 2, 1],
    // Environmental Information
    address: [0x30, 0, 1],
    balance: [0x31, 1, 1],
    origin: [0x32, 0, 1],
    caller: [0x33, 0, 1],
    callvalue: [0x34, 0, 1],
    calldataload: [0x35, 1, 1],
    calldatasize: [0x36, 0, 1],
    calldatacopy: [0x37, 3],
    codesize: [0x38, 0, 1],
    codecopy: [0x39, 3],
    gasprice: [0x3a, 0, 1],
    extcodesize: [0x3b, 1, 1],
    extcodecopy: [0x3c, 4, 0],
    returndatasize: [0x3d, 0, 1],
    returndatacopy: [0x3e, 3],
    extcodehash: [0x3f, 1, 1],
    // Block Information
    blockhash: [0x40, 1, 1],
    coinbase: [0x41, 0, 1],
    timestamp: [0x42, 0, 1],
    number: [0x43, 0, 1],
    difficulty: [0x44, 0, 1],
    gaslimit: [0x45, 0, 1],
    chainid: [0x46, 0, 1],
    selfbalance: [0x47, 0, 1],
    // Stack, Memory, Storage and Fow Operations
    pop: [0x50, 1, 0],
    mload: [0x51, 1, 1],
    mstore: [0x52, 2, 0],
    mstore8: [0x53, 2, 0],
    sload: [0x54, 1, 1],
    sstore: [0x55, 2, 0],
    jump: [0x56, 1, 0],
    jumpi: [0x57, 2, 0],
    pc: [0x58, 0, 1],
    msize: [0x59, 0, 1],
    gas: [0x5a, 0, 1],
    jumpdest: [0x5b, 0, 0],
    // System Operations
    create: [0xf0, 3, 1],
    call: [0xf1, 7, 1],
    callcode: [0xf2, 7, 1],
    "return": [0xf3, 2, 0],
    delegatecall: [0xf4, 6, 1],
    create2: [0xf5, 4, 1],
    staticcall: [0xfa, 6, 1],
    revert: [0xfd, 2, 0],
    invalid: [0xfe, 0, 0],
    selfdestruct: [0xff, 1, 0],
};
for (let i = 0; i < 32; i++) {
    ops[`push${i + 1}`] = [0x60 + i, 0, 1];
}
for (let i = 0; i < 16; i++) {
    ops[`dup${i + 1}`] = [0x80 + i, 1, 2, i + 2];
    ops[`swap${i + 1}`] = [0x90 + i, 0, 0, i + 2];
}
for (let i = 0; i < 5; i++) {
    ops[`log${i + 1}`] = [0xa0 + i, 2 + i, 0];
}
function getOp(mnemonic) {
    const info = ops[mnemonic.toLowerCase()];
    if (info == null) {
        throw new Error(`unknown OPCODE mnemonic: ${mnemonic}`);
    }
    return {
        mnemonic,
        opcode: info[0],
        inputs: info[1] || 0,
        outputs: info[2] || 0,
        effectDepth: (info[3] != null) ? info[3] : (info[1] || 0)
    };
}
function checkLabel(label) {
    if (!label.match(/^[a-z][a-z0-9]*$/)) {
        throw new Error(`invalid label: ${JSON.stringify(label)}`);
    }
    return label;
}
console.log(getOp, checkLabel);
function isLiteral(value) {
    return (typeof (value) === "number" || typeof (value) === "string");
}
function isOp(value) {
    return (typeof (value) === "object" && "op" in value);
}
function isLabel(value) {
    return (typeof (value) === "object" && "label" in value);
}
function isComment(value) {
    return (typeof (value) === "object" && "comment" in value);
}
function countDelta(op) {
    if (isOp(op)) {
        const info = getOp(op.op);
        let depth = info.outputs - info.inputs;
        for (const o of op.operands) {
            depth += countDelta(o);
        }
        return depth;
    }
    else if (typeof (op) === "number" || typeof (op) === "string") {
        return 1;
    }
    return 0;
}
function op(mnemonic, args) {
    const op = getOp(mnemonic);
    if (op.inputs != args.length) {
        throw new Error(`${mnemonic} expects ${op.inputs}; got ${args} (${args.length})`);
    }
    return { op: mnemonic, operands: args };
}
class AsmBuilder {
    #tree;
    #prefix;
    #nid;
    constructor() {
        this.#tree = [];
        this.#prefix = [];
        this.#nid = 1;
    }
    #nextId() {
        return `${this.#nid++}`;
    }
    get bytecode() {
        return "0x";
    }
    get code() {
        let output = [];
        const descend = (op) => {
            if (isLabel(op)) {
                output.push(op.label);
            }
            else if (isComment(op)) {
                output.push(`; ${op.comment}`);
            }
            else {
                const expand = (op) => {
                    if (isLiteral(op)) {
                        return String(op);
                    }
                    return `${op.op}(${op.operands.map(o => expand(o)).join(",")})`;
                };
                output.push(expand(op));
            }
        };
        for (const op of this.#tree) {
            descend(op);
        }
        return output.join("\n");
    }
    ops(op) {
        const depth = countDelta(op);
        if (depth === 0) {
            this.#tree.push(op);
            return null;
        }
        const name = this.#label(this.#nextId());
        this.#tree.push(Object.assign({ depth, name }, op));
        return name;
    }
    block(prefix, builder) {
        this.#prefix.push(prefix);
        const asm = new AsmBuilder();
        asm.#prefix = this.#prefix;
        builder(asm);
        asm.#tree.forEach((op) => this.#tree.push(op));
        this.#prefix.pop();
    }
    #label(label) {
        return "$" + this.#prefix.join("_") + "_" + label;
    }
    label(label) {
        this.#tree.push({ label: this.#label(label) });
    }
    comment(comment) {
        this.#tree.push({ comment });
    }
    goto(label) {
        this.ops(op("JUMP", [this.#label(label)]));
    }
    dump() {
        console.dir(this.#tree, { depth: null });
    }
}

/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var _parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[2,2],$V1=[1,4],$V2=[1,5],$V3=[1,12],$V4=[1,13],$V5=[1,14],$V6=[5,7,12];
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"program":3,"statements":4,"EOF":5,"statement":6,"ID":7,"ASSIGN":8,"expr":9,"SEMI":10,"EQUALS":11,"DECLARE":12,"NUMBER":13,"STRING":14,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",7:"ID",8:"ASSIGN",10:"SEMI",11:"EQUALS",12:"DECLARE",13:"NUMBER",14:"STRING"},
productions_: [0,[3,2],[4,0],[4,2],[6,4],[6,4],[6,5],[9,1],[9,1],[9,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
 return { type: "program", statements: $$[$0-1] }; 
case 2:
 this.$ = [ ]; 
break;
case 3:
 this.$ = [ $$[$0-1], ...$$[$0] ]; 
break;
case 4:
 this.$ = { type: "assign", target: $$[$0-3], op: $$[$0-2], expr: $$[$0-1] }; 
break;
case 5:
 this.$ = { type: "assign", target: $$[$0-3], op: "=", expr: $$[$0-1] }; 
break;
case 6:
 this.$ = { type: "assign", declare: $$[$0-4], target: $$[$0-4], op: $$[$0-3], expr: $$[$0-2] }; 
break;
case 7:
 this.$ = { type: "id", value: yytext }; 
break;
case 8:
 {
      let v = yytext;
      if (v.substring(0, 2) === "0b") {
        v = parseInt(v.substring(2), 2);
      }
      this.$ = { type: "literal", value: parseInt(v) };
    } 
break;
case 9:
 this.$ = { type: "literal", value: yytext }; 
break;
}
},
table: [{3:1,4:2,5:$V0,6:3,7:$V1,12:$V2},{1:[3]},{5:[1,6]},{4:7,5:$V0,6:3,7:$V1,12:$V2},{8:[1,8],11:[1,9]},{7:[1,10]},{1:[2,1]},{5:[2,3]},{7:$V3,9:11,13:$V4,14:$V5},{7:$V3,9:15,13:$V4,14:$V5},{11:[1,16]},{10:[1,17]},{10:[2,7]},{10:[2,8]},{10:[2,9]},{10:[1,18]},{7:$V3,9:19,13:$V4,14:$V5},o($V6,[2,4]),o($V6,[2,5]),{10:[1,20]},o($V6,[2,6])],
defaultActions: {6:[2,1],7:[2,3],12:[2,7],13:[2,8],14:[2,9]},
parseError: function parseError (str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    var lex = function () {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        };
    var symbol, state, action, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function(match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex () {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin (condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState () {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules () {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState (n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState (condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
switch($avoiding_name_collisions) {
case 0:// Ignore comments
break;
case 1:// Ignore comments
break;
case 2:// Ignore Whitespace
break;
case 3:return "SEMI"
case 4:return "NUMBER"
case 5:return "NUMBER"
case 6:return "NUMBER"
case 7:return "STRING"
case 8:return "EQUALS"
case 9:return "ASSIGN"
case 10:return "LET"
case 11:return "LET"
case 12:return "IF"
case 13:return "ELSE"
case 14:return "WHILE"
case 15:return "TRY"
case 16:return "CATCH"
case 17:return "ID"
case 18:return "EOF"
case 19:return "INVALID"
}
},
rules: [/^(?:([/][/][^\n]*\n))/,/^(?:([/][*].*[*][/]))/,/^(?:(\s+))/,/^(?:;)/,/^(?:([0][x][0-9a-fA-F]+))/,/^(?:([0][b][01]+))/,/^(?:([0-9]+))/,/^(?:(["]([^\\]|\\.)*["]))/,/^(?:=)/,/^(?:([+-\\*/&\\|^][=]))/,/^(?:const\b)/,/^(?:let\b)/,/^(?:if\b)/,/^(?:else\b)/,/^(?:while\b)/,/^(?:try\b)/,/^(?:catch\b)/,/^(?:([A-Za-z_][A-Za-z0-9_]*))/,/^(?:$)/,/^(?:)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();const parser = _parser; const parse$1 = parser.parse.bind(parser);

function parse(code) {
    return parse$1(code);
}

export { AsmBuilder, parse };
//# sourceMappingURL=gremlins.js.map
