#!/usr/bin/env node
// Exists-check: `npm run exists look-diff` returned 0 matches (run 2026-09-06). No scripts/design
// folder existed before this file (scripts/ has no "design" subfolder and no measuring script with
// this job: check-geometry.mjs, check-reflow.mjs and detect-type-scale-outliers.mjs each check ONE
// static rule, none renders a page and diffs it against the Airbnb look-recipe table). This is a
// new file, not an extension of prior work.
//
// scripts/design/look-diff.mjs
// Usage: node scripts/design/look-diff.mjs <url> [--out <file.md>]
//
// Renders a page with Playwright, measures the OURS side of the screen (font sizes, weights,
// buttons, pills/chips, cards, hairlines, icon count, photo share, spacing ladder, colours, word
// count), reads the Airbnb "look recipe" numbers table at run time (the values are never
// hardcoded, only the row numbers a class maps to are), and prints a markdown report with three
// parts: OURS, AIRBNB ROWS, and GAPS.

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { guardedGoto, refusal } from '../_measure-guard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const RECIPE_PATH = path.join(REPO_ROOT, '_design-system/references/airbnb--look-recipe.md');

// Class name -> Airbnb row numbers that apply. Only the row NUMBERS live here; the actual values
// (px, colour, weight) are parsed from the md file at run time by parseAirbnbTable().
const CLASS_TO_ROWS = {
  'anchor size': [1],
  'section title': [2, 44],
  'body text': [4],
  'meta text': [31, 47],
  'page background': [6, 7],
  'hairline colour': [8, 39],
  'photo card radius': [9, 37, 38],
  'card shadow': [10, 37],
  'primary button': [13, 25],
  'multi-step CTA': [14],
  'filter pill': [21],
  'map pill': [22],
  'badge on photo': [23, 24],
  'empty-state CTA': [26],
};

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = { url: null, outFile: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out') {
      result.outFile = args[i + 1];
      i++;
    } else if (!result.url) {
      result.url = args[i];
    }
  }
  return result;
}

// Parses the "## The numbers" table out of airbnb--look-recipe.md into { rowNumber: {element,
// value, tag, source} }. Never hardcodes a value, only reads whatever is on disk right now.
function parseAirbnbTable(mdText) {
  const lines = mdText.split('\n');
  const rows = {};
  let inTable = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## The numbers')) {
      inTable = true;
      continue;
    }
    if (inTable && trimmed.startsWith('## ')) break;
    if (!inTable) continue;
    if (!trimmed.startsWith('|')) continue;
    const rawCells = trimmed.split('|');
    // a well-formed "| a | b | c |" row splits into ['', ' a ', ' b ', ' c ', ''] - drop the two
    // empty ends produced by the leading/trailing pipe, keep everything else as-is.
    const cells = rawCells.slice(1, rawCells.length - 1).map((c) => c.trim());
    if (cells.length < 5) continue;
    const n = parseInt(cells[0], 10);
    if (!Number.isInteger(n)) continue; // skips the header row and the "---" separator row
    rows[n] = { element: cells[1], value: cells[2], tag: cells[3], source: cells[4] };
  }
  return rows;
}

