'use strict';

const scenario = [
  { delay: 0, type: 'system', label: 'game-detected', message: 'TFT process detected (synthetic)', status: 'capturing' },
  { delay: 650, type: 'event', label: 'match_start', message: 'Local capture session opened' },
  { delay: 1150, type: 'info', label: 'game_mode', message: 'tft' },
  { delay: 1650, type: 'info', label: 'round_type', message: 'stage 2-1', metrics: { stage: '2-1', health: 100, gold: 8, level: 4 }, snapshot: true },
  { delay: 2350, type: 'info', label: 'board_pieces', message: '6 local board pieces accepted' },
  { delay: 3050, type: 'info', label: 'round_type', message: 'stage 3-2', metrics: { stage: '3-2', health: 72, gold: 31, level: 6 }, snapshot: true },
  { delay: 3750, type: 'info', label: 'bench_pieces', message: '4 local bench pieces accepted' },
  { delay: 4450, type: 'filtered', label: 'match_stats.board_players', message: 'payload rejected and redacted' },
  { delay: 5150, type: 'filtered', label: 'augments', message: 'feature not requested; payload rejected' },
  { delay: 5850, type: 'info', label: 'round_type', message: 'stage 4-1', metrics: { stage: '4-1', health: 41, gold: 52, level: 7 }, snapshot: true },
  { delay: 6550, type: 'info', label: 'shop_pieces', message: '5 local shop pieces accepted' },
  { delay: 7250, type: 'info', label: 'round_type', message: 'stage 5-1', metrics: { stage: '5-1', health: 18, gold: 17, level: 8 }, snapshot: true },
  { delay: 7950, type: 'info', label: 'rank', message: 'final placement 4', placement: 4 },
  { delay: 8650, type: 'event', label: 'match_end', message: 'session closed; post-game review available', status: 'complete' }
];

const importantStages = new Set(['2-1', '3-2', '4-1', '5-1']);
const timers = [];
let running = false;
let snapshots = [];

const $ = id => document.getElementById(id);
const status = $('demoStatus');
const log = $('eventLog');
const timeline = $('timeline');
const reviewResult = $('reviewResult');
const startButton = $('startDemo');
const resetButton = $('resetDemo');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[character]));
}

function clearTimers() {
  while (timers.length) clearTimeout(timers.pop());
}

function appendLog(item) {
  const line = document.createElement('div');
  line.className = 'event-line';
  const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  line.innerHTML = `<b>${escapeHtml(item.type)}</b> ${escapeHtml(item.label)} · ${escapeHtml(item.message)} <span class="meta">${time}</span>`;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

function renderMetrics(metrics = {}) {
  if ('stage' in metrics) $('metricStage').textContent = metrics.stage;
  if ('health' in metrics) $('metricHealth').textContent = metrics.health;
  if ('gold' in metrics) $('metricGold').textContent = metrics.gold;
  if ('level' in metrics) $('metricLevel').textContent = metrics.level;
}

function renderSnapshots() {
  if (!snapshots.length) {
    timeline.innerHTML = '<p class="meta">No snapshot captured yet.</p>';
    return;
  }
  timeline.innerHTML = snapshots.map(snapshot => `
    <div class="timeline-item">
      <strong>${escapeHtml(snapshot.stage)}</strong>
      <p>${snapshot.health} HP · ${snapshot.gold} gold · level ${snapshot.level}. Stored for post-game context only.</p>
    </div>
  `).join('');
}

function applyItem(item) {
  appendLog(item);
  if (item.status) {
    status.dataset.status = item.status;
    status.textContent = item.status === 'capturing' ? 'Simulated match in progress' : 'Simulated match complete';
  }
  if (item.metrics) {
    renderMetrics(item.metrics);
    if (item.snapshot && importantStages.has(item.metrics.stage)) {
      snapshots = snapshots.filter(snapshot => snapshot.stage !== item.metrics.stage);
      snapshots.push({ ...item.metrics });
      renderSnapshots();
    }
  }
  if (item.placement) appendLog({ type: 'session', label: 'placement', message: `recorded as ${item.placement}` });
  if (item.label === 'match_end') {
    reviewResult.hidden = false;
    running = false;
    startButton.disabled = false;
    startButton.textContent = 'Run again';
  }
}

function resetDemo() {
  clearTimers();
  running = false;
  snapshots = [];
  status.dataset.status = 'idle';
  status.textContent = 'Ready to simulate';
  $('metricStage').textContent = '—';
  $('metricHealth').textContent = '—';
  $('metricGold').textContent = '—';
  $('metricLevel').textContent = '—';
  timeline.innerHTML = '<p class="meta">No snapshot captured yet.</p>';
  log.innerHTML = '<div class="event-line"><b>system</b> mock provider ready</div>';
  reviewResult.hidden = true;
  startButton.disabled = false;
  startButton.textContent = 'Start simulated match';
}

function startDemo() {
  resetDemo();
  running = true;
  startButton.disabled = true;
  status.dataset.status = 'capturing';
  status.textContent = 'Starting simulated match';
  scenario.forEach(item => timers.push(setTimeout(() => {
    if (running) applyItem(item);
  }, item.delay)));
}

startButton.addEventListener('click', startDemo);
resetButton.addEventListener('click', resetDemo);
