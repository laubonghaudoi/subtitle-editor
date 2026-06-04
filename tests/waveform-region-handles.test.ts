import test from "node:test";
import assert from "node:assert/strict";
import type { Region } from "wavesurfer.js/dist/plugins/regions.esm.js";
import { applyRegionHandleStyles } from "../components/waveform-visualizer/utils";
import "./helpers/render";

test("waveform region handles get solid borders and arrow markers", () => {
  const element = document.createElement("div");
  element.innerHTML = `
    <div part="region-handle region-handle-left"></div>
    <div part="region-handle region-handle-right"></div>
  `;
  const region = { element } as Region;

  applyRegionHandleStyles(region, "#123456");

  const left = element.querySelector(
    'div[part="region-handle region-handle-left"]',
  ) as HTMLDivElement;
  const right = element.querySelector(
    'div[part="region-handle region-handle-right"]',
  ) as HTMLDivElement;

  assert.match(left.style.cssText, /border-left: 2px solid rgb\(18, 52, 86\)/);
  assert.match(
    right.style.cssText,
    /border-right: 2px solid rgb\(18, 52, 86\)/,
  );
  assert.ok(left.querySelector('[data-arrow="left"]'));
  assert.ok(right.querySelector('[data-arrow="right"]'));
});
