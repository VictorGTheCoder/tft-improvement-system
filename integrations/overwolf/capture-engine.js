'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  createCaptureState,
  migrateCaptureState,
  normalizeInfoUpdate,
  normalizeGameEvent,
  normalizeSystemEvent,
  reduceCaptureEvent,
  getSessionSummary
} = require('./capture-core');

class CaptureEngine {
  constructor({ storagePath }) {
    this.storagePath = storagePath;
    this.state = this.load();
  }

  load() {
    try {
      if (!fs.existsSync(this.storagePath)) return createCaptureState();
      return migrateCaptureState(JSON.parse(fs.readFileSync(this.storagePath, 'utf8')));
    } catch (error) {
      const state = createCaptureState();
      state.status = 'error';
      state.diagnostics.push(normalizeSystemEvent('storage-error', { message: error.message }));
      return state;
    }
  }

  save() {
    const directory = path.dirname(this.storagePath);
    const temporaryPath = `${this.storagePath}.tmp`;
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(temporaryPath, JSON.stringify(this.state, null, 2), 'utf8');
    fs.renameSync(temporaryPath, this.storagePath);
  }

  apply(event) {
    this.state = reduceCaptureEvent(this.state, event);
    this.save();
    return this.getPublicState();
  }

  ingestSystem(name, details) {
    return this.apply(normalizeSystemEvent(name, details));
  }

  ingestInfo(gameId, payload) {
    const payloads = Array.isArray(payload) ? payload : [payload];
    let publicState = this.getPublicState();
    for (const item of payloads) {
      for (const event of normalizeInfoUpdate(gameId, item)) publicState = this.apply(event);
    }
    return publicState;
  }

  ingestGameEvent(gameId, payload) {
    const payloads = Array.isArray(payload) ? payload : [payload];
    let publicState = this.getPublicState();
    for (const item of payloads) {
      for (const event of normalizeGameEvent(gameId, item)) publicState = this.apply(event);
    }
    return publicState;
  }

  getPublicState() {
    return {
      status: this.state.status,
      provider: this.state.provider,
      gameMode: this.state.gameMode,
      activeGameId: this.state.activeGameId,
      activeSession: getSessionSummary(this.state.activeSession),
      sessions: this.state.sessions.slice(-10).map(getSessionSummary),
      diagnosticCount: this.state.diagnostics.length,
      lastDiagnostic: this.state.diagnostics.at(-1) || null,
      storagePath: this.storagePath,
      updatedAt: this.state.updatedAt
    };
  }

  getDiagnostics(limit = 50) {
    const safeLimit = Math.max(1, Math.min(500, Number(limit) || 50));
    return this.state.diagnostics.slice(-safeLimit);
  }
}

module.exports = { CaptureEngine };
