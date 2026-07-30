'use strict';

const assert = require('node:assert/strict');
const {
  createCaptureState,
  normalizeInfoUpdate,
  normalizeGameEvent,
  normalizeSystemEvent,
  reduceCaptureEvent
} = require('../integrations/overwolf/capture-core');
const { isRiotGameHost, REQUIRED_FEATURES } = require('../integrations/overwolf/provider');

function applyAll(state, events) {
  return events.reduce((current, event) => reduceCaptureEvent(current, event), state);
}

let state = createCaptureState();
state = reduceCaptureEvent(state, normalizeSystemEvent('provider-ready', { provider: 'mock' }, '2026-07-30T20:00:00.000Z'));
state = reduceCaptureEvent(state, normalizeSystemEvent('game-detected', { gameId: 5426 }, '2026-07-30T20:00:01.000Z'));

state = applyAll(state, normalizeInfoUpdate(5426, {
  info: { match_info: { game_mode: 'tft' } },
  feature: 'match_info'
}, '2026-07-30T20:00:02.000Z'));

state = applyAll(state, normalizeInfoUpdate(5426, {
  feature: 'match_info',
  category: 'match_info',
  key: 'match_state',
  value: '{"in_progress":true}'
}, '2026-07-30T20:00:03.000Z'));
assert.equal(state.status, 'capturing');
assert.ok(state.activeSession);

const stage32 = [
  ...normalizeInfoUpdate(5426, { feature: 'match_info', category: 'match_info', key: 'round_type', value: '{"stage":"3-2"}' }, '2026-07-30T20:01:00.000Z'),
  ...normalizeInfoUpdate(5426, { feature: 'me', category: 'me', key: 'health', value: '80' }, '2026-07-30T20:01:01.000Z'),
  ...normalizeInfoUpdate(5426, { feature: 'me', category: 'me', key: 'gold', value: '30' }, '2026-07-30T20:01:02.000Z'),
  ...normalizeInfoUpdate(5426, { feature: 'me', category: 'me', key: 'xp', value: '{"level":6,"current_xp":4,"xp_max":20}' }, '2026-07-30T20:01:03.000Z')
];
state = applyAll(state, stage32);
assert.equal(state.activeSession.snapshots.length, 1);
assert.equal(state.activeSession.snapshots[0].stage, '3-2');
assert.equal(state.activeSession.snapshots[0].health, 80);
assert.equal(state.activeSession.snapshots[0].level, 6);

state = applyAll(state, normalizeInfoUpdate(5426, {
  feature: 'augments',
  category: 'me',
  key: 'picked_augment',
  value: '{"slot_1":{"name":"forbidden"}}'
}, '2026-07-30T20:01:04.000Z'));
assert.equal(state.activeSession.snapshots.length, 1, 'Forbidden augment data must not change the captured session.');

state = applyAll(state, normalizeInfoUpdate(5426, {
  feature: 'match_stats',
  category: 'match_stats',
  key: 'board_players',
  value: '[{"summoner":"opponent"}]'
}, '2026-07-30T20:01:05.000Z'));
assert.equal(state.activeSession.snapshots.length, 1, 'Opponent board data must not be stored in a session snapshot.');

state = applyAll(state, normalizeInfoUpdate(5426, {
  feature: 'match_info',
  category: 'match_info',
  key: 'round_type',
  value: '{"stage":"4-1"}'
}, '2026-07-30T20:02:00.000Z'));
state = applyAll(state, normalizeInfoUpdate(5426, {
  feature: 'me',
  category: 'me',
  key: 'rank',
  value: '4'
}, '2026-07-30T20:02:01.000Z'));
assert.equal(state.activeSession.snapshots.length, 2);
assert.equal(state.activeSession.placement, 4);

state = applyAll(state, normalizeInfoUpdate(5426, {
  feature: 'match_info',
  category: 'match_info',
  key: 'match_state',
  value: '{"in_progress":false}'
}, '2026-07-30T20:03:00.000Z'));
assert.equal(state.activeSession, null);
assert.equal(state.sessions.length, 1);
assert.equal(state.sessions[0].placement, 4);
assert.equal(state.sessions[0].snapshots.length, 2);

const gameEvents = normalizeGameEvent(5426, {
  events: [
    { name: 'round_start', data: 1 },
    { name: 'round_end', data: '{"result":"victory"}' }
  ]
});
assert.equal(gameEvents.length, 2);
assert.deepEqual(gameEvents[1].value, { result: 'victory' });

assert.equal(isRiotGameHost(54261, 'League of Legends'), true);
assert.equal(isRiotGameHost(9999, 'Other game'), false);
assert.deepEqual(REQUIRED_FEATURES, ['game_info', 'me', 'match_info', 'store', 'board', 'bench']);

const malformed = normalizeInfoUpdate(5426, '{not valid json');
assert.deepEqual(malformed, []);

console.log('OK — Overwolf capture tests passed');
