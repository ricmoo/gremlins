%lex

%%

// Ignorables
([/][/][^\n]*\n)                               // Ignore comments
([/][*].*[*][/])                               // Ignore comments
(\s+)                                          // Ignore Whitespace

";"                                            return "SEMI"

// Literals
([0][x][0-9a-fA-F]+)                           return "NUMBER"
([0][b][01]+)                                  return "NUMBER"
([0-9]+)                                       return "NUMBER"

"true"                                         return "BOOL"
"false"                                        return "BOOL"

// ("0x"[0-9a-f]+)                                return "BYTES"
//(["]([^\]|[\].)+["])                           return "STRING"
(["]([^\\]|\\.)*["])                           return "STRING"

// Scope
//("{" | "}")

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

"if"              return "IF"
"else"            return "ELSE"

"while"           return "WHILE"

"try"             return "TRY"
"catch"           return "CATCH"


// ID; this should be parsed last
([A-Za-z_][A-Za-z0-9_]*)                       return "ID"


// Special
<<EOF>>                                        return "EOF"
                                               return "INVALID"
/lex

%start program

%%

program
  : statements EOF
    { return { type: "program", statements: $1 }; }
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
    { $$ = { type: "cast", type: $2, expr: $4 }; }
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
