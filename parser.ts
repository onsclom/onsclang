import type { Token, ValueToken } from "./tokenizer";

/*
  binary operators:
    + - * / := <-

  precedence (lowest -> highest):
    := <-, right to left
    + -, left to right
    * /, left to right
*/

/*
  grammar:
    program := (expr "\n")*
    expr := assignExpr | sumExpr

    assignExpr := identifier ( (":=" | "<-") sumExpr ) +

    sumExpr := mulExpr ( ("+" | "-") mulExpr )*
    mulExpr := unaryExpr ( ("*" | "/") unaryExpr )*
    unaryExpr := ("-")* atom
    atom := number | string | identifier | "(" expr ")"
*/

export interface BinaryNode {
  type: "binaryExpr";
  operator: Token;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryNode {
  type: "unaryExpr";
  operator: Token;
  right: ASTNode;
}

export interface NumberNode {
  type: "number";
  value: ValueToken;
}

export interface StringNode {
  type: "string";
  value: ValueToken;
}

export interface IdentifierNode {
  type: "identifier";
  value: ValueToken;
}

export type ASTNode =
  | BinaryNode
  | UnaryNode
  | NumberNode
  | StringNode
  | IdentifierNode;

function expect(tokens: Token[], state: ParserState, type: Token["type"]) {
  if (state.index >= tokens.length)
    return {
      ok: false,
      error: `Expected ${type} but got EOF at ${state.index}`,
    } as const;
  if (tokens[state.index].type !== type) {
    return {
      ok: false,
      error: `Expected ${type} but got ${tokens[state.index].type} at ${
        state.index
      }`,
    } as const;
  }
  const token = tokens[state.index];
  state.index++;
  return { ok: true, token } as const;
}

function consume(tokens: Token[], state: ParserState) {
  const token = tokens[state.index];
  state.index++;
  return token;
}

function peek(tokens: Token[], state: ParserState) {
  if (state.index >= tokens.length) return null;
  return tokens[state.index].type;
}

// atom := number | string | identifier | "(" expr ")"
function parseAtom(tokens: Token[], state: ParserState) {
  const oldIndex = state.index;
  const next = peek(tokens, state);
  if (next === "number") {
    return { ok: true, ast: { type: "number", value: consume(tokens, state) } };
  } else if (next === "string") {
    return { ok: true, ast: { type: "string", value: consume(tokens, state) } };
  } else if (next === "identifier") {
    return {
      ok: true,
      ast: { type: "identifier", value: consume(tokens, state) },
    };
  } else if (next === "leftParen") {
    consume(tokens, state);
    const exprResult = parseExpr(tokens, state);
    if (!exprResult.ok) return exprResult;
    const rightParenResult = expect(tokens, state, "rightParen");
    if (!rightParenResult.ok) return rightParenResult;
    return { ok: true, ast: exprResult.ast };
  }
  state.index = oldIndex;
  return {
    ok: false,
    error: `Expected atom but got ${next} at ${state.index}`,
  };
}

// unaryExpr := ("-")* atom
function parseUnaryExpr(tokens: Token[], state: ParserState) {
  let operators: Token[] = [];
  while (peek(tokens, state) === "minus") {
    operators.push(consume(tokens, state));
  }
  const atomResult = parseAtom(tokens, state);
  if (!atomResult.ok) return atomResult;

  let root = atomResult.ast;
  operators.forEach((operator) => {
    root = {
      type: "unaryExpr",
      operator,
      right: root,
    };
  });
  return { ok: true, ast: root };
}

// mulExpr := unaryExpr ( ("*" | "/") unaryExpr )*
function parseMulExpr(tokens: Token[], state: ParserState) {
  const unaryResult = parseUnaryExpr(tokens, state);
  if (!unaryResult.ok) return unaryResult;
  let root = unaryResult.ast;

  let next = peek(tokens, state);
  while (next === "times" || next === "divide") {
    const operator = consume(tokens, state);
    const unaryResult = parseUnaryExpr(tokens, state);
    if (!unaryResult.ok) return unaryResult;

    root = {
      type: "binaryExpr",
      operator,
      left: root,
      right: unaryResult.ast,
    };
    next = peek(tokens, state);
  }

  return { ok: true, ast: root };
}

// sumExpr := mulExpr ( ("+" | "-") mulExpr )*
function parseSumExpr(tokens: Token[], state: ParserState) {
  const mulResult = parseMulExpr(tokens, state);
  if (!mulResult.ok) return mulResult;
  let root = mulResult.ast;

  let next = peek(tokens, state);
  while (next === "plus" || next === "minus") {
    const operator = consume(tokens, state);
    const mulResult = parseMulExpr(tokens, state);
    if (!mulResult.ok) return mulResult;

    root = {
      type: "binaryExpr",
      operator,
      left: root,
      right: mulResult.ast,
    };
    next = peek(tokens, state);
  }

  return { ok: true, ast: root };
}

// precedence is right to left
// assignExpr := identifier ( (":=" | "<-") sumExpr ) +
function parseAssignExpr(tokens: Token[], state: ParserState) {
  let oldIndex = state.index;
  const identifierResult = expect(tokens, state, "identifier");
  if (identifierResult.ok === false) return identifierResult;
  let root: IdentifierNode | BinaryNode = {
    type: "identifier",
    value: identifierResult.token as ValueToken,
  };
  let cur: BinaryNode | null = null;

  let nextTokenType = peek(tokens, state);
  if (nextTokenType !== "assignment" && nextTokenType !== "reassignment") {
    state.index = oldIndex;
    return { ok: false, error: "Expected assignment or reassignment" };
  }
  while (nextTokenType === "assignment" || nextTokenType === "reassignment") {
    const operator = consume(tokens, state);
    const sumResult = parseSumExpr(tokens, state);
    if (!sumResult.ok) return sumResult;

    if (cur === null) {
      root = {
        type: "binaryExpr",
        operator,
        left: root,
        right: sumResult.ast,
      };
      cur = root;
    } else {
      cur.right = {
        type: "binaryExpr",
        operator,
        left: cur.right,
        right: sumResult.ast,
      };
    }
    nextTokenType = peek(tokens, state);
  }

  return { ok: true, ast: root };
}

// expr := assignExpr | sumExpr
function parseExpr(tokens: Token[], state: ParserState) {
  let oldIndex = state.index;
  const assignResult = parseAssignExpr(tokens, state);
  if (assignResult.ok) return assignResult;
  const sumResult = parseSumExpr(tokens, state);
  if (sumResult.ok) return sumResult;
  state.index = oldIndex;
  return {
    ok: false,
    error: `Expected expression at ${state.index}`,
  };
}

interface ParserState {
  index: number;
}
// program := (expr "\n")*
export function parse(tokens: Token[]):
  | {
      ok: true;
      ast: ASTNode[];
    }
  | {
      ok: false;
      error: string;
    } {
  let state: ParserState = {
    index: 0,
  };
  let ast: ASTNode[] = [];
  while (state.index < tokens.length) {
    const result = parseExpr(tokens, state);
    if (!result.ok) return result;
    ast.push(result.ast);

    // expect /n or EOF
    if (state.index < tokens.length) {
      const result = expect(tokens, state, "newline");
      if (result.ok === false) return result;
    }
  }
  return { ok: true, ast };
}
