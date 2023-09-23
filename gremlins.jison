%lex

%%

// Ignorables
([/][/][^\n]*\n)                               // Ignore comments
([/][*].*[*][/])                               // Ignore comments
(\s+)                                          // Ignore Whitespace

([A-Za-z_][A-Za-z0-9_]*)                       return "ID"

// Scope
//("{" | "}")

// Operators


// Special
<<EOF>>                                        return "EOF"
                                               return "INVALID"
/lex

%start program

%%

program
  : statements EOF
    { return { }; }
  ;

statements
  : statement*
    { $$ = $1; }
//  | statements statement
//    { $$ = [ ...$1, $2 ]; }
  ;

statement
  : "hello world"
  ;

%%

function loc(yy, start, end, statement) {
}
