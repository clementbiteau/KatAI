import { createEvaluator } from "../katas/evaluate.ts";

// Runs inside the worker. It loads the model's code with importScripts, so a
// syntax error is caught with its message (CA4.8), then runs each test and
// reports results one by one, so a later endless loop cannot hide earlier ones.
// Wrapped in a function so that it only defines the __kataiEvaluator global and
// cannot clash with names declared by the model's code.
const WORKER_BRIDGE = `(function () {
  var evaluator = self.__kataiEvaluator;
  self.onmessage = function (event) {
    self.onmessage = null;
    var request = event.data;
    var name = request.functionName;
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) {
      self.postMessage({ type: "load-error", message: "Invalid function name." });
      return;
    }
    var exposeCandidate = "\\n;self.__kataiCandidate = typeof " + name + " === \\"function\\" ? " + name + " : undefined;\\n";
    var codeUrl = URL.createObjectURL(new Blob([request.code, exposeCandidate], { type: "text/javascript" }));
    try {
      importScripts(codeUrl);
    } catch (error) {
      self.postMessage({ type: "load-error", message: String(error && error.message ? error.message : error) });
      return;
    }
    var candidate = self.__kataiCandidate;
    if (typeof candidate !== "function") {
      self.postMessage({ type: "load-error", message: "Function " + name + " was not found in the generated code." });
      return;
    }
    for (var index = 0; index < request.tests.length; index += 1) {
      self.postMessage({ type: "result", outcome: evaluator.runKataTest(candidate, request.tests[index]) });
    }
    self.postMessage({ type: "done" });
  };
})();`;

export function buildWorkerSource(): string {
  return `self.__kataiEvaluator = (${createEvaluator.toString()})();\n${WORKER_BRIDGE}`;
}
