import ts from "typescript";
import { CODE_FILE_PATTERN, LIMITS, type Violation } from "./config.ts";

// Anonymous functions passed directly as call arguments or inline JSX
// attribute values are not counted (decision Q5 in docs/intent.md).
function isPassedAsArgument(node: ts.ArrowFunction | ts.FunctionExpression): boolean {
  const parent = node.parent;
  if (ts.isCallExpression(parent) || ts.isNewExpression(parent)) {
    return parent.arguments?.includes(node) ?? false;
  }
  return ts.isJsxExpression(parent) && ts.isJsxAttribute(parent.parent);
}

function isCountedFunction(node: ts.Node): boolean {
  if (
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node)
  ) {
    return node.body !== undefined;
  }
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    return !isPassedAsArgument(node);
  }
  return false;
}

export function countFunctions(source: string, fileName: string): number {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
  let count = 0;
  function visit(node: ts.Node): void {
    if (isCountedFunction(node)) count += 1;
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return count;
}

export function checkFunctionCounts(paths: readonly string[], readSource: (path: string) => string): Violation[] {
  return paths
    .filter((path) => CODE_FILE_PATTERN.test(path))
    .map((path) => ({ path, count: countFunctions(readSource(path), path) }))
    .filter(({ count }) => count > LIMITS.functionsPerFile)
    .map(({ path, count }) => ({ rule: "functions-per-file", path, actual: count, limit: LIMITS.functionsPerFile }));
}
