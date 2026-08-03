'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const site = path.join(root, 'site');
const requiredFiles = [
  'index.html',
  'demo.html',
  'demo.js',
  'styles.css',
  'reviewer.html',
  'privacy.html',
  'terms.html',
  'compliance.html',
  'support.html'
];
const disclaimer = "TFT Improvement System isn't endorsed by Riot Games";

for (const relative of requiredFiles) {
  assert.ok(fs.existsSync(path.join(site, relative)), `Missing required site file: ${relative}`);
}

const htmlFiles = requiredFiles.filter(file => file.endsWith('.html'));
for (const relative of htmlFiles) {
  const filename = path.join(site, relative);
  const html = fs.readFileSync(filename, 'utf8');

  assert.match(html, /<!doctype html>/i, `${relative} must declare HTML5`);
  assert.match(html, /<meta name="viewport"/i, `${relative} must be responsive`);
  assert.ok(html.includes(disclaimer), `${relative} must include the Riot disclaimer`);
  assert.ok(!/TODO|REPLACE_ME|YOUR_DOMAIN|YOUR_EMAIL/i.test(html), `${relative} contains a public placeholder`);

  const resourcePattern = /<(?:script|link)[^>]+(?:src|href)="([^"]+)"/gi;
  for (const match of html.matchAll(resourcePattern)) {
    const reference = match[1];
    assert.ok(!/^https?:\/\//i.test(reference), `${relative} loads an external executable resource: ${reference}`);
    if (reference.startsWith('#') || reference.startsWith('data:')) continue;
    const target = path.resolve(path.dirname(filename), reference.split(/[?#]/)[0]);
    assert.ok(fs.existsSync(target), `${relative} references missing resource: ${reference}`);
  }

  const localLinkPattern = /href="([^"#][^"]*)"/gi;
  for (const match of html.matchAll(localLinkPattern)) {
    const reference = match[1];
    if (/^(?:https?:|mailto:)/i.test(reference)) continue;
    const clean = reference.split(/[?#]/)[0];
    if (!clean || clean === 'app/' || clean.startsWith('app/')) continue;
    const target = path.resolve(path.dirname(filename), clean);
    assert.ok(fs.existsSync(target), `${relative} links to missing local target: ${reference}`);
  }
}

const demoScript = fs.readFileSync(path.join(site, 'demo.js'), 'utf8');
assert.ok(demoScript.includes("match_stats.board_players"), 'Demo must visibly demonstrate opponent-data filtering');
assert.ok(demoScript.includes("augments"), 'Demo must visibly demonstrate augment-data filtering');
assert.ok(demoScript.includes("match_end"), 'Demo must complete the post-game transition');

const privacy = fs.readFileSync(path.join(site, 'privacy.html'), 'utf8');
assert.match(privacy, /local storage/i, 'Privacy Policy must describe browser local storage');
assert.match(privacy, /does not use Riot Sign On/i, 'Privacy Policy must disclose current RSO status');

const terms = fs.readFileSync(path.join(site, 'terms.html'), 'utf8');
assert.match(terms, /Competitive integrity/i, 'Terms must contain a competitive-integrity section');

const reviewer = fs.readFileSync(path.join(site, 'reviewer.html'), 'utf8');
assert.match(reviewer, /Five-minute review path/i, 'Reviewer page must provide a concise test flow');
assert.match(reviewer, /does not currently call the Riot Games API/i, 'Reviewer page must disclose current Riot API usage');

const compliance = fs.readFileSync(path.join(site, 'compliance.html'), 'utf8');
assert.match(compliance, /use no Riot or Teamfight Tactics logo/i, 'Compliance page must state the brand-asset boundary');
assert.match(compliance, /does not imitate the Teamfight Tactics client/i, 'Compliance page must state that the product is visually independent');

console.log(`Validated ${requiredFiles.length} public site files and ${htmlFiles.length} HTML pages.`);
