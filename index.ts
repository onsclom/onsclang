// tokenizer

interface Token {
  type: "+" | "-" | "*" | "/" | "(" | ")" | "number" | "^";
  line: number;
  row: number;
  value: string;
}

interface Tokenizer {
  tokens: Token[];
  line: number;
  row: number;
  success: boolean;
  error?: string;
}

function addToken(tokenizer: Tokenizer, type: Token["type"], value = "") {
  tokenizer.tokens.push({
    type,
    line: tokenizer.line,
    row: tokenizer.row,
    value: value,
  });
}

export function tokenize(input: string): Tokenizer {
  let tokenizer: Tokenizer = {
    tokens: [],
    line: 0,
    row: 0,
    success: true,
  };

  const lines = input.split("\n");
  for (const line of lines) {
    while (tokenizer.row < line.length) {
      const nextChar = line[tokenizer.row];
      if (nextChar == " " || nextChar == "\t") {
        tokenizer.row++;
        continue;
      }
      const operators = new Set(["+", "-", "*", "/", "(", ")", "^"]);
      if (operators.has(nextChar)) {
        addToken(tokenizer, nextChar as Token["type"]);
        tokenizer.row++;
        continue;
      }
      const numberRegex = /\d*\.?\d*/;
      const remainingLine = line.slice(tokenizer.row);
      if ("1234567890.".includes(nextChar)) {
        const number = remainingLine.match(numberRegex)![0];
        addToken(tokenizer, "number", number);
        tokenizer.row += number.length;
        continue;
      }
      tokenizer.success = false;
      tokenizer.error = `Unexpected character '${nextChar}' at line ${tokenizer.line} and row ${tokenizer.row}`;
      return tokenizer;
    }
    tokenizer.row = 0;
    tokenizer.line++;
  }

  return tokenizer;
}

// parser

interface UnaryOperation {
  type: "UnaryOperation";
  operator: "+" | "-";
  right: ParseNode;
}

interface BinaryOperation {
  type: "BinaryOperation";
  operator: "+" | "-" | "*" | "/" | "^";
  left: ParseNode;
  right: ParseNode;
}

interface Literal {
  type: "Literal";
  value: number;
}

type ParseNode = UnaryOperation | BinaryOperation | Literal;

interface Parser {
  parseNodes: ParseNode[];
  currentToken: number;
  success: boolean;
  error?: string;
}

const precedenceLevels = {
  1: ["+", "-"],
  2: ["*", "/"],
  3: ["^"],
};

const operatorPrecedence = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
  "^": 3,
};

const maxOperatorPrecedence = Math.max(
  ...Object.keys(precedenceLevels).map(Number)
);

function generateError(parser: Parser, tokens: Token[], message: string) {
  const nextToken = tokens[parser.currentToken] || tokens[tokens.length - 1];
  parser.success = false;
  parser.error = `${message} at line ${nextToken.line} and row ${nextToken.row}`;
}

// LITERAL | "(" EXPRESSION ")"
function parseAtom(parser: Parser, tokens: Token[]): ParseNode | undefined {
  let nextToken = tokens[parser.currentToken];
  if (nextToken && nextToken.type === "(") {
    parser.currentToken++;
    const expression = parseExpression(parser, tokens);
    nextToken = tokens[parser.currentToken];
    if (nextToken.type !== ")") {
      generateError(parser, tokens, "Expected ')'");
      return;
    }
    parser.currentToken++;
    return expression;
  }
  if (nextToken && nextToken.type === "number") {
    parser.currentToken++;
    return {
      type: "Literal",
      value: Number(nextToken.value),
    };
  }
  generateError(parser, tokens, "Expected number or '('");
}

// ("+" | "-") LITERAL
function parseUnaryExpression(
  parser: Parser,
  tokens: Token[]
): ParseNode | undefined {
  const nextToken = tokens[parser.currentToken];
  if (nextToken && (nextToken.type === "+" || nextToken.type === "-")) {
    parser.currentToken++;
    const right = parseAtom(parser, tokens);
    if (!right) return;
    return {
      type: "UnaryOperation",
      operator: nextToken.type as UnaryOperation["operator"],
      right,
    };
  }
  return parseAtom(parser, tokens);
}

// LITERAL (("+" | "-" | "/" | "*" | "^") LITERAL)*
function parseExpression(
  parser: Parser,
  tokens: Token[],
  precedence = 1
): ParseNode | undefined {
  if (precedence > maxOperatorPrecedence)
    return parseUnaryExpression(parser, tokens);
  let cur = parseExpression(parser, tokens, precedence + 1);
  if (!cur) return;
  let nextToken = tokens[parser.currentToken];
  const binaryOperators = new Set(["+", "-", "*", "/", "^"]);
  while (nextToken && binaryOperators.has(nextToken.type)) {
    if (operatorPrecedence[nextToken.type] !== precedence) return cur;
    parser.currentToken++;
    const right = parseExpression(parser, tokens, precedence + 1);
    if (!right) return;
    cur = {
      type: "BinaryOperation",
      operator: nextToken.type as BinaryOperation["operator"],
      left: cur,
      right,
    };
    nextToken = tokens[parser.currentToken];
  }
  return cur;
}

export function parse(tokens: Token[]): Parser {
  let parser: Parser = {
    parseNodes: [],
    currentToken: 0,
    success: true,
  };
  while (parser.currentToken < tokens.length && parser.success) {
    const result = parseExpression(parser, tokens);
    if (result) parser.parseNodes.push(result);
  }
  return parser;
}

// interpreter

export function prettyPrint(nodes: Object[], indentation = 0): string {
  let cur = "";
  for (const node of nodes) {
    for (const [key, value] of Object.entries(node)) {
      cur += "  ".repeat(indentation);
      if (value instanceof Object)
        cur += `${key}:\n${prettyPrint([value], indentation + 1)}`;
      else cur += `${key}: ${value}\n`;
    }
  }
  return cur;
}
