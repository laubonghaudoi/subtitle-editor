import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  applyRegexReplacement,
  collectMatches,
} from "@/lib/find-replace-helpers";
import type { Subtitle } from "@/types/subtitle";
import type { CheckedState } from "@radix-ui/react-checkbox";
import type { CSSProperties, ReactNode } from "react";

// NOTE: no CSS `border-top` here — under border-collapse a collapsed top border
// won't stick with the sticky header (it scrolls away). The sticky top line is
// drawn via the inset box-shadow in `stickyStyle` instead. Sides + bottom stay as CSS.
const STICKY_HEAD_CLASS =
  "sticky top-0 z-20 border-x border-b border-black dark:border-white font-semibold text-sm uppercase tracking-wide";
const TABLE_CELL_CLASS = "border border-black dark:border-white";
const TABLE_CHECKBOX_CELL_CLASS = `${TABLE_CELL_CLASS} w-10 min-w-10 !p-0 text-center align-middle`;
const TABLE_CHECKBOX_WRAPPER_CLASS =
  "flex min-h-10 items-center justify-center";

type MatchHighlightProps = {
  text: string;
  query: string;
  regex: RegExp;
  allowZeroLength: boolean;
};

function renderMatchHighlights({
  text,
  query,
  regex,
  allowZeroLength,
}: MatchHighlightProps): ReactNode {
  if (!query) {
    return text;
  }

  const matches = collectMatches(text, regex, allowZeroLength).filter(
    (match) => match[0].length > 0,
  );

  if (matches.length === 0) {
    return text;
  }

  const fragments: ReactNode[] = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    const start = match.index ?? 0;
    const end = start + match[0].length;

    if (start > cursor) {
      fragments.push(text.slice(cursor, start));
    }

    fragments.push(
      <span key={`match-${start}-${index}`} className="bg-red-800 text-black">
        {text.slice(start, end)}
      </span>,
    );

    cursor = end;
  });

  if (cursor < text.length) {
    fragments.push(text.slice(cursor));
  }

  return <>{fragments}</>;
}

type ReplacementHighlightProps = {
  text: string;
  query: string;
  replacement: string;
};

function renderReplacementHighlights({
  text,
  query,
  replacement,
}: ReplacementHighlightProps): ReactNode {
  if (!query || replacement.length === 0) {
    return text;
  }

  const segments = text.split(replacement);

  if (segments.length === 1) {
    return text;
  }

  const fragments: ReactNode[] = [];

  segments.forEach((segment, index) => {
    fragments.push(<span key={`segment-${index}`}>{segment}</span>);

    if (index < segments.length - 1) {
      fragments.push(
        <span key={`replace-${index}`} className="bg-green-800 text-black">
          {replacement}
        </span>,
      );
    }
  });

  return <>{fragments}</>;
}

export type FindReplaceTableLabels = {
  id: string;
  original: string;
  preview: string;
  noMatches: string;
};

export type FindReplaceTableProps = {
  matchedSubtitles: Subtitle[];
  compiledRegex: RegExp | null;
  findText: string;
  replaceText: string;
  allowZeroLengthMatches: boolean;
  selectedIds: Set<number>;
  labels: FindReplaceTableLabels;
  onToggleRow: (id: number, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  headerColor?: string;
  headerTextColor?: string;
};

const isChecked = (state: CheckedState) => state !== false;

type TableCheckboxProps = {
  checked: boolean;
  onCheckedChange: (state: CheckedState) => void;
};

function TableCheckbox({ checked, onCheckedChange }: TableCheckboxProps) {
  return (
    <div className={TABLE_CHECKBOX_WRAPPER_CLASS}>
      <Checkbox
        checked={checked}
        className="translate-y-0"
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

export function FindReplaceTable({
  matchedSubtitles,
  compiledRegex,
  findText,
  replaceText,
  allowZeroLengthMatches,
  selectedIds,
  labels,
  onToggleRow,
  onToggleAll,
  headerColor = "var(--muted)",
  headerTextColor = "var(--foreground)",
}: FindReplaceTableProps) {
  const allSelected =
    matchedSubtitles.length > 0 &&
    matchedSubtitles.every((subtitle) => selectedIds.has(subtitle.id));
  const stickyStyle: CSSProperties = {
    backgroundColor: headerColor,
    boxShadow: "inset 0 1px 0 var(--foreground)",
    color: headerTextColor,
  };

  return (
    <Table
      containerClassName="max-h-[32rem] overflow-y-auto"
      className="w-full border-collapse text-base"
    >
      <TableHeader>
        <TableRow>
          <TableHead
            className={`${STICKY_HEAD_CLASS} ${TABLE_CHECKBOX_CELL_CLASS}`}
            style={stickyStyle}
          >
            <TableCheckbox
              checked={allSelected}
              onCheckedChange={(state) => onToggleAll(isChecked(state))}
            />
          </TableHead>
          <TableHead
            className={`${STICKY_HEAD_CLASS} w-fit`}
            style={stickyStyle}
          >
            {labels.id}
          </TableHead>
          <TableHead className={STICKY_HEAD_CLASS} style={stickyStyle}>
            {labels.original}
          </TableHead>
          <TableHead className={STICKY_HEAD_CLASS} style={stickyStyle}>
            {labels.preview}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {matchedSubtitles.length > 0 ? (
          matchedSubtitles.map((subtitle) => {
            const previewText = compiledRegex
              ? applyRegexReplacement(
                  subtitle.text,
                  compiledRegex,
                  replaceText,
                  allowZeroLengthMatches,
                ).result
              : subtitle.text;

            return (
              <TableRow key={subtitle.id} className="hover:bg-accent">
                <TableCell className={TABLE_CHECKBOX_CELL_CLASS}>
                  <TableCheckbox
                    checked={selectedIds.has(subtitle.id)}
                    onCheckedChange={(state) =>
                      onToggleRow(subtitle.id, isChecked(state))
                    }
                  />
                </TableCell>
                <TableCell className={TABLE_CELL_CLASS}>
                  {subtitle.id}
                </TableCell>
                <TableCell
                  className={`${TABLE_CELL_CLASS} whitespace-pre-wrap wrap-break-word`}
                >
                  {compiledRegex
                    ? renderMatchHighlights({
                        text: subtitle.text,
                        query: findText,
                        regex: compiledRegex,
                        allowZeroLength: allowZeroLengthMatches,
                      })
                    : subtitle.text}
                </TableCell>
                <TableCell
                  className={`${TABLE_CELL_CLASS} whitespace-pre-wrap wrap-break-word`}
                >
                  {compiledRegex
                    ? renderReplacementHighlights({
                        text: previewText,
                        query: findText,
                        replacement: replaceText,
                      })
                    : previewText}
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell
              colSpan={4}
              className={`${TABLE_CELL_CLASS} py-4 text-center text-muted-foreground`}
            >
              {labels.noMatches}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
