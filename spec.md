WIP rough draft of language spec

```
program := expr*

expr := unaryExpr (('+' | '-' | '*' | '/' | '^') expr)*
  | ('+' | '-') atom

unaryExpr := ('+' | '-') atom
  | atom

atom := numberLiteral | '(' expr ')'
```