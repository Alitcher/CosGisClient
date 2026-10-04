import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware versions of next/link and next/navigation. Use these instead of the
// Next.js ones so links keep the visitor's language (/fi/map stays in Finnish).
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
