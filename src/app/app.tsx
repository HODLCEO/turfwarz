"use client";

import React, { useEffect, useMemo, useState } from "react";

// Publicly available fonts via Google Fonts (no bundling required)
const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Orbitron:wght@600;700;800;900&family=Space+Grotesk:wght@400;600;700&display=swap');

:root {
  --twz-bg: #05050a;
  --twz-panel: rgba(255,255,255,0.04);
  --twz-panel2: rgba(255,255,255,0.06);
  --twz-border: rgba(255,255,255,0.10);
  --twz-text: rgba(255,255,255,0.92);
  --twz-muted: rgba(255,255,255,0.45);
}

* { -webkit-tap-highlight-color: transparent; }
`;

const FACTIONS = {
  base: { id: "base", name: "Base", color: "#0052FF", colorLight: "#3373FF", colorDark: "#0041CC" },
  hyperliquid: { id: "hyperliquid", name: "Hyperliquid", color: "#3FEDC0", colorLight: "#6FF2D0", colorDark: "#2BC9A0" },
  monad: { id: "monad", name: "Monad", color: "#836EF9", colorLight: "#9D8BFA", colorDark: "#6B56E0" },
};

const TERRITORIES = [
  // MONAD - NORTH
  { id: 1, name: "The Rooftop", startingOwner: "monad", vibe: "Top of the world", cx: 50, cy: 12 },
  { id: 2, name: "Mural Wall", startingOwner: "monad", vibe: "Art district", cx: 22, cy: 28 },
  { id: 3, name: "The Plaza", startingOwner: "monad", vibe: "Public square", cx: 58, cy: 30 },
  { id: 4, name: "Warehouse", startingOwner: "monad", vibe: "Big moves only", cx: 82, cy: 22 },

  // BASE - WEST/SOUTHWEST
  { id: 5, name: "The Block", startingOwner: "base", vibe: "Home turf", cx: 12, cy: 48 },
  { id: 6, name: "The Corner", startingOwner: "base", vibe: "Where deals go down", cx: 18, cy: 72 },
  { id: 7, name: "The Courts", startingOwner: "base", vibe: "Ball is life", cx: 32, cy: 85 },
  { id: 8, name: "The Alley", startingOwner: "base", vibe: "Shortcut central", cx: 28, cy: 58 },

  // HYPERLIQUID - EAST/SOUTHEAST
  { id: 9, name: "Skate Park", startingOwner: "hyperliquid", vibe: "Grind territory", cx: 88, cy: 45 },
  { id: 10, name: "The Bodega", startingOwner: "hyperliquid", vibe: "Open 24/7", cx: 85, cy: 68 },
  { id: 11, name: "The Garage", startingOwner: "hyperliquid", vibe: "Where builds happen", cx: 72, cy: 82 },
  { id: 12, name: "The Bridge", startingOwner: "hyperliquid", vibe: "Connecting zones", cx: 75, cy: 55 },

  // CENTER - 3 NEUTRAL
  { id: 13, name: "North Central", startingOwner: null, vibe: "The northern crossroads", cx: 50, cy: 45 },
  { id: 14, name: "West Central", startingOwner: null, vibe: "Western gateway", cx: 38, cy: 68 },
  { id: 15, name: "East Central", startingOwner: null, vibe: "Eastern gateway", cx: 62, cy: 68 },
];

const initTerritories = () =>
  TERRITORIES.map((t) => ({
    ...t,
    currentOwner: t.startingOwner,
    control: {
      base: t.startingOwner === "base" ? 100 : t.startingOwner === null ? 33.33 : 0,
      hyperliquid: t.startingOwner === "hyperliquid" ? 100 : t.startingOwner === null ? 33.33 : 0,
      monad: t.startingOwner === "monad" ? 100 : t.startingOwner === null ? 33.34 : 0,
    },
    transactions: {
      base: t.startingOwner === "base" ? 10 : t.startingOwner === null ? 1 : 0,
      hyperliquid: t.startingOwner === "hyperliquid" ? 10 : t.startingOwner === null ? 1 : 0,
      monad: t.startingOwner === "monad" ? 10 : t.startingOwner === null ? 1 : 0,
    },
    isContested: t.startingOwner === null,
  }));

// View Toggle
const ViewToggle = ({ view, onToggle }: { view: "grid" | "map"; onToggle: (v: "grid" | "map") => void }) => (
  <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "3px", gap: "2px" }}>
    <button
      onClick={() => onToggle("grid")}
      style={{
        padding: "6px 12px",
        borderRadius: "6px",
        border: "none",
        fontSize: "10px",
        fontWeight: "700",
        cursor: "pointer",
        background: view === "grid" ? "rgba(255,255,255,0.15)" : "transparent",
        color: view === "grid" ? "#fff" : "#666",
        fontFamily: "Space Grotesk, Inter, system-ui, sans-serif",
      }}
    >
      📊 Grid
    </button>
    <button
      onClick={() => onToggle("map")}
      style={{
        padding: "6px 12px",
        borderRadius: "6px",
        border: "none",
        fontSize: "10px",
        fontWeight: "700",
        cursor: "pointer",
        background: view === "map" ? "rgba(255,255,255,0.15)" : "transparent",
        color: view === "map" ? "#fff" : "#666",
        fontFamily: "Space Grotesk, Inter, system-ui, sans-serif",
      }}
    >
      🗺️ Map
    </button>
  </div>
);

// Cyber Neon City Map View (playable district in the center)
const CyberCityMapView = ({
  territories,
  selectedTerritoryId,
  onSelectTerritoryId,
}: {
  territories: any[];
  selectedTerritoryId: number | null;
  onSelectTerritoryId: (id: number | null) => void;
}) => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [pressedId, setPressedId] = useState<number | null>(null);

  const DISTRICT = useMemo(() => ({ x: 20, y: 20, w: 60, h: 60, r: 10 }), []);

  const selectedTerritory = useMemo(
    () => territories.find((t) => t.id === selectedTerritoryId) || null,
    [territories, selectedTerritoryId]
  );

  const shouldShowLabel = (id: number) => id === selectedTerritoryId || id === hoveredId;

  const toDistrict = (t: any) => {
    // tighter playfield
    const inset = 6;
    const w = Math.max(1, DISTRICT.w - inset * 2);
    const h = Math.max(1, DISTRICT.h - inset * 2);
    return {
      x: DISTRICT.x + inset + (t.cx / 100) * w,
      y: DISTRICT.y + inset + (t.cy / 100) * h,
    };
  };

  // Deterministic pseudo-random for city dressing
  const hash01 = (x: number, y: number) => {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };

  const buildings = useMemo(() => {
    const out: any[] = [];
    const step = 4;
    for (let gy = 2; gy < 98; gy += step) {
      for (let gx = 2; gx < 98; gx += step) {
        const insideDistrict =
          gx > DISTRICT.x - 2 &&
          gx < DISTRICT.x + DISTRICT.w + 2 &&
          gy > DISTRICT.y - 2 &&
          gy < DISTRICT.y + DISTRICT.h + 2;
        if (insideDistrict) continue;

        const r = hash01(gx, gy);
        if (r < 0.18) continue;

        const w = 2.0 + hash01(gx + 1, gy) * 2.6;
        const h = 2.0 + hash01(gx, gy + 1) * 3.2;
        const rx = 0.6 + hash01(gx + 2, gy + 2) * 0.9;

        const neon = hash01(gx + 9, gy + 9) > 0.72;
        const neonHue = hash01(gx + 7, gy + 11) > 0.5 ? "#38BDF8" : "#A78BFA";

        out.push({
          x: gx + (hash01(gx + 3, gy + 3) - 0.5) * 1.2,
          y: gy + (hash01(gx + 4, gy + 4) - 0.5) * 1.2,
          w,
          h,
          rx,
          o: 0.07 + r * 0.14,
          neon,
          neonHue,
        });
      }
    }
    return out;
  }, [DISTRICT]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1",
        borderRadius: "14px",
        overflow: "hidden",
        background: "#070711",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 10px 35px rgba(0,0,0,0.55)",
      }}
    >
      <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", touchAction: "none" }}>
        <defs>
          <pattern id="cityGrid" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M 6 0 L 0 0 0 6" fill="none" stroke="#121225" strokeWidth="0.35" />
          </pattern>

          <pattern id="districtGrid" width="4" height="4" patternUnits="userSpaceOnUse">
            <path d="M 4 0 L 0 0 0 4" fill="none" stroke="#1e1e3a" strokeWidth="0.25" />
          </pattern>

          <pattern id="scanlines" width="2" height="2" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="2" height="1" fill="rgba(255,255,255,0.02)" />
            <rect x="0" y="1" width="2" height="1" fill="rgba(0,0,0,0)" />
          </pattern>

          <filter id="noise" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.18 0" />
          </filter>

          <filter id="neonGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="textShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0.6" stdDeviation="0.7" floodColor="#000" floodOpacity="0.95" />
          </filter>

          <filter id="markerBloom" x="-70%" y="-70%" width="240%" height="240%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.3" floodColor="#ffffff" floodOpacity="0.22" />
          </filter>

          <clipPath id="districtClip">
            <rect x={DISTRICT.x} y={DISTRICT.y} width={DISTRICT.w} height={DISTRICT.h} rx={DISTRICT.r} />
          </clipPath>

          {/* Ambient faction lighting */}
          <radialGradient id="ambientMonad" cx="50%" cy="0%" r="85%">
            <stop offset="0%" stopColor={FACTIONS.monad.color} stopOpacity="0.34" />
            <stop offset="60%" stopColor={FACTIONS.monad.color} stopOpacity="0.14" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ambientBase" cx="0%" cy="100%" r="95%">
            <stop offset="0%" stopColor={FACTIONS.base.color} stopOpacity="0.30" />
            <stop offset="65%" stopColor={FACTIONS.base.color} stopOpacity="0.12" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ambientHyper" cx="100%" cy="100%" r="95%">
            <stop offset="0%" stopColor={FACTIONS.hyperliquid.color} stopOpacity="0.30" />
            <stop offset="65%" stopColor={FACTIONS.hyperliquid.color} stopOpacity="0.12" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>

          {/* Territory influence gradients as neon spill */}
          {territories.map((t) => {
            const owner = t.currentOwner ? (FACTIONS as any)[t.currentOwner] : null;
            const dominance = t.currentOwner ? t.control[t.currentOwner] / 100 : 0;

            if (!t.currentOwner) {
              return (
                <radialGradient key={`grad-${t.id}`} id={`territoryGrad-${t.id}`} cx="50%" cy="50%" r="100%">
                  <stop offset="0%" stopColor="#a3a3a3" stopOpacity={0.26} />
                  <stop offset="55%" stopColor="#6b6b6b" stopOpacity={0.10} />
                  <stop offset="100%" stopColor="#2b2b2b" stopOpacity={0} />
                </radialGradient>
              );
            }

            return (
              <radialGradient key={`grad-${t.id}`} id={`territoryGrad-${t.id}`} cx="50%" cy="50%" r="100%">
                <stop offset="0%" stopColor={owner?.color || "#666"} stopOpacity={0.70 * dominance} />
                <stop offset="45%" stopColor={owner?.color || "#444"} stopOpacity={0.22 * dominance} />
                <stop offset="100%" stopColor={owner?.color || "#222"} stopOpacity={0} />
              </radialGradient>
            );
          })}

          <linearGradient id="labelBg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,0,0,0.78)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.40)" />
          </linearGradient>

          <linearGradient id="districtStroke" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(56,189,248,0.95)" />
            <stop offset="50%" stopColor="rgba(167,139,250,0.95)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0.95)" />
          </linearGradient>
        </defs>

        {/* Base background */}
        <rect width="100" height="100" fill="#05050a" />
        <rect width="100" height="100" fill="url(#cityGrid)" />

        {/* Ambient faction lighting */}
        <rect width="100" height="100" fill="url(#ambientMonad)" style={{ mixBlendMode: "screen" }} />
        <rect width="100" height="100" fill="url(#ambientBase)" style={{ mixBlendMode: "screen" }} />
        <rect width="100" height="100" fill="url(#ambientHyper)" style={{ mixBlendMode: "screen" }} />

        {/* Buildings (outside district) — visual only */}
        {buildings.map((b, i) => (
          <g key={i} pointerEvents="none">
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={b.rx} fill="rgba(255,255,255,0.10)" opacity={b.o} />
            {b.neon && (
              <rect
                x={b.x + 0.2}
                y={b.y + 0.3}
                width={Math.max(0.8, b.w - 0.4)}
                height={0.45}
                rx={0.2}
                fill={b.neonHue}
                opacity={0.45}
                filter="url(#neonGlow)"
              />
            )}
          </g>
        ))}

        {/* District shell */}
        <rect
          x={DISTRICT.x}
          y={DISTRICT.y}
          width={DISTRICT.w}
          height={DISTRICT.h}
          rx={DISTRICT.r}
          fill="rgba(5,5,16,0.78)"
          stroke="url(#districtStroke)"
          strokeWidth={0.8}
          filter="url(#neonGlow)"
          pointerEvents="none"
        />

        {/* District content */}
        <g clipPath="url(#districtClip)">
          <rect x={DISTRICT.x} y={DISTRICT.y} width={DISTRICT.w} height={DISTRICT.h} fill="url(#districtGrid)" opacity={0.65} pointerEvents="none" />

          {/* Roads */}
          <path
            d={`M ${DISTRICT.x} ${DISTRICT.y + DISTRICT.h * 0.55} L ${DISTRICT.x + DISTRICT.w} ${DISTRICT.y + DISTRICT.h * 0.35}`}
            stroke="rgba(56,189,248,0.22)"
            strokeWidth="1.6"
            pointerEvents="none"
          />
          <path
            d={`M ${DISTRICT.x + DISTRICT.w * 0.25} ${DISTRICT.y} L ${DISTRICT.x + DISTRICT.w * 0.45} ${DISTRICT.y + DISTRICT.h}`}
            stroke="rgba(167,139,250,0.18)"
            strokeWidth="1.4"
            pointerEvents="none"
          />
          <path
            d={`M ${DISTRICT.x + DISTRICT.w * 0.72} ${DISTRICT.y} L ${DISTRICT.x + DISTRICT.w * 0.58} ${DISTRICT.y + DISTRICT.h}`}
            stroke="rgba(34,211,238,0.14)"
            strokeWidth="1.2"
            pointerEvents="none"
          />

          {/* Influence as neon spill (visual only) */}
          {territories.map((t) => {
            const p = toDistrict(t);
            const dominance = t.currentOwner ? t.control[t.currentOwner] / 100 : 0.3;
            const radius = 10 + dominance * 9;
            return (
              <ellipse
                key={`spill-${t.id}`}
                cx={p.x}
                cy={p.y}
                rx={radius}
                ry={radius * 0.78}
                fill={`url(#territoryGrad-${t.id})`}
                style={{ mixBlendMode: "screen" }}
                pointerEvents="none"
              />
            );
          })}

          {/* Inner vignette */}
          <rect
            x={DISTRICT.x}
            y={DISTRICT.y}
            width={DISTRICT.w}
            height={DISTRICT.h}
            fill="rgba(0,0,0,0.28)"
            style={{ mixBlendMode: "multiply" }}
            pointerEvents="none"
          />
        </g>

        {/* District edge highlight */}
        <rect
          x={DISTRICT.x + 0.6}
          y={DISTRICT.y + 0.6}
          width={DISTRICT.w - 1.2}
          height={DISTRICT.h - 1.2}
          rx={DISTRICT.r - 0.8}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={0.6}
          pointerEvents="none"
        />

        {/* Markers (pins only — interactive) */}
        {territories.map((t) => {
          const p = toDistrict(t);
          const owner = t.currentOwner ? (FACTIONS as any)[t.currentOwner] : null;

          const isSelected = selectedTerritory?.id === t.id;
          const isHovered = hoveredId === t.id;
          const isPressed = pressedId === t.id;

          const dominance = t.currentOwner ? Math.max(...Object.values(t.control)) : 33;

          // contested/neutral styling
          const markerColor = owner ? owner.color : t.isContested ? "#FBBF24" : "#b8b8b8";

          const scale = isPressed ? 0.92 : isSelected ? 1.04 : isHovered ? 1.03 : 1;

          // Smaller pin sizing
          const pinScale = isSelected ? 0.30 : isHovered ? 0.28 : 0.26;
          const headR = isSelected ? 1.05 : isHovered ? 0.98 : 0.90;
          const haloR = isSelected ? 3.2 : isHovered ? 2.9 : 2.6;

          const PIN_PATH = "M 0 -6 C 3 -6 6 -3 6 0 C 6 4 2 7 0 10 C -2 7 -6 4 -6 0 C -6 -3 -3 -6 0 -6 Z";

          return (
            <g
              key={`marker-${t.id}`}
              onPointerEnter={() => setHoveredId(t.id)}
              onPointerLeave={() => setHoveredId((h) => (h === t.id ? null : h))}
              onPointerDown={() => setPressedId(t.id)}
              onPointerUp={() => {
                setPressedId(null);
                onSelectTerritoryId(isSelected ? null : t.id);
              }}
              onPointerCancel={() => setPressedId(null)}
              style={{
                cursor: "pointer",
                transformOrigin: `${p.x}px ${p.y}px`,
                transform: `scale(${scale})`,
                transition: "transform 120ms ease",
              }}
              filter={isSelected || isHovered ? "url(#markerBloom)" : undefined}
            >
              {/* Halo (stronger on hover/selected) */}
              <circle
                cx={p.x}
                cy={p.y - 0.9}
                r={haloR}
                fill={markerColor}
                opacity={isSelected ? 0.22 : isHovered ? 0.18 : 0.12}
                filter="url(#neonGlow)"
              />

              {/* Pin body */}
              <path
                d={PIN_PATH}
                transform={`translate(${p.x},${p.y}) scale(${pinScale})`}
                fill="rgba(0,0,0,0.78)"
                stroke={markerColor}
                strokeWidth={0.65}
                vectorEffect="non-scaling-stroke"
                filter="url(#neonGlow)"
              />

              {/* Pin head */}
              <circle cx={p.x} cy={p.y - 0.9} r={headR} fill={markerColor} filter="url(#neonGlow)" />
              <circle cx={p.x} cy={p.y - 0.9} r={Math.max(0.42, headR * 0.38)} fill="#fff" opacity={0.65} />

              {shouldShowLabel(t.id) && (
                <g filter="url(#textShadow)" pointerEvents="none">
                  <rect
                    x={p.x - 13}
                    y={p.y + 5.3}
                    width={26}
                    height={9.0}
                    rx={4.5}
                    fill="url(#labelBg)"
                    stroke="rgba(255,255,255,0.10)"
                    strokeWidth={0.3}
                  />
                  <text
                    x={p.x}
                    y={p.y + 8.7}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="2.55"
                    fontWeight={isSelected ? "900" : "800"}
                    fontFamily="Space Grotesk, Inter, system-ui, sans-serif"
                  >
                    {t.name}
                  </text>
                  <text
                    x={p.x}
                    y={p.y + 12.2}
                    textAnchor="middle"
                    fill={markerColor}
                    fontSize="2.30"
                    fontWeight="900"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                  >
                    {!t.currentOwner ? "⚔️" : `${dominance.toFixed(0)}%`}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Overlays (visual only — MUST NOT block pins) */}
        <rect width="100" height="100" fill="url(#scanlines)" opacity="0.55" pointerEvents="none" />
        <rect width="100" height="100" filter="url(#noise)" opacity="0.20" pointerEvents="none" />
      </svg>
    </div>
  );
};

// Grid View
const GridView = ({
  territories,
  selectedTerritoryId,
  onSelectTerritoryId,
}: {
  territories: any[];
  selectedTerritoryId: number | null;
  onSelectTerritoryId: (id: number | null) => void;
}) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "5px" }}>
    {territories.map((t) => {
      const owner = t.currentOwner ? (FACTIONS as any)[t.currentOwner] : null;
      const sel = selectedTerritoryId === t.id;
      const bgColor = owner ? owner.color : "#666";
      const bgColorDark = owner ? owner.colorDark : "#444";

      return (
        <div
          key={t.id}
          onClick={() => onSelectTerritoryId(sel ? null : t.id)}
          style={{
            background: `linear-gradient(135deg, ${bgColorDark}22 0%, ${bgColor}44 100%)`,
            border: `2px solid ${sel ? "#fff" : bgColor}88`,
            borderRadius: "10px",
            padding: "6px",
            minHeight: "70px",
            cursor: "pointer",
            transition: "all 0.2s",
            transform: sel ? "scale(1.03)" : "scale(1)",
            boxShadow: sel ? `0 0 16px ${bgColor}55` : "none",
            position: "relative",
          }}
        >
          {t.isContested && (
            <div style={{ position: "absolute", top: "-6px", right: "-6px", background: "#EAB308", fontSize: "8px", padding: "1px 4px", borderRadius: "999px" }}>
              ⚔️
            </div>
          )}
          <div style={{ fontWeight: "800", color: "#fff", fontSize: "9px", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "Space Grotesk, Inter, system-ui, sans-serif" }}>
            {t.name}
          </div>
          <div
            style={{
              display: "inline-block",
              padding: "1px 4px",
              borderRadius: "999px",
              fontSize: "7px",
              fontWeight: "700",
              background: bgColor,
              color: t.currentOwner === "hyperliquid" ? "#000" : "#fff",
              marginBottom: "4px",
              fontFamily: "Space Grotesk, Inter, system-ui, sans-serif",
            }}
          >
            {owner ? owner.name : "Neutral"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {Object.entries(t.control).map(([f, p]: any) =>
              p > 0 ? (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                  <div style={{ height: "3px", borderRadius: "1.5px", background: (FACTIONS as any)[f].color, width: `${p}%`, minWidth: "3px", transition: "width 0.4s" }} />
                  <span style={{ fontSize: "7px", color: "#666", fontFamily: "Inter, system-ui, sans-serif" }}>{p.toFixed(0)}%</span>
                </div>
              ) : null
            )}
          </div>
        </div>
      );
    })}
  </div>
);

export default function TurfWarzPreview() {
  const [territories, setTerritories] = useState<any[]>(() => initTerritories());
  const [selectedFaction, setSelectedFaction] = useState<string | null>(null);
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "map">("map");
  const [activityLog, setActivityLog] = useState<any[]>([]);

  // Preview controls
  const [simulate, setSimulate] = useState(true);
  const [tickMs, setTickMs] = useState(1200);

  const selectedTerritory = useMemo(
    () => territories.find((t) => t.id === selectedTerritoryId) || null,
    [territories, selectedTerritoryId]
  );

  useEffect(() => {
    if (!simulate) return;

    const interval = setInterval(() => {
      setTerritories((prev) => {
        const updated = prev.map((t) => ({ ...t, transactions: { ...t.transactions }, control: { ...t.control } }));

        const idx = Math.floor(Math.random() * updated.length);
        const faction = Object.keys(FACTIONS)[Math.floor(Math.random() * 3)];

        updated[idx].transactions[faction] = updated[idx].transactions[faction] + 1;

        const total = Object.values(updated[idx].transactions).reduce((a: number, b: any) => a + b, 0);
        Object.keys(FACTIONS).forEach((f) => {
          updated[idx].control[f] = (updated[idx].transactions[f] / total) * 100;
        });

        const max = Math.max(...Object.values(updated[idx].control));
        const newOwner = Object.entries(updated[idx].control).find(([_, v]: any) => v === max)?.[0] || null;
        const oldOwner = updated[idx].currentOwner;

        if (newOwner && max > 50) updated[idx].currentOwner = newOwner;
        updated[idx].isContested = max < 55 && total > 5;

        if (newOwner !== oldOwner && max > 50) {
          setActivityLog((l) => [{ territory: updated[idx].name, from: oldOwner, to: newOwner, time: Date.now() }, ...l].slice(0, 5));
        }

        return updated;
      });
    }, tickMs);

    return () => clearInterval(interval);
  }, [simulate, tickMs]);

  const getStats = (id: string) => {
    const count = territories.filter((t) => t.currentOwner === id).length;
    const pct = ((count / 15) * 100).toFixed(1);
    return { count, pct };
  };

  const onAttack = () => {
    if (!selectedFaction) return;

    setTerritories((prev) => {
      const updated = prev.map((t) => ({ ...t, transactions: { ...t.transactions }, control: { ...t.control } }));

      const pickId = selectedTerritoryId || updated.find((t) => t.isContested)?.id || updated[Math.floor(Math.random() * 15)].id;
      const idx = updated.findIndex((t) => t.id === pickId);
      if (idx < 0) return prev;

      updated[idx].transactions[selectedFaction] = updated[idx].transactions[selectedFaction] + 3;

      const total = Object.values(updated[idx].transactions).reduce((a: number, b: any) => a + b, 0);
      Object.keys(FACTIONS).forEach((f) => {
        updated[idx].control[f] = (updated[idx].transactions[f] / total) * 100;
      });

      const max = Math.max(...Object.values(updated[idx].control));
      const newOwner = Object.entries(updated[idx].control).find(([_, v]: any) => v === max)?.[0] || null;
      const oldOwner = updated[idx].currentOwner;

      if (newOwner && max > 50) updated[idx].currentOwner = newOwner;
      updated[idx].isContested = max < 55 && total > 5;

      if (newOwner !== oldOwner && max > 50) {
        setActivityLog((l) => [{ territory: updated[idx].name, from: oldOwner, to: newOwner, time: Date.now() }, ...l].slice(0, 5));
      }

      return updated;
    });
  };

  return (
    <>
      <style>{FONT_CSS}</style>
      <div
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(1200px 900px at 50% -10%, rgba(56,189,248,0.14), rgba(0,0,0,0)), linear-gradient(180deg, #05050a 0%, #070711 55%, #05050a 100%)",
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
          padding: "12px",
          paddingBottom: "90px",
          color: "var(--twz-text)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "900",
              fontFamily: "Orbitron, Inter, system-ui, -apple-system, sans-serif",
              letterSpacing: "-0.8px",
              margin: 0,
              background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(167,139,250,0.75) 50%, rgba(56,189,248,0.75) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            TURF WARZ
          </h1>
          <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "11px", margin: "2px 0 0", letterSpacing: "1px", fontFamily: "Space Grotesk, Inter, system-ui, sans-serif" }}>
            REP YOUR CHAIN • CONTROL THE HOOD
          </p>
        </div>

        {/* Preview Controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            marginBottom: "12px",
            padding: "10px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.60)", letterSpacing: "1px", fontFamily: "Space Grotesk, Inter, system-ui, sans-serif" }}>
              PREVIEW
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                onClick={() => setSimulate((s) => !s)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: simulate ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.35)",
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "Space Grotesk, Inter, system-ui, sans-serif",
                }}
              >
                {simulate ? "⏸ Pause sim" : "▶️ Resume sim"}
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.50)", minWidth: 70, fontFamily: "Space Grotesk, Inter, system-ui, sans-serif" }}>
                  Speed
                </div>
                <input type="range" min={350} max={2200} step={50} value={tickMs} onChange={(e) => setTickMs(Number(e.target.value))} style={{ width: 140 }} />
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.50)", minWidth: 45, textAlign: "right", fontFamily: "Space Grotesk, Inter, system-ui, sans-serif" }}>
                  {tickMs}ms
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setTerritories(initTerritories());
              setActivityLog([]);
              setSelectedFaction(null);
              setSelectedTerritoryId(null);
            }}
            style={{
              padding: "8px 10px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.35)",
              color: "rgba(255,255,255,0.70)",
              fontSize: "10px",
              fontWeight: 900,
              cursor: "pointer",
              fontFamily: "Space Grotesk, Inter, system-ui, sans-serif",
            }}
          >
            ↺ Reset
          </button>
        </div>

        {/* Faction Selection */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "12px" }}>
          {Object.values(FACTIONS).map((f: any) => {
            const stats = getStats(f.id);
            const sel = selectedFaction === f.id;
            return (
              <div
                key={f.id}
                onClick={() => setSelectedFaction(sel ? null : f.id)}
                style={{
                  background: sel ? `linear-gradient(135deg, ${f.color}35 0%, ${f.colorDark}55 100%)` : "rgba(255,255,255,0.03)",
                  border: `2px solid ${sel ? f.color : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "12px",
                  padding: "10px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: f.color, boxShadow: sel ? `0 0 12px ${f.color}` : "none" }} />
                  <span style={{ fontWeight: "800", color: "#fff", fontSize: "11px", fontFamily: "Space Grotesk, Inter, system-ui, sans-serif" }}>{f.name}</span>
                </div>
                <div style={{ fontSize: "22px", fontWeight: "900", color: "#fff" }}>{stats.pct}%</div>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.45)", fontFamily: "Space Grotesk, Inter, system-ui, sans-serif" }}>
                  {stats.count}/15 turf
                </div>
              </div>
            );
          })}
        </div>

        {/* Control Bar */}
        <div style={{ marginBottom: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "10px", fontWeight: "800", color: "rgba(255,255,255,0.45)", letterSpacing: "1px", fontFamily: "Space Grotesk, Inter, system-ui, sans-serif" }}>
              TURF CONTROL
            </span>
            <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.35)", fontFamily: "Space Grotesk, Inter, system-ui, sans-serif" }}>3 neutral zones</span>
          </div>
          <div style={{ height: "20px", borderRadius: "10px", overflow: "hidden", display: "flex", background: "rgba(0,0,0,0.5)" }}>
            {Object.keys(FACTIONS).map((id) => {
              const pct = (territories.filter((t) => t.currentOwner === id).length / 15) * 100;
              return (
                <div
                  key={id}
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: `linear-gradient(135deg, ${(FACTIONS as any)[id].colorLight} 0%, ${(FACTIONS as any)[id].color} 100%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "width 0.5s",
                  }}
                >
                  {pct >= 15 && <span style={{ fontSize: "9px", fontWeight: "bold", color: id === "hyperliquid" ? "#000" : "#fff" }}>{pct.toFixed(0)}%</span>}
                </div>
              );
            })}
            {(() => {
              const neutralPct = (territories.filter((t) => !t.currentOwner).length / 15) * 100;
              return neutralPct > 0 ? (
                <div style={{ width: `${neutralPct}%`, height: "100%", background: "linear-gradient(135deg, #555 0%, #333 100%)", display: "flex", alignItems: "center", justifyContent: "center", transition: "width 0.5s" }}>
                  {neutralPct >= 10 && <span style={{ fontSize: "8px", fontWeight: "bold", color: "#999" }}>⚔️</span>}
                </div>
              ) : null;
            })()}
          </div>
        </div>

        {/* Map Header */}
        <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "10px", fontWeight: "800", color: "rgba(255,255,255,0.45)", letterSpacing: "1px", fontFamily: "Space Grotesk, Inter, system-ui, sans-serif" }}>
            THE CITY
          </span>
          <ViewToggle view={viewMode} onToggle={setViewMode} />
        </div>

        {/* View Container */}
        <div style={{ marginBottom: "12px" }}>
          {viewMode === "grid" ? (
            <GridView territories={territories} selectedTerritoryId={selectedTerritoryId} onSelectTerritoryId={setSelectedTerritoryId} />
          ) : (
            <CyberCityMapView territories={territories} selectedTerritoryId={selectedTerritoryId} onSelectTerritoryId={setSelectedTerritoryId} />
          )}
        </div>

        {/* Territory Detail */}
        {selectedTerritory && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "12px", padding: "12px", marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: "900", color: "#fff", fontFamily: "Space Grotesk, Inter, system-ui, sans-serif" }}>{selectedTerritory.name}</div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", fontStyle: "italic", fontFamily: "Space Grotesk, Inter, system-ui, sans-serif" }}>
                  "{selectedTerritory.vibe}"
                </div>
              </div>
              <button onClick={() => setSelectedTerritoryId(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", fontSize: "18px", cursor: "pointer", padding: 0 }}>
                ×
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {Object.entries(FACTIONS).map(([id, f]: any) => (
                <div key={id} style={{ textAlign: "center", padding: "8px", background: `${f.color}11`, borderRadius: "10px", border: `1px solid ${f.color}33` }}>
                  <div style={{ fontSize: "16px", fontWeight: "900", color: f.color, fontFamily: "Orbitron, Inter, system-ui, sans-serif" }}>{selectedTerritory.control[id].toFixed(0)}%</div>
                  <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.45)", fontFamily: "Space Grotesk, Inter, system-ui, sans-serif" }}>{f.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div style={{ position: "fixed", bottom: "16px", left: "12px", right: "12px" }}>
          <button
            onClick={onAttack}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.10)",
              fontWeight: "900",
              fontSize: "14px",
              cursor: selectedFaction ? "pointer" : "not-allowed",
              background: selectedFaction ? `linear-gradient(135deg, ${(FACTIONS as any)[selectedFaction].color} 0%, ${(FACTIONS as any)[selectedFaction].colorDark} 100%)` : "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.55) 100%)",
              color: selectedFaction === "hyperliquid" ? "#000" : "#fff",
              boxShadow: selectedFaction ? `0 8px 28px ${(FACTIONS as any)[selectedFaction].color}44` : "none",
              opacity: selectedFaction ? 1 : 0.6,
              fontFamily: "Orbitron, Inter, system-ui, sans-serif",
            }}
          >
            {selectedFaction ? `⚔️ ATTACK FOR ${(FACTIONS as any)[selectedFaction].name.toUpperCase()}` : "SELECT YOUR FACTION ABOVE"}
          </button>
        </div>
      </div>
    </>
  );
}
