'use strict';

const CAPTURE_VERSION = 1;
const IMPORTANT_STAGES = new Set(['2-1', '2-5', '3-2', '3-5', '4-1', '4-2', '4-5', '5-1']);
const MAX_DIAGNOSTICS = 500;
const MAX_SESSIONS = 50;

const ALLOWED_INFO_KEYS = new Set([
  'game_info.is_pbe',
  'me.summoner_name',
  'me.xp',
  'me.health',
  'me.rank',
  'me.gold',
  'match_info.pseudo_match_id',
  'match_info.battle_state',
  'match_info.match_state',
  'match_info.round_type',
  'match_info.game_mode',
  'match_info.local_player_damage',
  'store.shop_pieces',
  'board.board_pieces',
  'bench.bench_pieces'
]);

const ALLOWED_EVENT_NAMES = new Set([
  'match_start',
  'match_end',
  'round_start',
  'round_end',
  'battle_start',
  'battle_end',
  'shop_visible'
]);

function nowIso() {
  return new Date().toISOString();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseValue(value) {
  let result = value;
  for (let i = 0; i < 3 && typeof result === 'string'; i += 1) {
    const trimmed = result.trim();
    if (!trimmed || !['{', '[', '"'].includes(trimmed[0])) break;
    try {
      result = JSON.parse(trimmed);
    } catch (_) {
      break;
    }
  }
  return result;
}

function normalizeInfoUpdate(gameId, payload, receivedAt = nowIso()) {
  const value = parseValue(payload) || {};
  const records = [];

  if (value.feature && value.category && value.key) {
    records.push({
      kind: 'info',
      gameId,
      feature: String(value.feature),
      category: String(value.category),
      key: String(value.key),
      value: parseValue(value.value ?? value.data),
      receivedAt
    });
  }

  if (value.info && typeof value.info === 'object') {
    for (const [category, entries] of Object.entries(value.info)) {
      if (!entries || typeof entries !== 'object') continue;
      for (const [key, raw] of Object.entries(entries)) {
        records.push({
          kind: 'info',
          gameId,
          feature: String(value.feature || category),
          category: String(category),
          key: String(key),
          value: parseValue(raw),
          receivedAt
        });
      }
    }
  }

  return records;
}

function normalizeGameEvent(gameId, payload, receivedAt = nowIso()) {
  const value = parseValue(payload) || {};
  const source = Array.isArray(value.events) ? value.events : [value];
  return source
    .filter(event => event && event.name)
    .map(event => ({
      kind: 'event',
      gameId,
      name: String(event.name),
      value: parseValue(event.data ?? event.value),
      receivedAt
    }));
}

function normalizeSystemEvent(name, details = {}, receivedAt = nowIso()) {
  return {
    kind: 'system',
    name: String(name),
    value: parseValue(details),
    receivedAt
  };
}

function createCaptureState() {
  return {
    version: CAPTURE_VERSION,
    status: 'idle',
    provider: 'unavailable',
    gameMode: null,
    activeGameId: null,
    activeSession: null,
    sessions: [],
    diagnostics: [],
    updatedAt: nowIso()
  };
}

function migrateCaptureState(raw) {
  const base = createCaptureState();
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    version: CAPTURE_VERSION,
    sessions: Array.isArray(raw.sessions) ? raw.sessions.slice(-MAX_SESSIONS) : [],
    diagnostics: Array.isArray(raw.diagnostics) ? raw.diagnostics.slice(-MAX_DIAGNOSTICS) : []
  };
}

function isAllowedInfo(event) {
  return event.kind === 'info' && ALLOWED_INFO_KEYS.has(`${event.category}.${event.key}`);
}

function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function inProgress(value) {
  const parsed = parseValue(value);
  if (typeof parsed === 'boolean') return parsed;
  if (parsed && typeof parsed === 'object' && 'in_progress' in parsed) return Boolean(parsed.in_progress);
  if (typeof parsed === 'string') return parsed.toLowerCase() === 'true';
  return Boolean(parsed);
}

function appendDiagnostic(state, event) {
  let safeValue = event.value;
  const filteredInfo = event.kind === 'info' && !isAllowedInfo(event);
  const filteredGameEvent = event.kind === 'event' && !ALLOWED_EVENT_NAMES.has(event.name);

  if (filteredInfo) {
    safeValue = `[filtered ${event.category}.${event.key}]`;
  } else if (filteredGameEvent) {
    safeValue = `[filtered event ${event.name}]`;
  } else {
    try {
      const serialized = JSON.stringify(safeValue);
      if (serialized && serialized.length > 4000) safeValue = `${serialized.slice(0, 4000)}…`;
    } catch (_) {
      safeValue = '[unserializable payload]';
    }
  }

  state.diagnostics.push({ ...event, value: safeValue });
  if (state.diagnostics.length > MAX_DIAGNOSTICS) {
    state.diagnostics = state.diagnostics.slice(-MAX_DIAGNOSTICS);
  }
}

