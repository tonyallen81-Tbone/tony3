// oura.js — Oura Ring 4 integration (modular rebuild step 6)
// == OURA RING 4 INTEGRATION ==
const OURA_SYNC_URL = SB_URL + '/functions/v1/oura-sync';
const ouraState = {data: null, loaded: false, loading: false, syncing: false};

async function ouraSync() {
  if (ouraState.syncing) return;
  ouraState.syncing = true;
  rOuraPanelUpdate();
  try {
    const res = await fetch(OURA_SYNC_URL, {method:'POST', headers: sbHeaders()});
    const j = await res.json();
    if (j.error) throw new Error(j.error);
    await ouraLoadFromDB();
  } catch(e) { alert('Oura sync failed: ' + e.message); }
  ouraState.syncing = false;
  rOuraPanelUpdate();
}

async function ouraLoadFromDB() {
  ouraState.loading = true;
  try {
    const since = new Date(); since.setDate(since.getDate()-30);
    const sd = since.toISOString().substring(0,10);
    const [rRes, sRes] = await Promise.all([
      fetch(SB_URL+'/rest/v1/oura_readiness?date=gte.'+sd+'&order=date.desc&limit=30',{headers:sbHeaders()}),
      fetch(SB_URL+'/rest/v1/oura_sleep?date=gte.'+sd+'&order=date.desc&limit=30',{headers:sbHeaders()}),
    ]);
    ouraState.data = {
      readiness: rRes.ok ? await rRes.json() : [],
      sleep: sRes.ok ? await sRes.json() : [],
    };
  } catch(e) { ouraState.data = {readiness:[],sleep:[]}; }
  ouraState.loaded = true;
  ouraState.loading = false;
}

async function ouraInit() {
  if (ouraState.loading || ouraState.loaded) return;
  ouraState.loading = true;
  rOuraPanelUpdate();
  await ouraLoadFromDB();
  rOuraPanelUpdate();
}

function buildOura() {
  const {data, loaded, loading, syncing} = ouraState;
  const readiness = data?.readiness || [];
  const sleep = data?.sleep || [];
  const syncBtn = '<button class="cgm-import-btn" onclick="ouraSync()" style="font-size:12px;padding:7px 16px">' + (syncing ? 'Syncing...' : 'Sync now') + '</button>';
  const subText = readiness.length ? readiness.length + ' days synced' : 'No data yet';
  const header = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px"><div><div style="font-size:14px;font-weight:600">Oura Ring 4</div><div style="font-size:11px;color:var(--color-text-tertiary)">' + subText + '</div></div>' + syncBtn + '</div>';

  if (!loaded || loading) return '<div style="padding:12px">' + header + '<div class="cgm-empty"><div class="cgm-empty-icon">O</div>Loading Oura data...<br><br><div style="font-size:11px;line-height:1.6">If first sync:<br>1. Supabase Dashboard &rarr; Edge Functions &rarr; Secrets<br>2. Add <strong>OURA_PAT</strong> = your new token<br>3. Click Sync now</div></div></div>';

  if (!readiness.length) return '<div style="padding:12px">' + header + '<div class="cgm-empty"><div class="cgm-empty-icon">O</div>No Oura data yet.<br><br><div style="font-size:11px;line-height:1.6">1. Supabase &rarr; Edge Functions &rarr; Secrets<br>2. Add <strong>OURA_PAT</strong> = your Oura PAT<br>3. Click Sync now above</div></div></div>';

  const latest = readiness[0];
  const latestS = sleep[0];
  const rScore = latest?.score ?? '--';
  const sScore = latestS?.score ?? '--';
  const tempDev = latest?.temperature_deviation;
  const rColor = typeof rScore==='number'?(rScore>=80?'#1D9E75':rScore>=60?'#BA7517':'#E24B4A'):'var(--color-text-tertiary)';
  const sColor = typeof sScore==='number'?(sScore>=80?'#1D9E75':sScore>=60?'#BA7517':'#E24B4A'):'var(--color-text-tertiary)';
  const tColor = tempDev!==undefined?(Math.abs(tempDev)<0.5?'#1D9E75':Math.abs(tempDev)<1.0?'#BA7517':'#E24B4A'):'var(--color-text-tertiary)';
  const rAvg = readiness.length ? Math.round(readiness.reduce((a,b)=>a+(b.score||0),0)/readiness.length) : '--';

  let h = '<div style="padding:12px">' + header;
  h += '<div class="cgm-stats-row" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px">';
  h += '<div class="cgm-stat"><div class="cgm-stat-label">Readiness</div><div class="cgm-stat-value" style="color:'+rColor+'">'+rScore+'</div><div class="cgm-stat-unit">'+latest?.date+'</div></div>';
  h += '<div class="cgm-stat"><div class="cgm-stat-label">Sleep Score</div><div class="cgm-stat-value" style="color:'+sColor+'">'+sScore+'</div><div class="cgm-stat-unit">'+latestS?.date+'</div></div>';
  h += '<div class="cgm-stat"><div class="cgm-stat-label">Temp Deviation</div><div class="cgm-stat-value" style="color:'+tColor+'">'+(tempDev!==undefined?(tempDev>0?'+':'')+tempDev.toFixed(2):'--')+'</div><div class="cgm-stat-unit">deg C from baseline</div></div>';
  h += '</div>';
  h += '<div class="cgm-chart-wrap"><div class="cgm-chart-title">30-Day Readiness &mdash; avg ' + rAvg + '%</div>';
  readiness.slice(0,30).forEach(d => {
    const sc=d.score; const c=sc>=80?'#1D9E75':sc>=60?'#BA7517':'#E24B4A';
    const td=d.temperature_deviation;
    const tc=td!==undefined?(Math.abs(td)<0.5?'var(--color-text-tertiary)':Math.abs(td)<1?'#BA7517':'#E24B4A'):'var(--color-text-tertiary)';
    h+='<div class="cgm-day-row"><span class="cgm-day-date">'+d.date+'</span><span class="cgm-day-avg" style="color:'+c+'">'+sc+'%</span><span class="cgm-day-tir">readiness</span><span class="cgm-day-range" style="color:'+tc+'">'+(td!==undefined?(td>0?'+':'')+td.toFixed(2)+' deg C':'--')+'</span></div>';
  });
  h += '</div></div>';
  return h;
}

function rOuraPanelUpdate() { const el=document.getElementById('oura-panel'); if(el){el.innerHTML=buildOura();} }
function rOura() { if(!ouraState.loaded&&!ouraState.loading)ouraInit(); return '<div id="oura-panel" style="overflow-y:auto;height:100%">'+buildOura()+'</div>'; }
// == END OURA ==
