import assert from "node:assert/strict";
import test from "node:test";

test("renders APx identity, calculator, and explicit unmeasured status", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html=await response.text();
  assert.match(html, /APx/);
  assert.match(html, /Intelligence,/);
  assert.match(html, /SYNTHETIC SCENARIO/);
  assert.match(html, /Not measured yet/);
  assert.match(html, /id="lab"/);
  assert.doesNotMatch(html, /Starter Project|codex-preview/);
});
