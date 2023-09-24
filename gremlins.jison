%lex

%%

// Ignorables
([/][/][^\n]*\n)                               // Ignore comments
([/][*](.|\n)*[*][/])                         // Ignore comments
(\s+)                                          // Ignore Whitespace

","                                            return "COMMA"
":"                                            return "COLON"
";"                                            return "SEMI"

// Literals
([0][x][0-9a-fA-F]+)                           return "NUMBER"
([0][b][01]+)                                  return "NUMBER"
([0-9]+)                                       return "NUMBER"

"true"                                         return "BOOL"
"false"                                        return "BOOL"

"null"                                         return "NULL"

// ("0x"[0-9a-f]+)                                return "BYTES"
//(["]([^\]|[\].)+["])                           return "STRING"
(["]([^\\]|\\.)*["])                           return "STRING"

// Operators

// Maths
([*/%][=])                                       return "ASSIGN"
([*/%])                                          return "MULOP"
([+-][=])                                        return "ASSIGN"
"+"                                              return "PLUS"
"-"                                              return "MINUS"
("<<"|">>"|">>>")                                return "SHIFTOP"
("<"|">"|"<="|">=")                              return "RELOP"
("=="|"!=")                                      return "EQOP"
"&&"                                             return "LOGICAND"
"||"                                             return "LOGICOR"
"&"                                              return "AND"
"|"                                              return "OR"
"^"                                              return "XOR"
"!"                                              return "NOT"

// Assignment Ops
"="                                              return "EQUALS"
//([!][/][?]?[=])                                return "ASSIGN"
//((<<|>>|>>>)=)                                 return "ASSIGN"


// Brackets
"("                              return "OPEN_PAREN"
")"                              return "CLOSE_PAREN"
"<"                              return "OPEN_TRIANGLE"
"<"                              return "CLOSE_TRIANGLE"
"["                              return "OPEN_BRACKET"
"]"                              return "CLOSE_BRACKET"
"{"                              return "OPEN_BRACE"
"}"                              return "CLOSE_BRACE"

// Keywords
"const"             return "DECLARE"
"let"               return "DECLARE"

"function"          return "FUNCTION"
"interface"         return "INTERFACE"

"if"                return "IF"
"else"              return "ELSE"

"while"             return "WHILE"

"try"               return "TRY"
"catch"             return "CATCH"

"return"            return "RETURN"

// Solidity-specific Types
(("bytes"|"int"|"uint")[0-9]+)  return "TYPE_SOLC"

// Types
"address"          return "ADDRESS"
"boolean"          return "BOOLEAN"
"bytes"            return "BYTES"
"hash"             return "HASH"
"int"              return "INT"
"string"           return "STRING"
"uint"             return "UINT"


// ID; this should be parsed last
([A-Za-z_][A-Za-z0-9_]*)                       return "ID"


// Special
<<EOF>>                                        return "EOF"
                                               return "INVALID"
/lex

%start program

%%

program
  : top_statements EOF
    { {
      const result = { type: "program", interfaces: [ ], functions: [ ], statements: [ ] };
      const targets = { interface: result.interfaces, func: result.functions };
      for (const stmt of $1) {
        (targets[stmt.type] || result.statements).push(stmt);
      }
      return result;
    } }
  ;

top_statements
  : /* empty */
    { $$ = [ ]; }
  | top_statement top_statements
    { $$ = [ $1, ...$2 ]; }
  ;

top_statement
  : statement
    { $$ = $1; }
  | interface_solc
    { $$ = $1; }
  | func
    { $$ = $1; }
  ;

interface_solc
  : INTERFACE ID OPEN_BRACE methods_solc CLOSE_BRACE
    { $$ = { type: "interface", id: $2, methods: $4 }; }
  ;

methods_solc
  : /* empty */
    { $$ = [ ]; }
  | method_solc methods_solc 
    { $$ = [ $1, ...$2 ]; }
  ;

method_solc
  : ID OPEN_PAREN params_solc CLOSE_PAREN COLON type_solc SEMI
    { $$ = { type: "method", id: $1, params: $3, returns: $6 }; }
  | ID OPEN_PAREN CLOSE_PAREN COLON type_solc SEMI
    { $$ = { type: "method", id: $1, params: [ ], returns: $5 }; }
  ;

params_solc
  : param_solc
    { $$ = [ $1 ]; }
  | param_solc COMMA params_solc
    { $$ = [ $1, ...$3 ]; }
  ;

param_solc 
  : type_solc
    ${ $$ = { type: $1 }; }
  | ID COLON type_solc
    ${ $$ = { id: $1, type: $3 }; }
  ;

// Solidity types overlap with Gremlin types, so this includes
// the overlap and the Solidity-specific 
type_solc
  : ADDRESS
    ${ $$ = $1; }
  | BOOLEAN
    ${ $$ = $1; }
  | BYTES
    ${ $$ = $1; }
  | INT
    ${ $$ = $1; }
  | STRING
    ${ $$ = $1; }
  | UINT
    ${ $$ = $1; }
  | TYPE_SOLC
    ${ $$ = $1; }
  ;

func
  : FUNCTION ID OPEN_PAREN CLOSE_PAREN COLON type OPEN_BRACE statements CLOSE_BRACE
    { $$ = { type: "func", id: $2, body: $8, returns: $6 }; }
  | FUNCTION ID OPEN_PAREN params CLOSE_PAREN COLON type OPEN_BRACE statements CLOSE_BRACE
    { $$ = { type: "func", id: $2, params: $4, body: $9, returns: $7 }; }
  ;

params
  : param
    ${ $$ = [ $1 ]; }
  | param COMMA params
    ${ $$ = [ $1, ...$3 ]; }
  ;

