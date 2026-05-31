import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const localSessionRecoverySource = readFileSync(
  "components/local-session-recovery.tsx",
  "utf8",
);

test("local session recovery dialog contains German-length labels without horizontal overflow", () => {
  assert.match(
    localSessionRecoverySource,
    /<DialogContent[\s\S]*className="[^"]*max-w-\[calc\(100vw-2rem\)\][^"]*sm:max-w-xl/,
  );
  assert.match(localSessionRecoverySource, /DialogHeader className="min-w-0"/);
  assert.match(
    localSessionRecoverySource,
    /className="[^"]*min-w-0[^"]*overflow-hidden/,
  );
  assert.match(
    localSessionRecoverySource,
    /DialogFooter className="[^"]*sm:flex-wrap/,
  );
  assert.match(
    localSessionRecoverySource,
    /className="[^"]*w-full[^"]*sm:w-auto/,
  );
});

test("local session recovery dialog uses larger typography for the restore prompt", () => {
  assert.match(
    localSessionRecoverySource,
    /<DialogContent[\s\S]*className="[^"]*text-base/,
  );
  assert.match(
    localSessionRecoverySource,
    /<DialogTitle className="[^"]*text-xl[^"]*leading-tight/,
  );
  assert.match(
    localSessionRecoverySource,
    /<DialogDescription className="[^"]*text-base/,
  );
  assert.match(
    localSessionRecoverySource,
    /className="[^"]*rounded-lg[^"]*text-base/,
  );
  assert.equal(
    localSessionRecoverySource.match(
      /className="[^"]*w-full[^"]*sm:w-auto[^"]*text-base/g,
    )?.length,
    3,
  );
});
