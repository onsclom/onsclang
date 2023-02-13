import type { ASTNode, BinaryNode, IdentifierNode, UnaryNode } from "./parser";

function interpretBinaryExpr(expr: BinaryNode, state: IntState) {
  const right = interpretExpr(expr.right, state);
  if (right.ok === false) return right;

  if (expr.operator.type === "assignment") {
    if (expr.left.type !== "identifier")
      return {
        ok: false,
        error: "Left side of assignment must be an identifier",
      };
    state.variables[expr.left.value.value] = right.value;
    return { ok: true, value: right.value };
  } else if (expr.operator.type === "reassignment") {
    if (expr.left.type !== "identifier")
      return {
        ok: false,
        error: "Left side of reassignment must be an identifier",
      };
    if (state.variables[expr.left.value.value] === undefined)
      return {
        ok: false,
        error: `Variable ${expr.left.value.value} is not defined`,
      };
    state.variables[expr.left.value.value] = right.value;
    return { ok: true, value: right.value };
  }

  const left = interpretExpr(expr.left, state);
  if (left.ok === false) return left;
  {
    try {
      switch (expr.operator.type) {
        case "plus":
          return { ok: true, value: +left.value + +right.value };
        case "minus":
          return { ok: true, value: +left.value - +right.value };
        case "times":
          return { ok: true, value: +left.value * +right.value };
        case "divide":
          return { ok: true, value: +left.value / +right.value };
        default:
          return { ok: false, error: "Unknown operator" };
      }
    } catch (error) {
      // TODO: make error message better here
      return { ok: false, error: error.message };
    }
  }
}

function interpretUnaryExpr(expr: UnaryNode, state: IntState) {
  const right = interpretExpr(expr.right, state);
  if (right.ok === false) return right;
  switch (expr.operator.type) {
    case "minus":
      // TODO: add error here if right.value is not a number
      return { ok: true, value: -right.value };
    default:
      return { ok: false, error: "Unknown operator" };
  }
}

function interpretIdentifier(expr: IdentifierNode, state: IntState) {
  if (state.variables[expr.value.value] === undefined)
    return {
      ok: false,
      error: `Variable ${expr.value.value} is not defined`,
    };
  return {
    ok: true,
    value: state.variables[expr.value.value],
  };
}

function interpretExpr(expr: ASTNode, state: IntState) {
  if (expr.type === "binaryExpr") return interpretBinaryExpr(expr, state);
  if (expr.type === "unaryExpr") return interpretUnaryExpr(expr, state);
  if (expr.type === "number") return { ok: true, value: expr.value.value };
  if (expr.type === "string") return { ok: true, value: expr.value.value };
  if (expr.type === "identifier") return interpretIdentifier(expr, state);
}

interface IntState {
  variables: { [key: string]: unknown };
}

type IntResult =
  | {
      ok: true;
      value: unknown;
    }
  | {
      ok: false;
      error: string;
    };

export function interpret(astNodes: ASTNode[]) {
  let state = {
    variables: {},
  };

  let result: IntResult = { ok: false, error: "No expressions" };
  for (const expr of astNodes) {
    result = interpretExpr(expr, state);
    if (result.ok === false) return result;
  }

  return result;
}
