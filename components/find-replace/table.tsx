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
import type { ReactNode } from "react";

const STICKY_HEAD_CLASS =
  "sticky top-0 z-20 bg-gray-200 dark:bg-gray-800 text-black dark:text-white";

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
      <span key={`match-${start}-${index}`} className="bg-red-500 text-white">
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
        <span key={`replace-${index}`} className="bg-green-500 text-white">
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
};

const isChecked = (state: CheckedState) => state !== false;

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
}: FindReplaceTableProps) {
  const allSelected =
    matchedSubtitles.length > 0 &&
    matchedSubtitles.every((subtitle) => selectedIds.has(subtitle.id));

  return (
    <Table
      containerClassName="max-h-[32rem] overflow-y-auto"
      className="w-full border-collapse text-base"
    >
      <TableHeader>
        <TableRow className="border-black">
          <TableHead className={`${STICKY_HEAD_CLASS} w-8 text-center`}>
            <Checkbox
              checked={allSelected}
              onCheckedChange={(state) => onToggleAll(isChecked(state))}
            />
          </TableHead>
          <TableHead className={`${STICKY_HEAD_CLASS} w-fit`}>
            {labels.id}
          </TableHead>
          <TableHead className={STICKY_HEAD_CLASS}>{labels.original}</TableHead>
          <TableHead className={STICKY_HEAD_CLASS}>{labels.preview}</TableHead>
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
              <TableRow
                key={subtitle.id}
                className="border-black hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <TableCell className="text-center">
                  <Checkbox
                    checked={selectedIds.has(subtitle.id)}
                    onCheckedChange={(state) =>
                      onToggleRow(subtitle.id, isChecked(state))
                    }
                  />
                </TableCell>
                <TableCell className="border-r border-black">
                  {subtitle.id}
                </TableCell>
                <TableCell className="whitespace-pre-wrap wrap-break-word">
                  {compiledRegex
                    ? renderMatchHighlights({
                        text: subtitle.text,
                        query: findText,
                        regex: compiledRegex,
                        allowZeroLength: allowZeroLengthMatches,
                      })
                    : subtitle.text}
                </TableCell>
                <TableCell className="whitespace-pre-wrap wrap-break-word">
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
            <TableCell colSpan={4} className="py-4 text-center text-gray-500">
              {labels.noMatches}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
