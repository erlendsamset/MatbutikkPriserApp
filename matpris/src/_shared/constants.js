/*
 * constants.js — Sentrale konstanter
 *
 * STORES: definisjon av alle støttede butikkjeder med visningsnavn og farger.
 *   Nøklene (f.eks. "rema", "kiwi") brukes som butikk-ID i databasen.
 *
 * COLORS: appens fargepalett. Importeres av alle komponenter som trenger farger,
 *   slik at designet er konsistent og enkelt å endre ett sted.
 */

export const STORES = {
  rema:       { name: "Rema 1000",  color: "#0060A9", bg: "#E8F1F8" },
  kiwi:       { name: "Kiwi",       color: "#6B9B1E", bg: "#EFF5E5" },
  coop_prix:  { name: "Coop Prix",  color: "#0060A9", bg: "#fee987cc" },
  coop_extra: { name: "Coop Extra", color: "#E2001A", bg: "#FDEBEE" },
  coop_mega:  { name: "Coop Mega",  color: "#007A3D", bg: "#E5F2EB" },
  meny:       { name: "Meny",       color: "#C8102E", bg: "#FAE9EC" },
  bunnpris:   { name: "Bunnpris",   color: "#F7941E", bg: "#FEF3E3" },
  joker:      { name: "Joker",      color: "#1B3668", bg: "#E8ECF3" },
  spar:       { name: "Spar",       color: "#007A3D", bg: "#E5F2EB" },
};

export const COLORS = {
  bg:            "#FAFBF7",
  card:          "#FFFFFF",
  text:          "#1A2E1D",
  textSecondary: "#5A6350",
  textMuted:     "#9CA38B",
  border:        "#EFF1EA",
  borderDark:    "#E2E6DA",
  accent:        "#1A4023",
  accentLight:   "#EFF5E5",
  success:       "#6B9B1E",
  danger:        "#C0392B",
};
