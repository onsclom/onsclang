import { tokenize } from "./tokenizer";
import { parse } from "./parser";
import { interpret } from "./interpreter";

type RunResult =
  | {
      ok: true;
      value: unknown;
    }
  | {
      ok: false;
      error: string;
    };

export function run(code: string): RunResult {
  const tokens = tokenize(code);
  if (tokens.ok === false) return { ok: false, error: tokens.error };
  const ast = parse(tokens.tokens);
  if (ast.ok === false) return { ok: false, error: ast.error };
  const result = interpret(ast.ast);
  if (result.ok === false) return { ok: false, error: result.error };
  return result;
}
