program := expr*

expr := expr ('+' | '-' | "*" | "/" | "^") binaryExpr 
  | ('+' | '-') atom

atom := numberLiteral | '(' expr ')'