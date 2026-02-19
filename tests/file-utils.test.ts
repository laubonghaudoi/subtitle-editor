import test from "node:test";
import assert from "node:assert/strict";
import { isMediaFile } from "../lib/file-utils";

test("isMediaFile accepts ac3 extension fallback", () => {
  const file = new File(["fake"], "sample.ac3", {
    type: "application/octet-stream",
  });

  assert.equal(isMediaFile(file), true);
});

test("isMediaFile rejects unsupported extension", () => {
  const file = new File(["fake"], "sample.xyz", {
    type: "application/octet-stream",
  });

  assert.equal(isMediaFile(file), false);
});
