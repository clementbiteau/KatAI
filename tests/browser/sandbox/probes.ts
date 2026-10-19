// Probe programs run both inside the sandbox and in a plain worker (control),
// so a "blocked" result in the sandbox is proven to come from the sandbox itself.

export const NETWORK_PROBE = `
function probe() {
  try {
    var request = new XMLHttpRequest();
    request.open("GET", "data:text/plain,leak", false);
    request.send();
    return request.responseText === "leak" ? "allowed" : "blocked";
  } catch (error) {
    return "blocked";
  }
}`;

export const STORAGE_PROBE = `
function probe() {
  try {
    indexedDB.open("katai-probe");
    return "allowed";
  } catch (error) {
    return "blocked";
  }
}`;

// Runs a probe in an ordinary worker created by the test page, without the sandbox.
export function runProbeInPlainWorker(probeSource: string): Promise<string> {
  const source = `${probeSource}\npostMessage(probe());`;
  const worker = new Worker(URL.createObjectURL(new Blob([source], { type: "text/javascript" })));
  return new Promise((resolve) => {
    worker.onmessage = (event) => {
      worker.terminate();
      resolve(String(event.data));
    };
  });
}
