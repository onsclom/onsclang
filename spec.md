# spec

## binary operators

`+ - * / := <-`

## precedence (lowest -> highest)

```
:= <-, right to left
+ -, left to right
* /, left to right
```

## grammar

```
program := (expr "\n")*
expr := assignExpr | sumExpr

assignExpr := identifier ( (":=" | "<-") sumExpr ) +

sumExpr := mulExpr ( ("+" | "-") mulExpr )*
mulExpr := unaryExpr ( ("*" | "/") unaryExpr )*
unaryExpr := ("-")* atom
atom := number | string | identifier | "(" expr ")"
```
