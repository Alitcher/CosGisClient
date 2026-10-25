import { useTranslations } from "next-intl";
import AdSlot from "./AdSlot";

/** `page` names the page for the banner above the footer, so each page's slot
 *  can be sold on its own. Leave it out for no banner (e.g. the Donate page). */
export default function Footer({ page }: { page?: string }) {
  const t = useTranslations("Footer");
  return (
    <>
      {page && <AdSlot page={page} size="leaderboard" name="Above footer" />}
      <footer className="footer">
        <div className="shell">
          <div>{t("copyright")}</div>
          <div>{t("madeWith")}</div>
        </div>
      </footer>
    </>
  );
}
