// substance.js — substance/intervention log (THC, psilocybin, extensible) — modular feature (v0.58)
// Source of truth for substances no device tracks. Reads/writes substance_log Supabase table.
// All state lives here; main app calls window.* entry points via the data-a dispatcher.

const SUBSTANCE_TABLE = 'substance_log';

const SUBSTANCE_TYPES = ['THC', 'Psilocybin'];
const SUBSTANCE_METHODS = {
  'THC': ['Dry herb vape', 'Edible', 'Other'],
  'Psilocybin': ['Microdose', 'Macrodose']
};

const substanceState = { entries: [], loaded: false };

async function loadSubstances(days) {
  days = days || 90;
  var since = new Date();
  since.setDate(since.getDate() - days);
  var sinceStr = since.toISOString().slice(0, 10);
  try {
    var rows = await sbGet(SUBSTANCE_TABLE, 'select=*&date=gte.' + sinceStr + '&order=date.desc,time.desc');
    substanceState.entries = Array.isArray(rows) ? rows : [];
  } catch (e) {
    substanceState.entries = [];
  }
  substanceState.loaded = true;
  return substanceState.entries;
}

function pushSubstance(entry) {
  try { sbUpsert(SUBSTANCE_TABLE, entry); } catch (e) {}
}

async function deleteSubstanceRow(id) {
  try {
    await fetch(SB_URL + '/rest/v1/' + SUBSTANCE_TABLE + '?id=eq.' + encodeURIComponent(id), {
      method: 'DELETE', headers: sbHeaders()
    });
  } catch (e) {}
}

function rSubstanceCard() {
  var today = (typeof TODAY !== 'undefined' && TODAY.str) ? TODAY.str : new Date().toISOString().slice(0, 10);
  var todays = substanceState.entries.filter(function (e) { return e.date === today; });

  if (S.addingSubstance) return rSubstanceForm();

  var h = '<div class="vit-card" style="margin-top:.75rem">';
  h += '<div class="vit-head"><span class="vit-title">' + icn('leaf') + ' Substances</span>';
  h += '<button data-a="add-substance" style="background:none;border:none;color:var(--tx-info);font-size:13px;font-weight:500;font-family:var(--sans);cursor:pointer">+ Log</button></div>';

  if (!todays.length) {
    h += '<div style="font-size:13px;color:var(--tx3);padding:.35rem 0">None logged today</div>';
  } else {
    todays.forEach(function (e) {
      h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:.4rem 0;border-top:.5px solid var(--bd)">';
      h += '<div style="font-size:13px"><b>' + esc(e.substance) + '</b>'
        + (e.time ? ' <span style="color:var(--tx3);font-family:var(--mono)">' + esc(e.time) + '</span>' : '')
        + (e.method ? ' <span style="color:var(--tx2)">&middot; ' + esc(e.method) + '</span>' : '')
        + (e.dose ? ' <span style="color:var(--tx2)">&middot; ' + esc(e.dose) + '</span>' : '')
        + '</div>';
      h += '<button class="btn-edit" data-a="delete-substance" data-subid="' + esc(e.id) + '" style="color:var(--tx-err)">' + icn('trash') + '</button>';
      h += '</div>';
    });
  }
  h += '</div>';
  return h;
}

function rSubstanceForm() {
  var nowT = (typeof nowTime === 'function') ? nowTime() : new Date().toTimeString().slice(0, 5);
  var today = (typeof TODAY !== 'undefined' && TODAY.str) ? TODAY.str : new Date().toISOString().slice(0, 10);

  var h = '<div class="vit-card" style="margin-top:.75rem">';
  h += '<div class="vit-head"><span class="vit-title">' + icn('leaf') + ' Log substance</span></div>';

  h += '<div class="fi"><label class="fl" for="sub-type">Substance</label>';
  h += '<select id="sub-type" onchange="window.onSubstanceTypeChange&&window.onSubstanceTypeChange()">';
  SUBSTANCE_TYPES.forEach(function (t) { h += '<option value="' + esc(t) + '">' + esc(t) + '</option>'; });
  h += '</select></div>';

  h += '<div class="fi"><label class="fl" for="sub-method">Method</label>';
  h += '<select id="sub-method">';
  (SUBSTANCE_METHODS[SUBSTANCE_TYPES[0]] || []).forEach(function (m) { h += '<option value="' + esc(m) + '">' + esc(m) + '</option>'; });
  h += '</select></div>';

  h += '<div style="display:flex;gap:.5rem">';
  h += '<div class="fi" style="flex:1"><label class="fl" for="sub-date">Date</label><input id="sub-date" type="date" value="' + today + '"></div>';
  h += '<div class="fi" style="flex:1"><label class="fl" for="sub-time">Time</label><input id="sub-time" type="time" value="' + nowT + '"></div>';
  h += '</div>';

  h += '<div class="fi"><label class="fl" for="sub-dose">Dose <span class="fl-opt">optional</span></label>';
  h += '<input id="sub-dose" type="text" placeholder="e.g. 0.2g, 2 caps"></div>';
  h += '<div class="fi"><label class="fl" for="sub-note">Note <span class="fl-opt">optional</span></label>';
  h += '<input id="sub-note" type="text" placeholder="optional"></div>';

  h += '<div style="display:flex;gap:.5rem">';
  h += '<button class="btn-full" data-a="save-substance">Save</button>';
  h += '<button data-a="cancel-substance" style="background:none;border:.5px solid var(--bd2);border-radius:var(--r);padding:0 1rem;color:var(--tx2);font-family:var(--sans);cursor:pointer">Cancel</button>';
  h += '</div>';
  h += '</div>';
  return h;
}

window.onSubstanceTypeChange = function () {
  var typeEl = document.getElementById('sub-type');
  var methodEl = document.getElementById('sub-method');
  if (!typeEl || !methodEl) return;
  var methods = SUBSTANCE_METHODS[typeEl.value] || [];
  methodEl.innerHTML = methods.map(function (m) { return '<option value="' + esc(m) + '">' + esc(m) + '</option>'; }).join('');
};

window.doSaveSubstance = function () {
  var typeEl = document.getElementById('sub-type');
  var methodEl = document.getElementById('sub-method');
  var dateEl = document.getElementById('sub-date');
  var timeEl = document.getElementById('sub-time');
  var doseEl = document.getElementById('sub-dose');
  var noteEl = document.getElementById('sub-note');
  if (!typeEl) return;
  var entry = {
    id: 'sub_' + Date.now(),
    date: dateEl ? dateEl.value : TODAY.str,
    time: timeEl ? timeEl.value : null,
    substance: typeEl.value,
    method: methodEl ? methodEl.value : null,
    dose: (doseEl && doseEl.value.trim()) ? doseEl.value.trim() : null,
    note: (noteEl && noteEl.value.trim()) ? noteEl.value.trim() : null,
    created_at: new Date().toISOString()
  };
  substanceState.entries = [entry].concat(substanceState.entries);
  pushSubstance(entry);
  S.addingSubstance = false;
  render(false);
};

window.doDeleteSubstance = function (id) {
  if (!confirm('Delete this entry?')) return;
  substanceState.entries = substanceState.entries.filter(function (e) { return e.id !== id; });
  deleteSubstanceRow(id);
  render(false);
};
