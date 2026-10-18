"use client";

import { useLocale, useTranslations } from "next-intl";
import { repeatLabel } from "@/lib/recurrence";
import type { Event } from "@/types";
import Icon from "./Icon";

/** How a community meetup repeats, e.g. "Every Saturday". Nothing for events that don't repeat. */
export default function RepeatTag({ event }: { event: Pick<Event, "date" | "recurrence"> }) {
  const t = useTranslations("Repeat");
  const locale = useLocale();
  const label = repeatLabel(event, t, locale);
  if (!label) return null;
  return <span className="repeat-tag" title={event.recurrence?.note}><Icon name="repeat" size={14} />{label}</span>;
}
