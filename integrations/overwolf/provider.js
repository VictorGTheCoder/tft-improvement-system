'use strict';

const EventEmitter = require('node:events');

const REQUIRED_FEATURES = ['game_info', 'me', 'match_info', 'store', 'board', 'bench'];

function isRiotGameHost(gameId, name = '') {
  const id = String(gameId || '');
  return /teamfight tactics|league of legends/i.test(String(name)) || id.startsWith('5426');
}

class BaseProvider extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
    this.currentStatus = { provider: name, state: 'created', message: '' };
  }

  setStatus(state, message = '', extra = {}) {
    this.currentStatus = { provider: this.name, state, message, ...extra };
    this.emit('status', this.currentStatus);
  }

  getStatus() {
    return { ...this.currentStatus };
  }
}

class OverwolfProvider extends BaseProvider {
  constructor(electronApp) {
    super('overwolf');
    this.electronApp = electronApp;
    this.gep = null;
    this.initialized = false;
  }

  async start() {
    const packages = this.electronApp?.overwolf?.packages;
    if (!packages) {
      this.setStatus('unavailable', 'Overwolf packages are unavailable. Run with OW-Electron after approval.');
      this.emit('system', 'provider-unavailable', { provider: 'overwolf' });
      return;
    }

    this.setStatus('waiting', 'Waiting for the Overwolf GEP package.');
    packages.on('ready', (_event, packageName, version) => {
      if (packageName !== 'gep') return;
      this.initializeGep(packages.gep, version);
    });

    if (packages.gep) this.initializeGep(packages.gep, 'available');
  }

  initializeGep(gep, version) {
    if (this.initialized || !gep) return;
    this.initialized = true;
    this.gep = gep;

    this.setStatus('ready', `GEP package ready (${version}).`);
    this.emit('system', 'provider-ready', { provider: 'overwolf', version });

    gep.on('game-detected', async (event, gameId, name, gameInfo = {}) => {
      if (!isRiotGameHost(gameId, name)) return;
      try {
        event.enable();
        await gep.setRequiredFeatures(gameId, REQUIRED_FEATURES);
        this.setStatus('game-detected', `Riot game host detected: ${name || gameId}.`, { gameId });
        this.emit('system', 'game-detected', { gameId, name, gameInfo });
      } catch (error) {
        this.handleError(gameId, error);
      }
    });

    gep.on('game-exit', (_event, gameId, name, ...details) => {
      if (!isRiotGameHost(gameId, name)) return;
      this.setStatus('ready', 'The Riot game process exited.');
      this.emit('system', 'game-exit', { gameId, name, details });
    });

    gep.on('elevated-privileges-required', (_event, gameId, ...details) => {
      this.setStatus('privileges-required', 'TFT is running as administrator. Restart this app as administrator.', { gameId });
      this.emit('system', 'provider-error', { gameId, code: 'elevated-privileges-required', details });
    });

    gep.on('new-info-update', (_event, gameId, ...args) => {
      this.emit('info', gameId, args.length === 1 ? args[0] : args);
    });

    gep.on('new-game-event', (_event, gameId, ...args) => {
      this.emit('event', gameId, args.length === 1 ? args[0] : args);
    });

    gep.on('error', (_event, gameId, error, ...details) => {
      this.handleError(gameId, error, details);
    });
  }

  handleError(gameId, error, details = []) {
    const message = error?.message || String(error || 'Unknown GEP error');
    this.setStatus('error', message, { gameId });
    this.emit('system', 'provider-error', { gameId, message, details });
  }
}

class MockProvider extends BaseProvider {
  constructor() {
    super('mock');
    this.running = false;
  }

  async start() {
    this.setStatus('ready', 'Mock provider ready. No live TFT data is being used.');
    this.emit('system', 'provider-ready', { provider: 'mock', version: '1' });
  }

  async runScenario() {
    if (this.running) return false;
    this.running = true;
    const gameId = 5426;
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const info = payload => this.emit('info', gameId, payload);

    this.setStatus('game-detected', 'Running a simulated TFT match.', { gameId });
    this.emit('system', 'game-detected', { gameId, name: 'Teamfight Tactics (mock)' });
    await wait(60);
    info({ feature: 'match_info', category: 'match_info', key: 'game_mode', value: 'tft' });
    info({ feature: 'match_info', category: 'match_info', key: 'pseudo_match_id', value: 'mock-match-001' });
    info({ feature: 'match_info', category: 'match_info', key: 'match_state', value: '{"in_progress":true}' });
    await wait(60);
    info({ feature: 'match_info', category: 'match_info', key: 'round_type', value: '{"stage":"3-2","name":"PVP","type":"PVP"}' });
    info({ feature: 'me', category: 'me', key: 'health', value: '82' });
    info({ feature: 'me', category: 'me', key: 'gold', value: '31' });
    info({ feature: 'me', category: 'me', key: 'xp', value: '{"level":6,"current_xp":4,"xp_max":20}' });
    info({ feature: 'board', category: 'board', key: 'board_pieces', value: '{"unit_1":{"name":"TFT_MockTank","level":2,"x":0,"y":0}}' });
    await wait(60);
    info({ feature: 'match_info', category: 'match_info', key: 'round_type', value: '{"stage":"4-1","name":"PVP","type":"PVP"}' });
    info({ feature: 'me', category: 'me', key: 'health', value: '51' });
    info({ feature: 'me', category: 'me', key: 'gold', value: '48' });
    info({ feature: 'me', category: 'me', key: 'xp', value: '{"level":7,"current_xp":12,"xp_max":36}' });
    info({ feature: 'bench', category: 'bench', key: 'bench_pieces', value: '{"slot_1":{"name":"TFT_MockCarry","level":1}}' });
    await wait(60);
    info({ feature: 'me', category: 'me', key: 'rank', value: '4' });
    info({ feature: 'match_info', category: 'match_info', key: 'match_state', value: '{"in_progress":false}' });
    this.emit('system', 'game-exit', { gameId, name: 'Teamfight Tactics (mock)' });
    this.setStatus('ready', 'Mock scenario completed.');
    this.running = false;
    return true;
  }
}

function createProvider({ electronApp, mock = false }) {
  return mock ? new MockProvider() : new OverwolfProvider(electronApp);
}

module.exports = {
  REQUIRED_FEATURES,
  isRiotGameHost,
  OverwolfProvider,
  MockProvider,
  createProvider
};
