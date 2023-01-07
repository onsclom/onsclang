import { runProgram } from "./index.ts";

function test(tests: [string, number][]): void {
  let log = "";
  const testAmount = tests.length;
  let testPassed = 0;
  for (const [program, expected] of tests) {
    const result = runProgram(program);
    if (result === expected) testPassed++;
    else log += `${program} failed, expected ${expected}, got ${result}\n`;
  }
  console.log(`${testPassed}/${testAmount} tests passed`);
  if (log) console.log(log);
}

test([
  ["1 + 2", 3],
  ["1 * 2 - 3 + 4", 3],
  ["1 - 2", -1],
  ["1 + 2 * 3", 7],
]);
