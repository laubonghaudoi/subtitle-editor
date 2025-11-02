"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSubtitleContext } from "@/context/subtitle-context"; // Import context
import { getFindRegexConfig } from "@/lib/find-replace";
import {
  analyzeRegexSource,
  applyRegexReplacement,
  collectMatches,
} from "@/lib/find-replace-helpers";
import type { Subtitle } from "@/types/subtitle";
import { IconReplace, IconSearch } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, type ReactNode } from "react";

export default function FindReplace() {
  const t = useTranslations();
  const { subtitles, replaceAllSubtitlesAction, tracks } = useSubtitleContext();
  const totalSubtitleCount = tracks.reduce(
    (sum, tr) => sum + tr.subtitles.length,
    0,
  );
  const isDisabled = totalSubtitleCount === 0;

  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isMatchFullWord, setIsMatchFullWord] = useState(false);
  const [isRegexMode, setIsRegexMode] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const regexConfig = useMemo(
    () =>
      getFindRegexConfig(findText, {
        isCaseSensitive,
        isMatchFullWord,
        isRegexMode,
      }),
    [findText, isCaseSensitive, isMatchFullWord, isRegexMode],
  );

  const compiledRegex = useMemo(() => {
    if (!regexConfig) {
      return null;
    }
    try {
      return new RegExp(regexConfig.source, regexConfig.flags);
    } catch {
      return null;
    }
  }, [regexConfig]);

  const regexFeatures = useMemo(
    () => (compiledRegex ? analyzeRegexSource(compiledRegex) : null),
    [compiledRegex],
  );
  const allowZeroLengthMatches = regexFeatures?.allowZeroLength ?? false;

  const [matchedSubtitles, setMatchedSubtitles] = useState<Subtitle[]>([]);
  const [selectedSubtitles, setSelectedSubtitles] = useState<Set<number>>(
    new Set(),
  );
  const stickyHeadClass = "sticky top-0 z-20 bg-gray-200 text-black";

  const handleReplace = () => {
    const currentSelection = new Set(selectedSubtitles);

    if (currentSelection.size === 0 || !compiledRegex) {
      return;
    }

    let changesMade = false;

    const updatedSubtitles = subtitles.map((subtitle) => {
      if (!currentSelection.has(subtitle.id)) {
        return subtitle;
      }

      const { result, changed } = applyRegexReplacement(
        subtitle.text,
        compiledRegex,
        replaceText,
        allowZeroLengthMatches,
      );

      if (changed) {
        changesMade = true;
        return { ...subtitle, text: result };
      }

      return subtitle;
    });

    if (changesMade) {
      replaceAllSubtitlesAction(updatedSubtitles);
    }

    setSelectedSubtitles(new Set());
  };

  const highlightMatches = (
    text: string,
    findRegex: RegExp,
    allowZeroLength: boolean,
  ) => {
    if (!findText) return text;

    const matches = collectMatches(text, findRegex, allowZeroLength).filter(
      (match) => match[0].length > 0,
    );

    if (matches.length === 0) {
      return text;
    }

    const highlighted: ReactNode[] = [];
    let cursor = 0;

    matches.forEach((match, index) => {
      const start = match.index ?? 0;
      const end = start + match[0].length;

      if (start > cursor) {
        highlighted.push(text.slice(cursor, start));
      }

      highlighted.push(
        <span key={`match-${start}-${index}`} className="bg-red-500 text-white">
          {text.slice(start, end)}
        </span>,
      );

      cursor = end;
    });

    if (cursor < text.length) {
      highlighted.push(text.slice(cursor));
    }

    return <>{highlighted}</>;
  };

  const highlightReplacements = (newText: string) => {
    if (!findText || replaceText.length === 0) return newText;

    const parts = newText.split(replaceText);
    if (parts.length === 1) {
      return newText;
    }

    const highlighted: ReactNode[] = [];

    for (let i = 0; i < parts.length; i++) {
      highlighted.push(<span key={`segment-${i}`}>{parts[i]}</span>);
      if (i < parts.length - 1) {
        highlighted.push(
          <span key={`replace-${i}`} className="bg-green-500 text-white">
            {replaceText}
          </span>,
        );
      }
    }

    return <>{highlighted}</>;
  };

  useEffect(() => {
    if (!findText) {
      setMatchedSubtitles([]);
      setSelectedSubtitles(new Set());
      return;
    }

    if (!compiledRegex) {
      setMatchedSubtitles([]);
      return;
    }

    setMatchedSubtitles(
      subtitles.filter((subtitle) => {
        const matches = collectMatches(
          subtitle.text,
          compiledRegex,
          allowZeroLengthMatches,
        );
        return matches.length > 0;
      }),
    );
  }, [subtitles, findText, compiledRegex, allowZeroLengthMatches]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-black rounded-xs cursor-pointer"
          disabled={isDisabled}
        >
          <IconSearch />
          <span className="">{t("findReplace.title")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("findReplace.dialogTitle")}</DialogTitle>
          <DialogDescription>{t("findReplace.scopeNote")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="find">{t("findReplace.find")}</Label>
            <Input
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              className="flex-1 px-2 py-1 rounded-xs text-base"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={isCaseSensitive}
                onCheckedChange={(checked) => {
                  // Handle the CheckedState and update isCaseSensitive
                  if (checked === "indeterminate") {
                    setIsCaseSensitive(true); // Or false, depending on how you want to handle indeterminate
                  } else {
                    setIsCaseSensitive(checked);
                  }
                }}
              />
              <label
                htmlFor="case-sensitive"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("findReplace.caseSensitive")}
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={isMatchFullWord}
                onCheckedChange={(checked) => {
                  // Handle the CheckedState and update isCaseSensitive
                  if (checked === "indeterminate") {
                    setIsMatchFullWord(true); // Or false, depending on how you want to handle indeterminate
                  } else {
                    setIsMatchFullWord(checked);
                  }
                }}
              />
              <label
                htmlFor="match-full-word"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("findReplace.matchFullWord")}
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={isRegexMode}
                onCheckedChange={(checked) => {
                  if (checked === "indeterminate") {
                    setIsRegexMode(true);
                  } else {
                    setIsRegexMode(checked);
                  }
                }}
              />
              <label
                htmlFor="regex-mode"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("findReplace.useRegex")}
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="replace">{t("findReplace.replaceWith")}</Label>
            <Input
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              className="flex-1 px-2 py-1 rounded-xs text-base"
            />
          </div>
          <div className="text-sm text-gray-500 flex items-center justify-between">
            <span>
              {selectedSubtitles.size} / {matchedSubtitles.length}{" "}
              {t("findReplace.selected")}{" "}
            </span>
            <Button
              className="rounded-sm bg-slate-800 hover:bg-slate-600"
              onClick={handleReplace}
              disabled={selectedSubtitles.size === 0} // Disable if nothing is selected
            >
              <IconReplace />
              {t("findReplace.replace")}
            </Button>
          </div>
          <Table
            containerClassName="max-h-[32rem] overflow-y-auto"
            className="w-full border-collapse text-base"
          >
            <TableHeader className="[&>tr]:bg-gray-200">
              <TableRow className="border-black">
                <TableHead className={`${stickyHeadClass} w-8 text-center`}>
                  <Checkbox
                    checked={
                      matchedSubtitles.length > 0 &&
                      matchedSubtitles.every((sub) =>
                        selectedSubtitles.has(sub.id),
                      )
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedSubtitles(
                          new Set(matchedSubtitles.map((sub) => sub.id)),
                        );
                      } else {
                        setSelectedSubtitles(new Set());
                      }
                    }}
                  />
                </TableHead>
                <TableHead className={`${stickyHeadClass} w-fit`}>
                  {t("findReplace.id")}
                </TableHead>
                <TableHead className={stickyHeadClass}>
                  {t("findReplace.original")}
                </TableHead>
                <TableHead className={stickyHeadClass}>
                  {t("findReplace.preview")}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {matchedSubtitles.length > 0 ? (
                matchedSubtitles.map((subtitle) => {
                  const preview = compiledRegex
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
                      className="hover:bg-gray-100 border-black"
                    >
                      <TableCell className="text-center">
                        <Checkbox
                          checked={selectedSubtitles.has(subtitle.id)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedSubtitles);
                            if (checked) {
                              newSelected.add(subtitle.id);
                            } else {
                              newSelected.delete(subtitle.id);
                            }
                            setSelectedSubtitles(newSelected);
                          }}
                        />
                      </TableCell>
                      <TableCell className="border-r border-black">
                        {subtitle.id}
                      </TableCell>
                      <TableCell className="whitespace-pre-wrap wrap-break-word">
                        {compiledRegex
                          ? highlightMatches(
                              subtitle.text,
                              compiledRegex,
                              allowZeroLengthMatches,
                            )
                          : subtitle.text}
                      </TableCell>
                      <TableCell className="whitespace-pre-wrap wrap-break-word">
                        {
                          compiledRegex
                            ? highlightReplacements(preview)
                            : preview /* Show calculated newText or original if regex invalid */
                        }
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-gray-500 py-4"
                  >
                    {t("findReplace.noMatches")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DialogFooter></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
