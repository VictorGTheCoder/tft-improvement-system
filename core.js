(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TFTCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SCHEMA_VERSION = 2;
  const STORAGE_KEY = 'tft_challenger_lab_v2';
  const LEGACY_KEY = 'tft_challenger_lab_v1';

  const SKILLS = ['Économie','Tempo','Items','Positionnement','Scouting','Flexibilité','Augments','Leveling','Roll-down','Pivot','Cap de board','Gestion PV','Évaluation de board'];
  const STAGES = ['2-1','2-3','2-5','2-7','3-1','3-2','3-5','3-7','4-1','4-2','4-5','4-7','5-1','5-2','5-5','5-7','6-1+'];

  function uid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }
  function isoNow() { return new Date().toISOString(); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function addDays(dateString, days) {
    const d = new Date((dateString || today()) + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }
  function seedPlayers() {
    return [
      ['Dishsoap','AMER','Flex, transitions, économie et cap de board','Riot / VOD'],
      ['Setsuko','AMER','Tempo, roll timings et sauvetage des mauvais spots','CompeteTFT / VOD'],
      ['Darth Nub','AMER','Décisions de tournoi et conversion des spots forts','Riot / VOD'],
      ['ZyK0o','EMEA','Tempo EMEA, flex et gestion du contest','Riot / VOD'],
      ['Jedusor','EMEA','Gestion de lobby, positionnement et cap','Riot / VOD'],
      ['oskuu','EUW','Adaptation rapide au patch et efficacité ladder','Tactics.tools']
    ].map(([name,region,focus,source]) => ({id:uid(),name,region,focus,source,confidence:1,active:true,createdAt:isoNow()}));
  }
  function emptyState() {
    return {
      schemaVersion: SCHEMA_VERSION,
      createdAt: isoNow(),
      updatedAt: isoNow(),
      matches: [],
      decisions: [],
      reviews: [],
      drills: [],
      players: seedPlayers(),
      goals: [],
      settings: { patch:'', lastBackup:null, lastAutoBackup:null },
      auditLog: []
    };
  }
  function normalizeArray(value) { return Array.isArray(value) ? value : []; }
  function migrate(raw) {
    const base = emptyState();
    if (!raw || typeof raw !== 'object') return base;
    const state = {
      ...base,
      ...raw,
      schemaVersion: SCHEMA_VERSION,
      matches: normalizeArray(raw.matches),
      decisions: normalizeArray(raw.decisions),
      reviews: normalizeArray(raw.reviews),
      drills: normalizeArray(raw.drills),
      players: normalizeArray(raw.players).length ? raw.players : base.players,
      goals: normalizeArray(raw.goals),
      auditLog: normalizeArray(raw.auditLog),
      settings: {...base.settings, ...(raw.settings || {})}
    };
    state.matches = state.matches.map(m => ({createdAt:isoNow(),updatedAt:isoNow(),...m}));
    state.decisions = state.decisions.map(d => ({createdAt:isoNow(),updatedAt:isoNow(),context:'',alternatives:'',playerId:'',...d}));
    state.reviews = state.reviews.map(r => ({status:'open',notes:'',createdAt:isoNow(),updatedAt:isoNow(),...r}));
    state.drills = state.drills.map(d => ({interval:1,ease:2.5,repetitions:0,due:today(),attempts:[],suspended:false,createdAt:isoNow(),updatedAt:isoNow(),...d}));
    state.players = state.players.map(p => ({confidence:1,active:true,createdAt:isoNow(),...p}));
    state.updatedAt = isoNow();
    return state;
  }
  function validateState(raw) {
    const errors = [];
    if (!raw || typeof raw !== 'object') return ['Le fichier ne contient pas un objet JSON.'];
    for (const key of ['matches','decisions','reviews','drills','players']) {
      if (!Array.isArray(raw[key])) errors.push(`Le champ ${key} doit être une liste.`);
    }
    if (Array.isArray(raw.matches)) raw.matches.forEach((m,i) => {
      if (!m.id) errors.push(`Partie ${i+1}: identifiant manquant.`);
      if (m.placement != null && (+m.placement < 1 || +m.placement > 8)) errors.push(`Partie ${i+1}: placement invalide.`);
    });
    if (Array.isArray(raw.decisions)) raw.decisions.forEach((d,i) => {
      if (!d.id) errors.push(`Décision ${i+1}: identifiant manquant.`);
      if (!d.matchId) errors.push(`Décision ${i+1}: partie liée manquante.`);
    });
    return errors;
  }
  function audit(state) {
    const matchIds = new Set(state.matches.map(x => x.id));
    const decisionIds = new Set(state.decisions.map(x => x.id));
    const playerIds = new Set(state.players.map(x => x.id));
    const urlCounts = {};
    state.matches.forEach(m => { if (m.url) urlCounts[m.url] = (urlCounts[m.url] || 0) + 1; });
    return {
      orphanDecisions: state.decisions.filter(d => !matchIds.has(d.matchId)).length,
      orphanReviews: state.reviews.filter(r => !decisionIds.has(r.decisionId)).length,
      orphanDrills: state.drills.filter(d => d.decisionId && !decisionIds.has(d.decisionId)).length,
      orphanPlayerLinks: state.decisions.filter(d => d.playerId && !playerIds.has(d.playerId)).length,
      duplicateMatchUrls: Object.values(urlCounts).filter(n => n > 1).reduce((sum,n) => sum + n - 1, 0),
      incompleteDecisions: state.decisions.filter(d => !d.action || !d.prediction || !d.category || !d.stage).length
    };
  }
  function addAudit(state, action, entity, entityId, detail='') {
    state.auditLog.push({id:uid(),date:isoNow(),action,entity,entityId,detail});
    if (state.auditLog.length > 500) state.auditLog = state.auditLog.slice(-500);
  }
  function learningValue(state, decision) {
    const repeated = state.decisions.filter(x => x.category === decision.category).length;
    const uncertainty = 6 - Math.max(1, Math.min(5, +(decision.confidence || 3)));
    const cost = Math.max(1, Math.min(5, +(decision.cost || 3)));
    const unresolved = decision.principle ? 1 : 1.25;
    return Math.round(cost * uncertainty * (1 + Math.min(repeated,5)/5) * unresolved * 10) / 10;
  }
  function addMatchWithDecision(state, matchData, decisionData, options={}) {
    const match = {id:uid(),createdAt:isoNow(),updatedAt:isoNow(),...matchData};
    const decision = {id:uid(),matchId:match.id,createdAt:isoNow(),updatedAt:isoNow(),...decisionData};
    state.matches.push(match); state.decisions.push(decision);
    if (options.needsReview) state.reviews.push({id:uid(),decisionId:decision.id,status:'open',notes:'',createdAt:isoNow(),updatedAt:isoNow()});
    if (options.makeDrill) state.drills.push(createDrillFromDecision(decision));
    addAudit(state,'create','match',match.id,`Placement ${match.placement}`);
    state.updatedAt = isoNow();
    return {match,decision};
  }
  function updateMatchDecision(state, matchId, matchPatch, decisionPatch) {
    const match = state.matches.find(x => x.id === matchId);
    const decision = state.decisions.find(x => x.matchId === matchId);
    if (!match || !decision) throw new Error('Partie ou décision introuvable.');
    Object.assign(match, matchPatch, {updatedAt:isoNow()});
    Object.assign(decision, decisionPatch, {updatedAt:isoNow()});
    addAudit(state,'update','match',match.id);
    state.updatedAt = isoNow();
    return {match,decision};
  }
  function deleteMatchCascade(state, matchId) {
    const decisionIds = state.decisions.filter(d => d.matchId === matchId).map(d => d.id);
    state.matches = state.matches.filter(m => m.id !== matchId);
    state.decisions = state.decisions.filter(d => d.matchId !== matchId);
    state.reviews = state.reviews.filter(r => !decisionIds.includes(r.decisionId));
    state.drills = state.drills.filter(d => !decisionIds.includes(d.decisionId));
    addAudit(state,'delete','match',matchId,`Cascade ${decisionIds.length} décision(s)`);
    state.updatedAt = isoNow();
  }
  function createDrillFromDecision(decision) {
    const context = decision.context ? `\nContexte : ${decision.context}` : '';
    const alternatives = decision.alternatives ? `\nOptions envisagées : ${decision.alternatives}` : '';
    return {
      id:uid(), decisionId:decision.id,
      question:`Stage ${decision.stage} — ${decision.category}${context}${alternatives}\nQue fais-tu et pourquoi ?`,
      answer:decision.principle || `Décision prise : ${decision.action}\nRaisonnement initial : ${decision.prediction}`,
      interval:1,ease:2.5,repetitions:0,due:today(),attempts:[],suspended:false,createdAt:isoNow(),updatedAt:isoNow()
    };
  }
  function ensureDrillForDecision(state, decisionId) {
    const existing = state.drills.find(d => d.decisionId === decisionId);
    if (existing) return {drill:existing,created:false};
    const decision = state.decisions.find(d => d.id === decisionId);
    if (!decision) throw new Error('Décision introuvable.');
    const drill = createDrillFromDecision(decision);
    state.drills.push(drill);
    addAudit(state,'create','drill',drill.id,`Depuis décision ${decisionId}`);
    return {drill,created:true};
  }
  function scheduleDrill(drill, rating, answerText='') {
    const r = Math.max(1, Math.min(5, +rating));
    if (r < 3) { drill.repetitions = 0; drill.interval = 1; }
    else {
      drill.repetitions = (drill.repetitions || 0) + 1;
      if (drill.repetitions === 1) drill.interval = 1;
      else if (drill.repetitions === 2) drill.interval = 3;
      else drill.interval = Math.max(1, Math.round(drill.interval * drill.ease));
      drill.ease = Math.max(1.3, drill.ease + (0.1 - (5-r)*(0.08+(5-r)*0.02)));
    }
    drill.attempts.push({date:isoNow(),rating:r,answerText});
    drill.due = addDays(today(), drill.interval);
    drill.updatedAt = isoNow();
    return drill;
  }
  function mergeImported(current, incoming) {
    const imported = migrate(incoming);
    const result = migrate(current);
    for (const key of ['matches','decisions','reviews','drills','players','goals','auditLog']) {
      const map = new Map(result[key].map(x => [x.id,x]));
      imported[key].forEach(x => map.set(x.id, x));
      result[key] = [...map.values()];
    }
    result.settings = {...result.settings,...imported.settings};
    result.updatedAt = isoNow();
    return result;
  }
  return {SCHEMA_VERSION,STORAGE_KEY,LEGACY_KEY,SKILLS,STAGES,uid,isoNow,today,addDays,emptyState,migrate,validateState,audit,learningValue,addMatchWithDecision,updateMatchDecision,deleteMatchCascade,createDrillFromDecision,ensureDrillForDecision,scheduleDrill,mergeImported};
});
