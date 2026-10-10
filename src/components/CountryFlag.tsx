"use client";

import { useLocale } from "next-intl";
import { countryLabel } from "@/lib/cities";
import type { Country } from "@/types";

/*
 * Small drawn flags (inline SVG, not emoji: Windows shows flag emoji as letters).
 * Shapes are simplified to one 22x16 box; colours are the official ones.
 */
const W = 22, H = 16;

/** Nordic cross: background, cross colour, optional thinner inner cross. Cross centre at x=8. */
function Cross({ bg, cross, inner }: { bg: string; cross: string; inner?: string }) {
  return (
    <>
      <rect width={W} height={H} fill={bg} />
      <rect x={6} width={4} height={H} fill={cross} />
      <rect y={6} width={W} height={4} fill={cross} />
      {inner && <rect x={7} width={2} height={H} fill={inner} />}
      {inner && <rect y={7} width={W} height={2} fill={inner} />}
    </>
  );
}

/** Three horizontal bands, top to bottom; `weights` sets their relative heights. */
function Bands({ colors, weights = [1, 1, 1] }: { colors: string[]; weights?: number[] }) {
  const total = weights.reduce((a, b) => a + b, 0);
  const height = (i: number) => (weights[i]! / total) * H;
  const top = (i: number) => weights.slice(0, i).reduce((a, b) => a + b, 0) / total * H;
  return (
    <>
      {colors.map((c, i) => <rect key={c + i} y={top(i)} width={W} height={height(i)} fill={c} />)}
    </>
  );
}

const FLAGS: Record<Country, React.ReactNode> = {
  FI: <Cross bg="#ffffff" cross="#002f6c" />,
  SE: <Cross bg="#006aa7" cross="#fecc00" />,
  NO: <Cross bg="#ba0c2f" cross="#ffffff" inner="#00205b" />,
  DK: <Cross bg="#c8102e" cross="#ffffff" />,
  IS: <Cross bg="#02529c" cross="#ffffff" inner="#dc1e35" />,
  AX: <Cross bg="#0064ae" cross="#ffd300" inner="#da0e15" />,
  FO: <Cross bg="#ffffff" cross="#0065bd" inner="#ed2939" />,
  EE: <Bands colors={["#0072ce", "#000000", "#ffffff"]} />,
  LV: <Bands colors={["#9e3039", "#ffffff", "#9e3039"]} weights={[2, 1, 2]} />,
  LT: <Bands colors={["#fdb913", "#006a44", "#c1272d"]} />,
  GL: (
    <>
      <rect width={W} height={H / 2} fill="#ffffff" />
      <rect y={H / 2} width={W} height={H / 2} fill="#d00c33" />
      <path d="M2.7 8 A5.3 5.3 0 0 1 13.3 8 Z" fill="#d00c33" />
      <path d="M2.7 8 A5.3 5.3 0 0 0 13.3 8 Z" fill="#ffffff" />
    </>
  ),
};

/** A country's flag, sized for a text line. Hover shows the country name. */
export default function CountryFlag({ country, height = 13 }: { country: Country; height?: number }) {
  const locale = useLocale();
  const name = countryLabel(country, locale);
  return (
    <svg className="flag" viewBox={`0 0 ${W} ${H}`} height={height} width={(height * W) / H} role="img" aria-label={name}>
      <title>{name}</title>
      {FLAGS[country]}
    </svg>
  );
}
