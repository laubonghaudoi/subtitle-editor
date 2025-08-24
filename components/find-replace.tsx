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
import { escapeRegExp } from "@/lib/utils";
import type { Subtitle } from "@/types/subtitle";
import { IconReplace, IconSearch } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function FindReplace() {
  const t = useTranslations();
  const { subtitles, replaceAllSubtitlesAction } = useSubtitleContext();

  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isMatchFullWord, setIsMatchFullWord] = useState(false);
  const [isRegexMode, setIsRegexMode] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [matchedSubtitles, setMatchedSubtitles] = useState<Subtitle[]>([]);
  const [selectedSubtitles, setSelectedSubtitles] = useState<Set<number>>(
    new Set()
  );

  const handleReplace = () => {
    const regexFlags = isCaseSensitive ? "g" : "gi";
    let findRegex: RegExp;
    try {
      if (isRegexMode) {
        findRegex = new RegExp(findText, regexFlags);
      } else if (isMatchFullWord) {
        findRegex = new RegExp(`\\b${escapeRegExp(findText)}\\b`, regexFlags);
      } else {
        findRegex = new RegExp(escapeRegExp(findText), regexFlags);
      }
    } catch (e) {
      // Handle invalid regex
      findRegex = /(?:)/; // Empty regex that won't match anything
    }

    // Capture current settings and selection into local constants
    const currentFindText = findText;
    const currentReplaceText = replaceText;
    const currentSelectedIds = new Set(selectedSubtitles);
    const currentIsCaseSensitive = isCaseSensitive;
    const currentIsMatchFullWord = isMatchFullWord;
    const currentIsRegexMode = isRegexMode;

    if (!currentFindText || currentSelectedIds.size === 0) return;

    // --- Refactored Replace Logic ---
    let changesMade = false;
    // No need for subtitlesToReplace variable anymore

    const newSubtitles = subtitles.map((subtitle) => {
      // Use subtitles from context
      // Check if this subtitle is selected
      if (currentSelectedIds.has(subtitle.id)) {
        // Use the captured selection
        // Create a *NEW* regex instance *INSIDE* the map function for this specific subtitle.
        const regexFlags = currentIsCaseSensitive ? "g" : "gi";
        let findRegexForThisSubtitle: RegExp | null = null;
        try {
          if (currentIsRegexMode) {
            findRegexForThisSubtitle = new RegExp(currentFindText, regexFlags);
          } else if (currentIsMatchFullWord) {
            findRegexForThisSubtitle = new RegExp(
              `\\b${escapeRegExp(currentFindText)}\\b`,
              regexFlags
            );
          } else {
            findRegexForThisSubtitle = new RegExp(
              escapeRegExp(currentFindText),
              regexFlags
            );
          }
        } catch (e) {
          console.error("Invalid regex during replace:", e);
          // Keep existing subtitle if regex is invalid
          return subtitle;
        }

        // Test and replace using THIS instance.
        // Need to check findRegexForThisSubtitle is not null
        if (findRegexForThisSubtitle.test(subtitle.text)) {
          // Reset lastIndex just before replace (belt-and-suspenders with new regex)
          findRegexForThisSubtitle.lastIndex = 0;
          const newText = subtitle.text.replace(
            findRegexForThisSubtitle,
            currentReplaceText
          );

          if (newText !== subtitle.text) {
            changesMade = true;
            return { ...subtitle, text: newText }; // Return updated subtitle
          }
        }
      }
      // Return unchanged subtitle if not selected, regex invalid, or no match found
      return subtitle;
    }); // End of map function

    // IMPORTANT: Only call the context action if changes were actually made
    // This prevents pushing identical state onto the undo stack
    if (changesMade) {
      replaceAllSubtitlesAction(newSubtitles); // Call context action
    }
    // --- End Refactored Replace Logic ---

    // Clear selection after initiating the state update
    setSelectedSubtitles(new Set());
  };

  const highlightMatches = (text: string, findRegex: RegExp) => {
    if (!findText) return text;

    const parts = text.split(findRegex);
    const highlighted = [];

    for (let i = 0; i < parts.length; i++) {
      highlighted.push(parts[i]);
      if (i < parts.length - 1) {
        const match = text.match(findRegex)?.[0];
        if (match) {
          highlighted.push(
            <span key={`match-${i}`} className="bg-red-500 text-white">
              {match}
            </span>
          );
        }
      }
    }

    return <>{highlighted}</>;
  };

  const highlightReplacements = (newText: string) => {
    if (!findText) return newText;

    const replacedParts = newText.split(replaceText);
    const highlighted = [];

    for (let i = 0; i < replacedParts.length; i++) {
      highlighted.push(replacedParts[i]);
      if (i < replacedParts.length - 1) {
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
    if (findText) {
      const regexFlags = isCaseSensitive ? "g" : "gi";
      let findRegex: RegExp;
      try {
        if (isRegexMode) {
          findRegex = new RegExp(findText, regexFlags);
        } else if (isMatchFullWord) {
          findRegex = new RegExp(`\\b${escapeRegExp(findText)}\\b`, regexFlags);
        } else {
          findRegex = new RegExp(escapeRegExp(findText), regexFlags);
        }
        // Filter by creating a fresh regex for each subtitle test
        setMatchedSubtitles(
          subtitles.filter((subtitle) => {
            // Recreate regex inside the filter callback for isolation
            const regexFlags = isCaseSensitive ? "g" : "gi";
            let testRegex: RegExp | null = null;
            try {
              if (isRegexMode) {
                testRegex = new RegExp(findText, regexFlags);
              } else if (isMatchFullWord) {
                testRegex = new RegExp(
                  `\\b${escapeRegExp(findText)}\\b`,
                  regexFlags
                );
              } else {
                testRegex = new RegExp(escapeRegExp(findText), regexFlags);
              }
              // Perform the test with the fresh regex
              return testRegex ? testRegex.test(subtitle.text) : false;
            } catch {
              return false; // Subtitle doesn't match if regex is invalid
            }
          })
        );
      } catch (e) {
        // This outer catch might be redundant now but kept for safety
        console.error("Error setting up regex for matching:", e);
        setMatchedSubtitles([]);
      }
    } else {
      setMatchedSubtitles([]);
      setSelectedSubtitles(new Set());
    }
    // Dependencies remain the same, the logic inside handles the changes
  }, [subtitles, findText, isCaseSensitive, isMatchFullWord, isRegexMode]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-black rounded-xs cursor-pointer"
        >
          <IconSearch />
          <span className="">{t("findReplace.title")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[48rem]">
        <DialogHeader>
          <DialogTitle>{t("findReplace.dialogTitle")}</DialogTitle>
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
                    // Create fresh regex for this specific row's rendering
                    let displayRegex: RegExp | null = null;
                    let newText = subtitle.text; // Default to original text
                    try {
                      const regexFlags = isCaseSensitive ? "g" : "gi";
                      if (isRegexMode) {
                        displayRegex = new RegExp(findText, regexFlags);
                      } else if (isMatchFullWord) {
                        displayRegex = new RegExp(
                          `\\b${escapeRegExp(findText)}\\b`,
                          regexFlags
                        );
                      } else {
                        displayRegex = new RegExp(
                          escapeRegExp(findText),
                          regexFlags
                        );
                      }
                      // Calculate replacement only if regex is valid
                      if (displayRegex) {
                        newText = subtitle.text.replace(
                          displayRegex,
                          replaceText
                        );
                      }
                    } catch {
                      displayRegex = null; // Ensure regex is null if invalid
                      newText = subtitle.text; // Show original text if regex invalid
                    }

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
                        <TableCell>
                          {/* Pass the potentially null, freshly created regex */}
                          {displayRegex
                            ? highlightMatches(subtitle.text, displayRegex)
                            : subtitle.text}
                        </TableCell>
                        <TableCell>
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
