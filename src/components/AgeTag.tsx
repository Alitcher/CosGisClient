"use client";

import { useTranslations } from "next-intl";
import { ageLabel } from "@/lib/age";

/** Suggested ages as a small tag, e.g. "Ages 7-17". No age set = "All ages". */
export default function AgeTag({ item }: { item: { ageMin?: number | null; ageMax?: number | null } }) {
  const t = useTranslations("Age");
  return <span className="age-tag" title={t("title")}>{ageLabel(item, t)}</span>;
}
