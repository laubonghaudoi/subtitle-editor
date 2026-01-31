import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

interface SubtitleListEmptyProps {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onStartFromScratch: () => void;
}

export default function SubtitleListEmpty({
  onFileSelect,
  onStartFromScratch,
}: SubtitleListEmptyProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground rounded-sm">
      <Label className="cursor-pointer text-xl hover:text-blue-800 underline">
        <span>{t("labels.loadSrtFile")}</span>
        <Input
          type="file"
          className="hidden"
          accept=".srt,.vtt"
          onChange={onFileSelect}
        />
      </Label>
      <p className="text-xl my-4">{t("labels.or")}</p>
      <Button
        variant="link"
        onClick={onStartFromScratch}
        className="cursor-pointer text-xl text-muted-foreground underline hover:text-blue-800"
      >
        {t("labels.startFromScratch")}
      </Button>
    </div>
  );
}
