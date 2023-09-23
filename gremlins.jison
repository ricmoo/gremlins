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

// ("0x"[0-9a-f]+)                                return "BYTES"
//(["]([^\]|[\].)+["])                           return "STRING"
(["]([^\\]|\\.)*["])                           return "STRING"

// Scope
//("{" | "}")

// Assignment Op
([+-\\*/&\\|^]?[=])                                 return "ASSIGN"

// Operators

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

statement
  : ID ASSIGN expr SEMI
    { $$ = { type: "assign", target: $1, op: $2, expr: $3 }; }
  ;

expr
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
  ;

%%

function loc(yy, start, end, statement) {
}
