import { runProgram } from "./index.ts";

let expression = prompt(">");
while (expression != "exit") {
  console.log(runProgram(expression!));
  expression = prompt(">");
}
