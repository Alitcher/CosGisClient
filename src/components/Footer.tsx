import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("Footer");
  return (
    <footer className="footer">
      <div className="shell">
        <div>{t("copyright")}</div>
        <div>{t("madeWith")}</div>
      </div>
    </footer>
  );
}