param
  : ID
    { $$ = { id: $1 }; }
  | ID COLON type
    { $$ = { id: $1, type: $3 }; }
  ;

type
  : ADDRESS
    { $$ = $1; }
  | BOOLEAN
    { $$ = $1; }  
  | BYTES
    { $$ = $1; }  
  | HASH
    { $$ = $1; }
  | INT
    { $$ = $1; }
  | STRING
    { $$ = $1; }
  | UINT
    { $$ = $1; }
  ;

statements
  : /* empty */
    { $$ = [ ]; }
  | statement statements
    { $$ = [ $1, ...$2 ]; }
  ;

statement_if
  : IF OPEN_PAREN expr CLOSE_PAREN OPEN_BRACE statements CLOSE_BRACE
    { $$ = { type: "stmt-if", branches: [ { cond: $3, body: $6 } ] }; }
  ;

statement_elseif
  : statement_if
    { $$ = $1; }
  | statement_elseif ELSE IF OPEN_PAREN expr CLOSE_PAREN OPEN_BRACE statements CLOSE_BRACE
    { {
      const branches = $1.branches;
      branches.push({ cond: $5, body: $8 });
      $$ = { type: "stmt-if", branches };
    } }
  ;

statement_else
  : statement_elseif
    { $$ = $1; }
  | statement_elseif ELSE OPEN_BRACE statements CLOSE_BRACE
    { {
      const branches = $1.branches;
      branches.push({ body: $4 });
      $$ = { type: "stmt-if", branches } ;
    } }
  ;

statement
  : ID ASSIGN expr SEMI
    { $$ = { type: "stmt-assign", target: $1, op: $2, expr: $3 }; }
  | ID EQUALS expr SEMI
    { $$ = { type: "stmt-assign", target: $1, op: "=", expr: $3 }; }
  | DECLARE ID EQUALS expr SEMI
    { $$ = { type: "stmt-assign", declare: $1, target: $1, op: $2, expr: $3 }; }
  | expr SEMI
    { $$ = { type: "stmt-expr", expr: $1 }; }
  | WHILE OPEN_PAREN expr CLOSE_PAREN OPEN_BRACE statements CLOSE_BRACE
    { $$ = { type: "stmt-while", cond: $3, body: $6 }; }
  | statement_else
    { $$ = $1; }
  | RETURN SEMI
    { $$ = { type: "return" }; }
  | RETURN expr SEMI
    { $$ = { type: "return", value: $2 }; }
  ;

primary_expr
  : ID
    { $$ = { type: "id", value: yytext }; }
  | NUMBER
    { {
      let v = yytext;
      if (v.substring(0, 2) === "0b") {
        v = parseInt(v.substring(2), 2);
      }
      $$ = { type: "literal", value: parseInt(v) };
    } }
  | STRING
    { $$ = { type: "literal", value: yytext }; }
  | BOOL
    { $$ = { type: "literal", value: (yytext === "true") }; }
  | OPEN_PAREN expr CLOSE_PAREN
    { $$ = $2; }
  ;

unary_op
  : NOT { $$ = $1; }
  | MINUS { $$ = $1; }
  ;

unary_expr
  : primary_expr
    { $$ = $1; }
  | OPEN_TRIANGE TYPE CLOSE_TRIANGLE primary_expr
    { $$ = { type: "cast", cast: $2, expr: $4 }; }
  | unary_op primary_expr
    { $$ = { type: "unary", op: $1, expr: $2 }; }
  ;

mul_expr
  : unary_expr
    { $$ = $1; }
  | mul_expr MULOP unary_expr
    { $$ = { type: "binary-expr", op: $2, left: $1, right: $3 }; }
  ;

add_op
  : PLUS { $$ = $1; }
  | MINUS { $$ = $1; }
  ;

add_expr
  : mul_expr
    { $$ = $1; }
  | add_expr add_op mul_expr
    { $$ = { type: "binary-expr", op: $2, left: $1, right: $3 }; }
  ;

shift_expr
  : add_expr
    { $$ = $1; }
  | shift_expr SHIFTOP add_expr
    { $$ = { type: "binary-expr", op: $2, left: $1, right: $3 }; }
  ;

rel_expr
  : shift_expr
    { $$ = $1; }
  | rel_expr RELOP shift_expr
    { $$ = { type: "binary-expr", op: $2, left: $1, right: $3 }; }
  ;

eq_expr
  : rel_expr
    { $$ = $1; }
  | eq_expr EQOP rel_expr
    { $$ = { type: "binary-expr", op: $2, left: $1, right: $3 }; }
  ;

and_expr
  : eq_expr
    { $$ = $1; }
  | and_expr AND eq_expr
    { $$ = { type: "binary-expr", op: $2, left: $1, right: $3 }; }
  ;

xor_expr
  : and_expr
    { $$ = $1; }
  | xor_expr XOR and_expr
    { $$ = { type: "binary-expr", op: $2, left: $1, right: $3 }; }
  ;

or_expr
  : xor_expr
    { $$ = $1; }
  | or_expr OR xor_expr
    { $$ = { type: "binary-expr", op: $2, left: $1, right: $3 }; }
  ;

logic_and_expr
  : or_expr
    { $$ = $1; }
  | logic_and_expr LOGICAND or_expr
    { $$ = { type: "binary-expr", op: $2, left: $1, right: $3 }; }
  ;

logic_or_expr
  : logic_and_expr
    { $$ = $1; }
  | logic_or_expr LOGICOR logic_and_expr
    { $$ = { type: "binary-expr", op: $2, left: $1, right: $3 }; }
  ;

expr
  : logic_or_expr
  ;

%%

function loc(yy, start, end, statement) {
}
