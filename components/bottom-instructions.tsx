"use client";

import { IconKeyboard } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

export default function BottomInstructions() {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-2 items-start h-full text-gray-600 px-8 py-4 border-t-2 border-black">
      <div className="text-lg text-gray-600 p-2">
        <p className="">{t("instructions.afterLoading")}</p>
        <ul className="list-disc list-inside my-2">
          <li>{t("instructions.editText")}</li>
          <li>{t("instructions.icons")}</li>
          <li>{t("instructions.dragBorders")}</li>
          <li>{t("instructions.rememberSave")}</li>
        </ul>
      </div>
      <div className="p-2">
        <h2 className="text-lg inline-flex items-center">
          <IconKeyboard className="mr-2" />
          {t("shortcuts.title")}
        </h2>
        <ul className="list-disc list-inside px-2">
          <li>
            <kbd>space</kbd> {t("shortcuts.space")}
          </li>
          <li>
            <kbd>tab</kbd> {t("shortcuts.tab")}
          </li>
          <li>
            <kbd>↑</kbd> {t("shortcuts.arrows")} <kbd>↓</kbd>{" "}
            {t("shortcuts.arrowsAction")}
          </li>
          <li>
            <kbd>shift</kbd> + <kbd>enter</kbd> {t("shortcuts.splitSubtitle")}
          </li>
          <li>
            <kbd>shift</kbd> + <kbd>backspace</kbd>{" "}
            {t("shortcuts.mergeSubtitle")}
          </li>
          <li>
            <kbd>alt</kbd> + <kbd>1</kbd>–<kbd>4</kbd>{" "}
            {t("shortcuts.switchTrack")}
          </li>
          <li>
            <kbd>ctrl</kbd> + <kbd>z</kbd> (Windows) {t("labels.or")}{" "}
            <kbd>&#8984;</kbd> + <kbd>z</kbd> (Mac) {t("shortcuts.undoRedo")}{" "}
            <kbd>ctrl</kbd> + <kbd>shift</kbd> + <kbd>z</kbd> (Windows){" "}
            {t("labels.or")} <kbd>&#8984;</kbd> + <kbd>shift</kbd> +{" "}
            <kbd>z</kbd> (Mac) {t("shortcuts.undoRedoAction")}
          </li>
        </ul>
      </div>
    </div>
  );
}
