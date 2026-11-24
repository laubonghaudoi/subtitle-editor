import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { saveSubtitleFile } from "../lib/save-subtitle-file";
import type { SubtitleTrack } from "../types/subtitle";
import "./helpers/render";

const track: SubtitleTrack = {
  id: "test-track",
  name: "English 粵語/Draft",
  subtitles: [
    {
      id: 1,
      uuid: "test-cue",
      startTime: "00:00:01,000",
      endTime: "00:00:02,000",
      text: "𠁞好",
    },
  ],
  vttHeader: "WEBVTT Test",
  vttPrologue: ["NOTE Keep this metadata"],
};

type PickerOptions = {
  suggestedName: string;
  types: { accept: Record<string, string[]> }[];
};

function setPicker(pick: (options: PickerOptions) => Promise<unknown>) {
  Object.defineProperty(window, "showSaveFilePicker", {
    configurable: true,
    value: pick,
  });
}

test.beforeEach(() => {
  mock.method(window.HTMLAnchorElement.prototype, "click", () =>
    assert.fail("Saving should not start a fallback download implicitly"),
  );
});

test.afterEach(() => {
  mock.restoreAll();
  Reflect.deleteProperty(window, "showSaveFilePicker");
});

test("each native save suggests the selected file type, writes the track and closes the stream", async () => {
  const types = {
    srt: "text/plain",
    vtt: "text/vtt",
    txt: "text/plain",
    csv: "text/csv",
  } as const;

  for (const format of ["srt", "vtt", "txt", "csv"] as const) {
    const operations: string[] = [];
    setPicker(async (options) => {
      assert.equal(options.suggestedName, `English_粵語_Draft.${format}`);
      assert.deepEqual(options.types[0].accept, {
        [types[format]]: [`.${format}`],
      });
      return {
        createWritable: async () => ({
          write: async (data: Blob | string) => {
            const text = typeof data === "string" ? data : await data.text();
            assert.ok(text.includes(track.subtitles[0].text));
            if (format === "vtt") {
              assert.ok(text.includes("NOTE Keep this metadata"));
            }
            operations.push("write");
          },
          close: async () => {
            operations.push("close");
          },
        }),
      };
    });
    assert.equal(await saveSubtitleFile(track, format), "saved");
    assert.deepEqual(operations, ["write", "close"]);
  }
});

test("dismissing the picker cancels the export", async () => {
  setPicker(async () => {
    throw new DOMException("Cancelled", "AbortError");
  });
  assert.equal(await saveSubtitleFile(track, "srt"), "cancelled");
});

test("an unavailable or blocked picker returns a named file for download", async () => {
  async function assertDownloadFile() {
    const file = await saveSubtitleFile(track, "txt");
    assert.ok(file instanceof File);
    assert.equal(file.name, "English_粵語_Draft.txt");
    assert.equal(file.type, "text/plain");
    assert.equal(await file.text(), track.subtitles[0].text);
  }
  await assertDownloadFile();
  setPicker(async () => {
    throw new DOMException("Blocked", "SecurityError");
  });
  await assertDownloadFile();
});

test("unexpected picker errors and aborted writes or closes reject the save", async () => {
  const pickerError = new TypeError("Invalid picker options");
  setPicker(async () => {
    throw pickerError;
  });
  await assert.rejects(
    saveSubtitleFile(track, "srt"),
    (error) => error === pickerError,
  );

  for (const failedOperation of ["write", "close"] as const) {
    const failure = new DOMException("File unavailable", "AbortError");
    setPicker(async () => ({
      createWritable: async () => ({
        write: async () => {
          if (failedOperation === "write") throw failure;
        },
        close: async () => {
          if (failedOperation === "close") throw failure;
        },
        abort: async () => {
          throw new DOMException("Stream already closed", "InvalidStateError");
        },
      }),
    }));
    await assert.rejects(
      saveSubtitleFile(track, "srt"),
      (error) => error === failure,
    );
  }
});