function startSession(state, at, reason = 'match_state') {
  if (state.activeSession) return state.activeSession;
  state.activeSession = {
    id: `capture-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    pseudoMatchId: null,
    startedAt: at,
    endedAt: null,
    endReason: null,
    placement: null,
    current: {
      stage: null,
      health: null,
      gold: null,
      level: null,
      currentXp: null,
      maxXp: null,
      board: null,
      bench: null,
      shop: null,
      localPlayerDamage: null
    },
    snapshots: [],
    source: reason,
    partial: false
  };
  state.status = 'capturing';
  return state.activeSession;
}

function upsertImportantSnapshot(session, at) {
  const stage = session.current.stage;
  if (!stage || !IMPORTANT_STAGES.has(stage)) return;
  const snapshot = { stage, capturedAt: at, ...clone(session.current) };
  const index = session.snapshots.findIndex(item => item.stage === stage);
  if (index >= 0) session.snapshots[index] = snapshot;
  else session.snapshots.push(snapshot);
}

function finishSession(state, at, reason = 'match_end') {
  const session = state.activeSession;
  if (!session) return null;
  session.endedAt = at;
  session.endReason = reason;
  state.sessions.push(session);
  if (state.sessions.length > MAX_SESSIONS) state.sessions = state.sessions.slice(-MAX_SESSIONS);
  state.activeSession = null;
  state.status = 'game-detected';
  return session;
}

function applyInfo(state, event) {
  if (!isAllowedInfo(event)) return;

  if (event.category === 'match_info' && event.key === 'game_mode') {
    state.gameMode = String(event.value || '').toLowerCase();
    if (state.gameMode !== 'tft' && state.activeSession) {
      state.activeSession.partial = true;
      finishSession(state, event.receivedAt, 'non_tft_mode');
    }
    return;
  }

  if (state.gameMode !== 'tft') return;

  if (event.category === 'match_info' && event.key === 'match_state') {
    if (inProgress(event.value)) startSession(state, event.receivedAt);
    else finishSession(state, event.receivedAt, 'match_state');
    return;
  }

  const session = state.activeSession;
  if (!session) return;

  if (event.category === 'me' && event.key === 'health') session.current.health = numeric(event.value);
  if (event.category === 'me' && event.key === 'gold') session.current.gold = numeric(event.value);
  if (event.category === 'me' && event.key === 'rank') {
    session.current.rank = numeric(event.value);
    session.placement = numeric(event.value);
  }
  if (event.category === 'me' && event.key === 'xp') {
    const xp = parseValue(event.value) || {};
    session.current.level = numeric(xp.level);
    session.current.currentXp = numeric(xp.current_xp);
    session.current.maxXp = numeric(xp.xp_max);
  }
  if (event.category === 'match_info' && event.key === 'pseudo_match_id') session.pseudoMatchId = String(event.value || '');
  if (event.category === 'match_info' && event.key === 'round_type') {
    const round = parseValue(event.value) || {};
    session.current.stage = round.stage || null;
  }
  if (event.category === 'match_info' && event.key === 'local_player_damage') session.current.localPlayerDamage = clone(event.value);
  if (event.category === 'board' && event.key === 'board_pieces') session.current.board = clone(event.value);
  if (event.category === 'bench' && event.key === 'bench_pieces') session.current.bench = clone(event.value);
  if (event.category === 'store' && event.key === 'shop_pieces') session.current.shop = clone(event.value);

  upsertImportantSnapshot(session, event.receivedAt);
}

function applyGameEvent(state, event) {
  if (state.gameMode !== 'tft') return;
  if (event.name === 'match_start') startSession(state, event.receivedAt, 'match_start');
  if (event.name === 'match_end') finishSession(state, event.receivedAt, 'match_end');
}

function applySystemEvent(state, event) {
  if (event.name === 'provider-ready') {
    state.provider = event.value?.provider || 'overwolf';
    state.status = 'ready';
  }
  if (event.name === 'provider-unavailable') {
    state.provider = 'unavailable';
    state.status = 'unavailable';
  }
  if (event.name === 'game-detected') {
    state.activeGameId = event.value?.gameId ?? null;
    state.status = 'game-detected';
  }
  if (event.name === 'game-exit') {
    if (state.activeSession) {
      state.activeSession.partial = true;
      finishSession(state, event.receivedAt, 'game_exit');
    }
    state.activeGameId = null;
    state.gameMode = null;
    state.status = 'ready';
  }
  if (event.name === 'provider-error') state.status = 'error';
}

function reduceCaptureEvent(rawState, event) {
  const state = migrateCaptureState(rawState);
  appendDiagnostic(state, event);
  if (event.kind === 'system') applySystemEvent(state, event);
  if (event.kind === 'info') applyInfo(state, event);
  if (event.kind === 'event') applyGameEvent(state, event);
  state.updatedAt = event.receivedAt || nowIso();
  return state;
}

function getSessionSummary(session) {
  if (!session) return null;
  return {
    id: session.id,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    placement: session.placement,
    snapshots: session.snapshots.length,
    lastStage: session.current?.stage || null,
    partial: Boolean(session.partial)
  };
}

module.exports = {
  CAPTURE_VERSION,
  IMPORTANT_STAGES,
  ALLOWED_INFO_KEYS,
  ALLOWED_EVENT_NAMES,
  parseValue,
  normalizeInfoUpdate,
  normalizeGameEvent,
  normalizeSystemEvent,
  createCaptureState,
  migrateCaptureState,
  reduceCaptureEvent,
  getSessionSummary
};
