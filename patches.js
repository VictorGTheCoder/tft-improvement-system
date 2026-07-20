'use strict';

(function applyRuntimeFixes() {
  const core = window.TFTCore;
  if (!core) return;

  function localToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function addLocalDays(dateString, days) {
    const date = new Date(`${dateString || localToday()}T12:00:00`);
    date.setDate(date.getDate() + Number(days || 0));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  core.today = localToday;
  core.addDays = addLocalDays;
  core.addAudit = function addAudit(database, action, entity, entityId, detail = '') {
    if (!Array.isArray(database.auditLog)) database.auditLog = [];
    database.auditLog.push({
      id: core.uid(),
      date: core.isoNow(),
      action,
      entity,
      entityId,
      detail
    });
    if (database.auditLog.length > 500) database.auditLog = database.auditLog.slice(-500);
  };

  const originalAddMatchWithDecision = core.addMatchWithDecision;
  core.addMatchWithDecision = function addMatchWithDecisionLocalDate(database, matchData, decisionData, options) {
    const result = originalAddMatchWithDecision(database, matchData, decisionData, options);
    database.drills
      .filter(drill => drill.decisionId === result.decision.id && drill.attempts.length === 0)
      .forEach(drill => { drill.due = localToday(); });
    return result;
  };

  const originalEnsureDrill = core.ensureDrillForDecision;
  core.ensureDrillForDecision = function ensureDrillWithLocalDate(database, decisionId) {
    const result = originalEnsureDrill(database, decisionId);
    if (result.created) result.drill.due = localToday();
    return result;
  };

  const originalCreateDrill = core.createDrillFromDecision;
  core.createDrillFromDecision = function createDrillWithLocalDate(decision) {
    const drill = originalCreateDrill(decision);
    drill.due = localToday();
    return drill;
  };

  const originalScheduleDrill = core.scheduleDrill;
  core.scheduleDrill = function scheduleDrillWithLocalDate(drill, rating, answerText) {
    const result = originalScheduleDrill(drill, rating, answerText);
    result.due = addLocalDays(localToday(), result.interval);
    return result;
  };

  const prediction = document.getElementById('prediction');
  if (prediction) {
    prediction.removeAttribute('required');
    const label = document.querySelector('label[for="prediction"]');
    if (label) label.textContent = 'Prédiction initiale';
  }

  const matchDate = document.getElementById('matchDate');
  if (matchDate && !document.getElementById('editingMatchId')?.value) matchDate.value = localToday();

  function decorateDecisionDeletes() {
    document.querySelectorAll('#decisionTable [data-decision-id]').forEach(openButton => {
      const decision = state.decisions.find(item => item.id === openButton.dataset.decisionId);
      const cell = openButton.closest('td');
      if (!decision || !cell || cell.querySelector('[data-delete-match]')) return;
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'table-action';
      deleteButton.dataset.deleteMatch = decision.matchId;
      deleteButton.textContent = 'Supprimer';
      deleteButton.setAttribute('aria-label', `Supprimer la décision ${decision.stage} ${decision.category}`);
      cell.append(' ', deleteButton);
    });
  }

  const originalRenderDecisions = renderDecisions;
  renderDecisions = function renderDecisionsWithDelete() {
    originalRenderDecisions();
    decorateDecisionDeletes();
  };

  const decisionTable = document.getElementById('decisionTable');
  if (decisionTable) {
    new MutationObserver(decorateDecisionDeletes).observe(decisionTable, {
      childList: true,
      subtree: true
    });
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-delete-match]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    removeMatch(button.dataset.deleteMatch);
  });

  const captureForm = document.getElementById('matchForm');
  let editIntent = null;
  if (captureForm) {
    captureForm.addEventListener('submit', () => {
      const matchId = document.getElementById('editingMatchId').value;
      const essentialFields = ['category', 'stage', 'context', 'actionTaken'];
      if (!matchId || essentialFields.some(id => !document.getElementById(id).value.trim())) {
        editIntent = null;
        return;
      }
      const decision = state.decisions.find(item => item.matchId === matchId);
      editIntent = decision ? {
        decisionId: decision.id,
        needsReview: document.getElementById('needsReview').checked,
        makeDrill: document.getElementById('makeDrill').checked
      } : null;
    }, true);

    captureForm.addEventListener('submit', () => {
      const intent = editIntent;
      editIntent = null;
      if (!intent) return;
      setTimeout(() => {
        const decision = state.decisions.find(item => item.id === intent.decisionId);
        if (!decision) return;

        const review = state.reviews.find(item => item.decisionId === decision.id);
        if (intent.needsReview && !review) {
          state.reviews.push({
            id: core.uid(),
            decisionId: decision.id,
            status: 'open',
            notes: '',
            createdAt: core.isoNow(),
            updatedAt: core.isoNow()
          });
        } else if (!intent.needsReview && review) {
          state.reviews = state.reviews.filter(item => item.decisionId !== decision.id);
        }

        if (intent.makeDrill) core.ensureDrillForDecision(state, decision.id);
        else state.drills = state.drills.filter(item => item.decisionId !== decision.id);

        core.addAudit(state, 'update', 'learning-links', decision.id, 'Review et drill synchronisés');
        persist();
      }, 0);
    });
  }

  renderDecisions();
})();
