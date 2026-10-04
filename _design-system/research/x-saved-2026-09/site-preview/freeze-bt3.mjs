// u-booking-time: no future slots exist in the database, so the time step is the frozen last-round page with the Uber rules applied on top.
import { chromium } from '/Users/sulo/Documents/solen/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const OUT = '/Users/sulo/Documents/solen/public/_research/site-mockup';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 402, height: 874 } });
await p.goto('http://127.0.0.1:3492/booking-time/index.html', { waitUntil: 'load' }); await p.waitForTimeout(1200);
await p.evaluate(() => document.querySelectorAll('[data-sys-box]').forEach((e) => e.removeAttribute('data-sys-box')));
await p.addScriptTag({ path: 'system3.js' }); await p.waitForTimeout(800); await p.evaluate(() => window.__applySystem());
let html = await p.evaluate(() => { window.setTimeout = () => 0; document.querySelectorAll('script').forEach((s) => s.remove()); return '<!doctype html>\n' + document.documentElement.outerHTML; });
html = html.replace(/href="\.\.\/(home|search|salon|booking-services|profile|rewards)\/index\.html"/g, 'href="../u-$1/index.html"');
html = html.replace('</body>', () => `<script>${fs.readFileSync('mock-interact3.js', 'utf8')}</script></body>`);
fs.mkdirSync(`${OUT}/u-booking-time`, { recursive: true }); fs.writeFileSync(`${OUT}/u-booking-time/index.html`, html);
console.log('u-booking-time', (html.length / 1024).toFixed(0) + 'KB'); await b.close();
