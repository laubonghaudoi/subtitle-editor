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
import {
  createFindRegexFromConfig,
  getFindRegexConfig,
} from "@/lib/find-replace";
import type { Subtitle } from "@/types/subtitle";
import { IconReplace, IconSearch } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, type ReactNode } from "react";

export default function FindReplace() {
  const t = useTranslations();
  const { subtitles, replaceAllSubtitlesAction, tracks } = useSubtitleContext();
  const totalSubtitleCount = tracks.reduce(
    (sum, tr) => sum + tr.subtitles.length,
    0
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
    [findText, isCaseSensitive, isMatchFullWord, isRegexMode]
  );

  const [matchedSubtitles, setMatchedSubtitles] = useState<Subtitle[]>([]);
  const [selectedSubtitles, setSelectedSubtitles] = useState<Set<number>>(
    new Set()
  );

  const handleReplace = () => {
    const currentSelection = new Set(selectedSubtitles);

    if (currentSelection.size === 0 || !regexConfig) {
      return;
    }

    let changesMade = false;

    const updatedSubtitles = subtitles.map((subtitle) => {
      if (!currentSelection.has(subtitle.id)) {
        return subtitle;
      }

      const replaceRegex = createFindRegexFromConfig(regexConfig);
      if (!replaceRegex) {
        return subtitle;
      }

      replaceRegex.lastIndex = 0;
      const nextText = subtitle.text.replace(replaceRegex, replaceText);

      if (nextText !== subtitle.text) {
        changesMade = true;
        return { ...subtitle, text: nextText };
      }

      return subtitle;
    });

    if (changesMade) {
      replaceAllSubtitlesAction(updatedSubtitles);
    }

    setSelectedSubtitles(new Set());
  };

  const highlightMatches = (text: string, findRegex: RegExp) => {
    if (!findText) return text;

    const flags = findRegex.flags.includes("g")
      ? findRegex.flags
      : `${findRegex.flags}g`;
    const globalRegex = new RegExp(findRegex.source, flags);
    const matches = Array.from(text.matchAll(globalRegex));

    if (matches.length === 0) {
      return text;
    }

    const highlighted: ReactNode[] = [];
    let lastIndex = 0;

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const matchText = match[0];
      const start = match.index ?? 0;

      if (!matchText) {
        return text;
      }

      if (start > lastIndex) {
        highlighted.push(text.slice(lastIndex, start));
      }

      highlighted.push(
        <span key={`match-${start}-${i}`} className="bg-red-500 text-white">
          {matchText}
        </span>
      );

      lastIndex = start + matchText.length;
    }

    if (lastIndex < text.length) {
      highlighted.push(text.slice(lastIndex));
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
      highlighted.push(
        <span key={`segment-${i}`}>{parts[i]}</span>
      );
      if (i < parts.length - 1) {
        highlighted.push(
          <span key={`replace-${i}`} className="bg-green-500 text-white">
            {replaceText}
          </span>
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

    if (!regexConfig) {
      setMatchedSubtitles([]);
      return;
    }

    setMatchedSubtitles(
      subtitles.filter((subtitle) => {
        const testRegex = createFindRegexFromConfig(regexConfig);
        return testRegex ? testRegex.test(subtitle.text) : false;
      })
    );
  }, [subtitles, findText, regexConfig]);

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
      <DialogContent className="sm:max-w-[48rem]">
        <DialogHeader>
          <DialogTitle>{t("findReplace.dialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("findReplace.scopeNote")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="find">{t("findReplace.find")}</Label>
            <Input
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              className="flex-1"
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
              className="flex-1"
            />
          </div>
          <div className="text-sm text-gray-500">
            {selectedSubtitles.size} / {matchedSubtitles.length}{" "}
            {t("findReplace.selected")}
          </div>
          <div className="w-full max-h-[32rem] overflow-y-auto">
            <Table className="w-full border-collapse ">
              <TableHeader className="bg-gray-200 sticky top-0">
                <TableRow className="border-black">
                  <TableHead className="sticky top-0 w-8 text-center text-black">
                    <Checkbox
                      checked={
                        matchedSubtitles.length > 0 &&
                        matchedSubtitles.every((sub) =>
                          selectedSubtitles.has(sub.id)
                        )
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSubtitles(
                            new Set(matchedSubtitles.map((sub) => sub.id))
                          );
                        } else {
                          setSelectedSubtitles(new Set());
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="sticky top-0 text-black w-fit">
                    {t("findReplace.id")}
                  </TableHead>
                  <TableHead className="sticky top-0 text-black">
                    {t("findReplace.original")}
                  </TableHead>
                  <TableHead className="sticky top-0 text-black">
                    {t("findReplace.preview")}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {matchedSubtitles.length > 0 ? (
                  matchedSubtitles.map((subtitle) => {
                    const displayRegex = createFindRegexFromConfig(regexConfig);
                    const replaceRegex = createFindRegexFromConfig(regexConfig);
                    const newText = replaceRegex
                      ? subtitle.text.replace(replaceRegex, replaceText)
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
                        <TableCell className="border-r-1 border-black">
                          {subtitle.id}
                        </TableCell>
                        <TableCell className="whitespace-pre-wrap break-words">
                          {/* Pass the potentially null, freshly created regex */}
                          {displayRegex
                            ? highlightMatches(subtitle.text, displayRegex)
                            : subtitle.text}
                        </TableCell>
                        <TableCell className="whitespace-pre-wrap break-words">
                          {/* Pass the potentially null, freshly created regex */}
                          {
                            displayRegex
                              ? highlightReplacements(newText)
                              : newText /* Show calculated newText or original if regex invalid */
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
        </div>
        <DialogFooter>
          <Button
            className="cursor-pointer"
            onClick={handleReplace}
            disabled={selectedSubtitles.size === 0} // Disable if nothing is selected
          >
            <IconReplace />
            {t("findReplace.replace")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
