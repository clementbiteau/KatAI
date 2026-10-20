// Document loaded into the sandboxed iframe (docs/adr/0006-bac-a-sable-navigateur.md).
// The iframe has sandbox="allow-scripts" only, so its origin is opaque: no access
// to the page, its cookies or its storage. Its CSP forbids every network request.
// The bootstrap script is static on purpose: the application's CSP allows it by its
// SHA-256 hash (lib/content-security-policy.ts). It only relays messages; it never runs model code.

export const SANDBOX_BOOTSTRAP = `(function () {
  var started = false;
  window.addEventListener("message", function (event) {
    if (event.source !== window.parent || started) return;
    var request = event.data;
    if (!request || request.type !== "run") return;
    started = true;
    var parentOrigin = event.origin;
    function forward(message) { window.parent.postMessage(message, parentOrigin); }
    var worker;
    try {
      worker = new Worker(URL.createObjectURL(new Blob([request.workerSource], { type: "text/javascript" })));
    } catch (error) {
      forward({ type: "load-error", message: "The sandbox could not start: " + String(error && error.message ? error.message : error) });
      return;
    }
    worker.onmessage = function (message) {
      var data = message.data;
      if (data && (data.type === "result" || data.type === "load-error" || data.type === "done")) forward(data);
    };
    worker.onerror = function (error) {
      error.preventDefault();
      forward({ type: "load-error", message: String(error.message || "The generated code could not run.") });
    };
    worker.postMessage({ code: request.code, functionName: request.functionName, tests: request.tests });
  });
})();`;

const CONTENT_SECURITY_POLICY = "default-src 'none'; script-src 'unsafe-inline' blob:; worker-src blob:";

export const SANDBOX_DOCUMENT = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}">
</head>
<body>
<script>${SANDBOX_BOOTSTRAP}</script>
</body>
</html>`;
