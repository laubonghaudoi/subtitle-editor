import ResponsiveEditorEntry from "@/components/editor/responsive-editor-entry";
import { EDITOR_MIN_WIDTH_PX } from "@/components/editor/viewport";
import { getTranslations } from "next-intl/server";

export default async function Home() {
  const narrowScreen = await getTranslations("narrowScreen");
  const navigation = await getTranslations("navigation");

  return (
    <ResponsiveEditorEntry
      loadingLabel={narrowScreen("loading")}
      narrowScreenNotice={{
        eyebrow: navigation("title"),
        title: narrowScreen("title"),
        description: narrowScreen("description"),
        minimum: narrowScreen("minimum", { width: EDITOR_MIN_WIDTH_PX }),
        faqHref: "/faq",
        faqLabel: navigation("faq"),
        proceedLabel: narrowScreen("proceed"),
      }}
    />
  );
}