function firstPx(text) {
  const m = text.match(/(\d+(?:\.\d+)?)px/);
  return m ? parseFloat(m[1]) : null;
}
function firstWeight(text) {
  const m = text.match(/\b(400|500|600|700)\b/);
  return m ? parseInt(m[1], 10) : null;
}
function firstColorRaw(text) {
  const m = text.match(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}/);
  return m ? m[0] : null;
}
function rgbToHex(raw) {
  if (!raw) return null;
  if (raw.startsWith('#')) return raw.toUpperCase();
  const m = raw.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return raw;
  return (
    '#' +
    [m[1], m[2], m[3]]
      .map((v) => parseInt(v, 10).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

// Browser-side measurement. Everything here runs inside the page via page.evaluate; the only
// scope explicitly limited to "the fold" (per the brief) is svg icon count, photo area share,
// colours, and word count. Font sizes/weights, buttons, pills, cards, hairlines and the spacing
// ladder are measured across the whole rendered document.
async function measurePage(page) {
  return page.evaluate(() => {
    function hex(rgbStr) {
      if (!rgbStr) return null;
      const m = rgbStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\)/);
      if (!m) return rgbStr;
      const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
      if (a === 0) return 'transparent';
      return (
        '#' +
        [m[1], m[2], m[3]]
          .map((v) => parseInt(v, 10).toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase()
      );
    }
    function isVisible(el) {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
      return true;
    }
    function hasDirectText(el) {
      for (const node of el.childNodes) {
        if (node.nodeType === 3 && node.textContent.trim().length > 0) return true;
      }
      return false;
    }
    function borderInfo(cs) {
      const w = parseFloat(cs.borderTopWidth) || 0;
      return { width: w, style: cs.borderTopStyle, color: hex(cs.borderTopColor) };
    }

    const foldHeight = window.innerHeight;
    const foldWidth = window.innerWidth;
    const allEls = Array.from(document.querySelectorAll('*'));

    // 1. font sizes / weights, whole document
    const sizeCounts = new Map();
    const weightCounts = new Map();
    const sizeWeightPairs = [];
    for (const el of allEls) {
      if (!isVisible(el) || !hasDirectText(el)) continue;
      const cs = getComputedStyle(el);
      const size = Math.round(parseFloat(cs.fontSize));
      const weight = parseInt(cs.fontWeight, 10) || 400;
      sizeCounts.set(size, (sizeCounts.get(size) || 0) + 1);
      weightCounts.set(weight, (weightCounts.get(weight) || 0) + 1);
      sizeWeightPairs.push({ size, weight, color: hex(cs.color) });
    }
    const sizesSorted = [...sizeCounts.entries()].sort((a, b) => b[0] - a[0]);
    const weightsSorted = [...weightCounts.entries()].sort((a, b) => a[0] - b[0]);
    const anchorSize = sizesSorted.length ? sizesSorted[0][0] : null;
    const anchorPair = sizeWeightPairs.find((p) => p.size === anchorSize);
    const bodySize = [...sizeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const bodyPairs = sizeWeightPairs.filter((p) => p.size === bodySize);
    const bodyWeightCounts = new Map();
    const bodyColorCounts = new Map();
    for (const p of bodyPairs) {
      bodyWeightCounts.set(p.weight, (bodyWeightCounts.get(p.weight) || 0) + 1);
      bodyColorCounts.set(p.color, (bodyColorCounts.get(p.color) || 0) + 1);
    }
    const bodyWeight = [...bodyWeightCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const bodyColor = [...bodyColorCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const sizeWeightModeMap = new Map();
    for (const p of sizeWeightPairs) {
      if (!sizeWeightModeMap.has(p.size)) sizeWeightModeMap.set(p.size, new Map());
      const wm = sizeWeightModeMap.get(p.size);
      wm.set(p.weight, (wm.get(p.weight) || 0) + 1);
    }
    const sizeWeightMode = [...sizeWeightModeMap.entries()].map(([size, wm]) => ({
      size,
      weight: [...wm.entries()].sort((a, b) => b[1] - a[1])[0][0],
    }));

    const smallerPairs = sizeWeightPairs.filter((p) => bodySize != null && p.size < bodySize);
    let metaSize = null;
    let metaWeight = null;
    let metaColor = null;
    if (smallerPairs.length) {
      const smallCounts = new Map();
      for (const p of smallerPairs) smallCounts.set(p.size, (smallCounts.get(p.size) || 0) + 1);
      metaSize = [...smallCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      const metaPairs = smallerPairs.filter((p) => p.size === metaSize);
      const metaWeightCounts = new Map();
      const metaColorCounts = new Map();
      for (const p of metaPairs) {
        metaWeightCounts.set(p.weight, (metaWeightCounts.get(p.weight) || 0) + 1);
        metaColorCounts.set(p.color, (metaColorCounts.get(p.color) || 0) + 1);
      }
      metaWeight = [...metaWeightCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      metaColor = [...metaColorCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }

    // 2. buttons: button, a[role=button], or a with a bordered or filled box
    const buttonEls = allEls.filter((el) => {
      if (!isVisible(el)) return false;
      const tag = el.tagName.toLowerCase();
      if (tag === 'button') return true;
      if (tag === 'a' && el.getAttribute('role') === 'button') return true;
      if (tag === 'a') {
        const cs = getComputedStyle(el);
        const b = borderInfo(cs);
        const bg = hex(cs.backgroundColor);
        return b.width > 0 || (bg && bg !== 'transparent' && bg !== '#FFFFFF');
      }
      return false;
    });
    const buttons = buttonEls
      .map((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const b = borderInfo(cs);
        return {
          tag: el.tagName.toLowerCase(),
          height: Math.round(r.height),
          width: Math.round(r.width),
          area: Math.round(r.width * r.height),
          radius: parseFloat(cs.borderTopLeftRadius) || 0,
          fill: hex(cs.backgroundColor),
          borderWidth: b.width,
          borderColor: b.color,
          textSize: Math.round(parseFloat(cs.fontSize)),
          textWeight: parseInt(cs.fontWeight, 10) || 400,
          textColor: hex(cs.color),
          text: (el.innerText || '').trim().slice(0, 40),
        };
      })
      .sort((a, b) => b.area - a.area);

    // 3. pills / chips: inline display, under 48px tall, bordered or filled, carries text
    const pillEls = allEls.filter((el) => {
      if (!isVisible(el)) return false;
      const tag = el.tagName.toLowerCase();
      if (tag === 'button' || el.getAttribute('role') === 'button') return false;
      const cs = getComputedStyle(el);
      if (!/inline/.test(cs.display)) return false;
      const r = el.getBoundingClientRect();
      if (r.height >= 48 || r.height === 0) return false;
      const b = borderInfo(cs);
      const bg = hex(cs.backgroundColor);
      const boxed = b.width > 0 || (bg && bg !== 'transparent');
      if (!boxed) return false;
      return hasDirectText(el) || (el.innerText || '').trim().length > 0;
    });
    const pills = pillEls
      .map((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const b = borderInfo(cs);
        return {
          height: Math.round(r.height),
          width: Math.round(r.width),
          radius: parseFloat(cs.borderTopLeftRadius) || 0,
          fill: hex(cs.backgroundColor),
          borderWidth: b.width,
          borderColor: b.color,
          textSize: Math.round(parseFloat(cs.fontSize)),
          textWeight: parseInt(cs.fontWeight, 10) || 400,
          text: (el.innerText || '').trim().slice(0, 30),
        };
      })
      .sort((a, b) => b.width * b.height - a.width * a.height);

    // 4. cards: border, box-shadow, or non-white bg, wider than 200px
    const cardEls = allEls.filter((el) => {
      if (!isVisible(el)) return false;
      const r = el.getBoundingClientRect();
      if (r.width <= 200) return false;
      const cs = getComputedStyle(el);
      const b = borderInfo(cs);
      const bg = hex(cs.backgroundColor);
      const hasShadow = cs.boxShadow && cs.boxShadow !== 'none';
      const nonWhiteBg = bg && bg !== 'transparent' && bg !== '#FFFFFF';
      return b.width > 0 || hasShadow || nonWhiteBg;
    });
    const cards = cardEls.map((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const b = borderInfo(cs);
      return {
        width: Math.round(r.width),
        height: Math.round(r.height),
        radius: parseFloat(cs.borderTopLeftRadius) || 0,
        bg: hex(cs.backgroundColor),
        borderWidth: b.width,
        borderColor: b.color,
        shadow: cs.boxShadow === 'none' ? 'none' : cs.boxShadow,
      };
    });

    // 5. hairlines: border-top or border-bottom is 1px, width exceeds 200px
    const hairlineEls = allEls.filter((el) => {
      if (!isVisible(el)) return false;
      const r = el.getBoundingClientRect();
      if (r.width <= 200) return false;
      const cs = getComputedStyle(el);
      const top = Math.round(parseFloat(cs.borderTopWidth));
      const bottom = Math.round(parseFloat(cs.borderBottomWidth));
      return top === 1 || bottom === 1;
    });
    const hairlineColorCounts = new Map();
    for (const el of hairlineEls) {
      const cs = getComputedStyle(el);
      const top = Math.round(parseFloat(cs.borderTopWidth));
      const color = hex(top === 1 ? cs.borderTopColor : cs.borderBottomColor);
      hairlineColorCounts.set(color, (hairlineColorCounts.get(color) || 0) + 1);
    }
    const hairlineColor = [...hairlineColorCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    // 6. svg icon count in the fold
    const svgCount = allEls.filter((el) => {
      if (el.tagName.toLowerCase() !== 'svg') return false;
      const r = el.getBoundingClientRect();
      return r.top < foldHeight && r.bottom > 0 && r.width > 0 && r.height > 0;
    }).length;

    // 7. photo area share of the fold (img + background-image elements)
    const foldArea = foldWidth * foldHeight;
    let photoArea = 0;
    for (const el of allEls) {
      const r = el.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= foldHeight || r.width <= 0 || r.height <= 0) continue;
      const cs = getComputedStyle(el);
      const isImg = el.tagName.toLowerCase() === 'img';
      const hasBgImage = cs.backgroundImage && cs.backgroundImage !== 'none';
      if (!isImg && !hasBgImage) continue;
      const visTop = Math.max(r.top, 0);
      const visBottom = Math.min(r.bottom, foldHeight);
      const visHeight = Math.max(0, visBottom - visTop);
      photoArea += r.width * visHeight;
    }
    const photoShare = foldArea > 0 ? Math.min(1, photoArea / foldArea) : 0;

    // 8. spacing ladder: gaps between adjacent block siblings inside <main> (fallback body)
    const root = document.querySelector('main') || document.body;
    const gapCounts = new Map();
    function walk(node) {
      const kids = Array.from(node.children).filter((el) => {
        if (!isVisible(el)) return false;
        const cs = getComputedStyle(el);
        return cs.position !== 'fixed' && cs.position !== 'absolute';
      });
      const sorted = kids
        .slice()
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      for (let i = 1; i < sorted.length; i++) {
        const prevR = sorted[i - 1].getBoundingClientRect();
        const curR = sorted[i].getBoundingClientRect();
        const gap = Math.round(curR.top - prevR.bottom);
        if (gap > 0 && gap < 400) {
          gapCounts.set(gap, (gapCounts.get(gap) || 0) + 1);
        }
      }
      for (const k of kids) walk(k);
    }
    walk(root);
    const spacingLadder = [...gapCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);

    // 9. distinct colours in the fold (fills and text)
    const colorCounts = new Map();
    for (const el of allEls) {
      const r = el.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= foldHeight || r.width <= 0 || r.height <= 0) continue;
      const cs = getComputedStyle(el);
      const bg = hex(cs.backgroundColor);
      if (bg && bg !== 'transparent') {
        const key = 'fill:' + bg;
        colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
      }
      if (hasDirectText(el)) {
        const tc = hex(cs.color);
        const key = 'text:' + tc;
        colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
      }
    }
    const colours = [...colorCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => {
        const [role, color] = k.split(':');
        return { role, color, count: v };
      });

    // 10. word count in the fold
    let wordCount = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent.trim();
      if (!text) continue;
      const parent = node.parentElement;
      if (!parent) continue;
      const r = parent.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= foldHeight) continue;
      const cs = getComputedStyle(parent);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      wordCount += text.split(/\s+/).filter(Boolean).length;
    }

    const bodyBg = hex(getComputedStyle(document.body).backgroundColor);
    const htmlBg = hex(getComputedStyle(document.documentElement).backgroundColor);
    const pageBg = bodyBg && bodyBg !== 'transparent' ? bodyBg : htmlBg;

    return {
      foldWidth,
      foldHeight,
      pageBg,
      sizesSorted,
      weightsSorted,
      sizeWeightMode,
      anchorSize,
      anchorWeight: anchorPair ? anchorPair.weight : null,
      bodySize,
      bodyWeight,
      bodyColor,
      metaSize,
      metaWeight,
      metaColor,
      buttons,
      pills,
      cards,
      hairlineCount: hairlineEls.length,
      hairlineColor,
      svgCount,
      photoShare,
      spacingLadder,
      colours,
      wordCount,
    };
  });
}

function weightForSize(sizeWeightMode, size) {
  const found = sizeWeightMode.find((s) => s.size === size);
  return found ? found.weight : null;
}

// Picks the OURS candidate for each class the report compares against Airbnb. These are
// heuristics over the measured elements (largest button = primary, a filled non-largest button =
// the multi-step CTA, an unselected white/hairline pill under 40px = the filter pill, a filled
// small pill/button = the map pill). "badge on photo" and "empty-state CTA" have no reliable
// generic detector and are left null on purpose: the AIRBNB ROWS section still lists their rows,
// GAPS simply prints nothing for a class with no ours candidate.
function buildComparisons(ours) {
  const { buttons, pills, cards, sizesSorted, sizeWeightMode, anchorSize, anchorWeight, bodySize, bodyWeight, bodyColor, metaSize, metaWeight, metaColor, hairlineColor, pageBg } = ours;

  const primaryButton = buttons[0] || null;
  const multiStepCTA =
    buttons.slice(1).find((b) => b.fill && b.fill !== '#FFFFFF' && b.fill !== 'transparent') || null;
  const filterPill =
    pills.find((p) => (p.fill === '#FFFFFF' || p.fill === 'transparent') && p.borderWidth > 0 && p.height <= 40) ||
    null;
  const mapPill =
    pills.find((p) => p.fill && p.fill !== '#FFFFFF' && p.fill !== 'transparent' && p.height <= 48) ||
    buttons.find((b) => b.height <= 48 && b.fill && b.fill !== '#FFFFFF' && b.fill !== 'transparent') ||
    null;
  const card = cards.length ? cards.slice().sort((a, b) => b.width * b.height - a.width * a.height)[0] : null;
  const sectionTitleSize =
    sizesSorted.map(([s]) => s).find((s) => s !== anchorSize && (weightForSize(sizeWeightMode, s) || 0) >= 600) ??
    null;

  return {
    'anchor size': anchorSize != null ? { px: anchorSize, weight: anchorWeight } : null,
    'section title': sectionTitleSize != null ? { px: sectionTitleSize, weight: weightForSize(sizeWeightMode, sectionTitleSize) } : null,
    'body text': bodySize != null ? { px: bodySize, weight: bodyWeight, color: bodyColor } : null,
    'meta text': metaSize != null ? { px: metaSize, weight: metaWeight, color: metaColor } : null,
    'page background': pageBg != null ? { color: pageBg } : null,
    'hairline colour': hairlineColor != null ? { color: hairlineColor } : null,
    'photo card radius': card ? { px: card.radius } : null,
    'card shadow': card ? { shadow: card.shadow } : null,
    'primary button': primaryButton ? { px: primaryButton.radius, fill: primaryButton.fill } : null,
    'multi-step CTA': multiStepCTA ? { px: multiStepCTA.radius, fill: multiStepCTA.fill } : null,
    'filter pill': filterPill ? { px: filterPill.radius } : null,
    'map pill': mapPill ? { px: mapPill.radius, fill: mapPill.fill } : null,
    'badge on photo': null,
    'empty-state CTA': null,
  };
}

function diffLine(className, oursVal, rows, rowIds) {
  if (!oursVal) return null;
  const text = rowIds
    .map((n) => rows[n]?.value)
    .filter(Boolean)
    .join(' ; ');
  if (!text) return null;
  const airbnbPx = firstPx(text);
  const airbnbWeight = firstWeight(text);
  const airbnbColorRaw = firstColorRaw(text);
  const airbnbColor = airbnbColorRaw ? rgbToHex(airbnbColorRaw) : null;

  const parts = [];
  if (oursVal.px != null && airbnbPx != null) {
    const d = Math.round((oursVal.px - airbnbPx) * 10) / 10;
    if (d !== 0) parts.push(`${d > 0 ? '+' : ''}${d}px (ours ${oursVal.px}px, airbnb ${airbnbPx}px)`);
  }
  if (oursVal.weight != null && airbnbWeight != null && oursVal.weight !== airbnbWeight) {
    parts.push(`weight differs: ours ${oursVal.weight}, airbnb ${airbnbWeight}`);
  }
  if (oursVal.color != null && airbnbColor != null && oursVal.color.toUpperCase() !== airbnbColor.toUpperCase()) {
    parts.push(`colour differs: ours ${oursVal.color}, airbnb ${airbnbColor}`);
  }
  if (oursVal.fill != null && airbnbColor != null && oursVal.fill.toUpperCase() !== airbnbColor.toUpperCase()) {
    parts.push(`fill differs: ours ${oursVal.fill}, airbnb ${airbnbColor}`);
  }
  if (oursVal.shadow != null) {
    const noShadowPhrase = /no card shadow|flat, no card shadow|none, flat/i.test(text);
    const airbnbHasShadow = /shadow|elevation/i.test(text) && !noShadowPhrase;
    const oursHasShadow = oursVal.shadow !== 'none';
    if (oursHasShadow !== airbnbHasShadow) {
      parts.push(
        `shadow differs: ours ${oursHasShadow ? 'present' : 'none'}, airbnb ${airbnbHasShadow ? 'present' : 'none'}`,
      );
    }
  }
  if (!parts.length) return null;
  return `- ${className} (rows ${rowIds.join(', ')}): ${parts.join('; ')}`;
}

function fmtRow(prefix, cols) {
  return `| ${prefix} | ${cols.join(' | ')} |`;
}

function buildReport(url, ours, rows) {
  const lines = [];
  lines.push(`# Look diff: ${url}`);
  lines.push('');
  lines.push(`Measured ${new Date().toISOString()}, viewport ${ours.foldWidth}x${ours.foldHeight} dpr3, networkidle plus 800ms.`);
  lines.push('');
  lines.push('## 1. OURS');
  lines.push('');
  lines.push('### Font sizes (whole document)');
  lines.push('| size (px) | count |');
  lines.push('|---|---|');
  for (const [size, count] of ours.sizesSorted) lines.push(`| ${size} | ${count} |`);
  lines.push('');
  lines.push('### Weights (whole document)');
  lines.push('| weight | count |');
  lines.push('|---|---|');
  for (const [weight, count] of ours.weightsSorted) lines.push(`| ${weight} | ${count} |`);
  lines.push('');
  const ratio = ours.anchorSize != null && ours.bodySize ? Math.round((ours.anchorSize / ours.bodySize) * 100) / 100 : null;
  lines.push(
    `Anchor size: ${ours.anchorSize}px / weight ${ours.anchorWeight}. Modal body size: ${ours.bodySize}px / weight ${ours.bodyWeight}. Ratio anchor/body: ${ratio}.`,
  );
  lines.push('');
  lines.push('### Buttons');
  if (ours.buttons.length) {
    lines.push('| tag | h | w | radius | fill | border | text size/weight/colour | text |');
    lines.push('|---|---|---|---|---|---|---|---|');
    for (const b of ours.buttons.slice(0, 20)) {
      lines.push(
        fmtRow(b.tag, [
          `${b.height}`,
          `${b.width}`,
          `${b.radius}`,
          b.fill,
          `${b.borderWidth}px ${b.borderColor}`,
          `${b.textSize}/${b.textWeight} ${b.textColor}`,
          b.text.replace(/\|/g, '/'),
        ]),
      );
    }
  } else {
    lines.push('none found.');
  }
  lines.push('');
  lines.push('### Pills / chips');
  if (ours.pills.length) {
    lines.push('| h | w | radius | fill | border | text size/weight | text |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const p of ours.pills.slice(0, 20)) {
      lines.push(
        fmtRow(`${p.height}`, [
          `${p.width}`,
          `${p.radius}`,
          p.fill,
          `${p.borderWidth}px ${p.borderColor}`,
          `${p.textSize}/${p.textWeight}`,
          p.text.replace(/\|/g, '/'),
        ]),
      );
    }
  } else {
    lines.push('none found.');
  }
  lines.push('');
  lines.push('### Cards');
  if (ours.cards.length) {
    lines.push('| w | h | bg | border | shadow | radius |');
    lines.push('|---|---|---|---|---|---|');
    for (const c of ours.cards.slice(0, 20)) {
      lines.push(
        fmtRow(`${c.width}`, [`${c.height}`, c.bg, `${c.borderWidth}px ${c.borderColor}`, c.shadow.slice(0, 40), `${c.radius}`]),
      );
    }
  } else {
    lines.push('none found.');
  }
  lines.push('');
  lines.push(`Hairlines: count ${ours.hairlineCount}, colour ${ours.hairlineColor}.`);
  lines.push(`SVG icons in the fold: ${ours.svgCount}.`);
  lines.push(`Photo area share of the fold: ${(ours.photoShare * 100).toFixed(1)}%.`);
  lines.push(`Word count in the fold: ${ours.wordCount}.`);
  lines.push('');
  lines.push('### Spacing ladder (main, gap px : count)');
  if (ours.spacingLadder.length) {
    lines.push('| gap (px) | count |');
    lines.push('|---|---|');
    for (const [gap, count] of ours.spacingLadder) lines.push(`| ${gap} | ${count} |`);
  } else {
    lines.push('no adjacent block siblings found.');
  }
  lines.push('');
  lines.push('### Colours in the fold');
  if (ours.colours.length) {
    lines.push('| role | colour | count |');
    lines.push('|---|---|---|');
    for (const c of ours.colours.slice(0, 20)) lines.push(`| ${c.role} | ${c.color} | ${c.count} |`);
  } else {
    lines.push('none found.');
  }
  lines.push('');

  lines.push('## 2. AIRBNB ROWS');
  lines.push('');
  for (const [className, rowIds] of Object.entries(CLASS_TO_ROWS)) {
    lines.push(`### ${className}`);
    for (const n of rowIds) {
      const row = rows[n];
      if (!row) {
        lines.push(`- row ${n}: not found in the recipe table.`);
        continue;
      }
      lines.push(`- row ${n} (${row.tag}, ${row.source}): ${row.element} = ${row.value}`);
    }
    lines.push('');
  }

  lines.push('## 3. GAPS');
  lines.push('');
  const comparisons = buildComparisons(ours);
  const gapLines = [];
  for (const [className, rowIds] of Object.entries(CLASS_TO_ROWS)) {
    const line = diffLine(className, comparisons[className], rows, rowIds);
    if (line) gapLines.push(line);
  }
  if (gapLines.length) {
    for (const l of gapLines) lines.push(l);
  } else {
    lines.push('no gaps computed (either everything measured matched, or no ours candidate was found for any class).');
  }
  lines.push('');
  lines.push(`Total gap lines: ${gapLines.length}.`);

  return lines.join('\n');
}

async function main() {
  const { url, outFile } = parseArgs(process.argv);
  if (!url) {
    console.error('Usage: node scripts/design/look-diff.mjs <url> [--out <file.md>]');
    process.exit(2);
  }

  let mdText;
  try {
    mdText = readFileSync(RECIPE_PATH, 'utf8');
  } catch (err) {
    console.error(`Could not read the Airbnb look recipe at ${RECIPE_PATH}: ${err.message}`);
    process.exit(2);
  }
  const rows = parseAirbnbTable(mdText);
  if (Object.keys(rows).length === 0) {
    console.error('Could not parse "## The numbers" table out of airbnb--look-recipe.md.');
    process.exit(2);
  }

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
    const page = await context.newPage();

    const g = await guardedGoto(page, url, { expectSelector: 'body', minElements: 10, settleMs: 800 });
    if (!g.ok) {
      console.error(refusal(url, g));
      process.exitCode = 2;
      return;
    }

    // Solen's own 404 page (app/[locale]/not-found.tsx) renders real content (a headline, a body
    // line, an ink CTA), so guardedGoto's status/redirect/ERROR_UI/minElements checks all pass and
    // it is not caught above. It is not a real screen to grade against the Airbnb recipe though.
    // Its numeral is not translated: a locale-independent, oversized (clamp 96-120px) "404" text
    // node is the one signature every locale of this page shares, and no real Solen screen renders
    // that exact string at that size.
    const is404 = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('body *'));
      return els.some((el) => {
        if (el.children.length > 0) return false;
        if ((el.textContent || '').trim() !== '404') return false;
        const size = parseFloat(getComputedStyle(el).fontSize);
        return size >= 60;
      });
    });
    if (is404) {
      console.error(refusal(url, {
        reason: 'this app\'s own 404 page rendered (an oversized "404" numeral was found), not the requested screen',
      }));
      process.exitCode = 2;
      return;
    }

    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch {
      // best-effort: guardedGoto already proved the page rendered real content
    }
    await page.waitForTimeout(800);

    const ours = await measurePage(page);

    if (!ours.wordCount || ours.sizesSorted.length === 0) {
      console.error(`Page at ${url} rendered no text; nothing to measure.`);
      process.exitCode = 2;
      return;
    }

    const report = buildReport(url, ours, rows);
    if (outFile) {
      mkdirSync(path.dirname(outFile), { recursive: true });
      writeFileSync(outFile, report, 'utf8');
      console.log(`Wrote ${outFile}`);
    } else {
      console.log(report);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
