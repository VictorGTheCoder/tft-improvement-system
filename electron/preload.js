'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const api = {
  getStatus: () => ipcRenderer.invoke('overwolf:get-status'),
  getCaptureState: () => ipcRenderer.invoke('overwolf:get-capture-state'),
  getDiagnostics: limit => ipcRenderer.invoke('overwolf:get-diagnostics', limit),
  runMockScenario: () => ipcRenderer.invoke('overwolf:run-mock-scenario'),
  onStatus: callback => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('overwolf:status', listener);
    return () => ipcRenderer.removeListener('overwolf:status', listener);
  },
  onCaptureState: callback => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('overwolf:capture-state', listener);
    return () => ipcRenderer.removeListener('overwolf:capture-state', listener);
  }
};

contextBridge.exposeInMainWorld('tftOverwolf', api);

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function installPanel() {
  const dashboard = document.getElementById('dashboard');
  const worklist = document.getElementById('todayWorklist');
  if (!dashboard || !worklist || document.getElementById('overwolfIntegrationPanel')) return;

  const panel = document.createElement('article');
  panel.id = 'overwolfIntegrationPanel';
  panel.className = 'panel';
  panel.setAttribute('aria-labelledby', 'overwolfIntegrationTitle');
  panel.innerHTML = `
    <div class="panel-heading">
      <div>
        <p class="eyebrow">Capture automatique expérimentale</p>
        <h2 id="overwolfIntegrationTitle">Overwolf GEP</h2>
      </div>
      <span id="overwolfProviderBadge" class="badge">Chargement</span>
    </div>
    <p id="overwolfStatusMessage" class="muted">Lecture de l’état de l’intégration…</p>
    <div class="stats-grid" style="margin-top: 1rem">
      <div><span class="muted">État</span><strong id="overwolfCaptureStatus">—</strong></div>
      <div><span class="muted">Session active</span><strong id="overwolfActiveSession">Non</strong></div>
      <div><span class="muted">Sessions capturées</span><strong id="overwolfSessionCount">0</strong></div>
      <div><span class="muted">Dernier événement</span><strong id="overwolfLastEvent">—</strong></div>
    </div>
    <div class="form-actions" style="margin-top: 1rem">
      <button id="overwolfRefreshBtn" class="button button-secondary" type="button">Actualiser</button>
      <button id="overwolfMockBtn" class="button button-primary" type="button" hidden>Lancer une partie simulée</button>
      <span class="muted">Aucun conseil n’est affiché pendant une partie.</span>
    </div>
  `;
  dashboard.insertBefore(panel, worklist);

  const badge = document.getElementById('overwolfProviderBadge');
  const message = document.getElementById('overwolfStatusMessage');
  const captureStatus = document.getElementById('overwolfCaptureStatus');
  const activeSession = document.getElementById('overwolfActiveSession');
  const sessionCount = document.getElementById('overwolfSessionCount');
  const lastEvent = document.getElementById('overwolfLastEvent');
  const refreshButton = document.getElementById('overwolfRefreshBtn');
  const mockButton = document.getElementById('overwolfMockBtn');

  function renderStatus(status) {
    if (!status) return;
    badge.textContent = status.provider === 'mock' ? 'Simulation' : 'Overwolf';
    message.textContent = status.message || 'Aucun message du fournisseur.';
    mockButton.hidden = status.provider !== 'mock';
  }

  function renderCapture(state) {
    if (!state) return;
    captureStatus.textContent = state.status || '—';
    activeSession.textContent = state.activeSession
      ? `${state.activeSession.lastStage || 'partie en cours'} · ${state.activeSession.snapshots} snapshot(s)`
      : 'Non';
    sessionCount.textContent = String(state.sessions?.length || 0);
    lastEvent.textContent = state.lastDiagnostic
      ? `${state.lastDiagnostic.name || `${state.lastDiagnostic.category}.${state.lastDiagnostic.key}`} · ${formatDate(state.lastDiagnostic.receivedAt)}`
      : '—';
  }

  async function refresh() {
    const [status, state] = await Promise.all([api.getStatus(), api.getCaptureState()]);
    renderStatus(status);
    renderCapture(state);
  }

  refreshButton.addEventListener('click', refresh);
  mockButton.addEventListener('click', async () => {
    mockButton.disabled = true;
    mockButton.textContent = 'Simulation en cours…';
    try {
      await api.runMockScenario();
      await refresh();
    } finally {
      mockButton.disabled = false;
      mockButton.textContent = 'Lancer une partie simulée';
    }
  });

  api.onStatus(renderStatus);
  api.onCaptureState(renderCapture);
  refresh().catch(error => {
    message.textContent = `Diagnostic indisponible : ${error.message}`;
  });
}

window.addEventListener('DOMContentLoaded', installPanel, { once: true });
