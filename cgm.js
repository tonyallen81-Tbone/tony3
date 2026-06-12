// cgm.js — CGM glucose + workout-annotated correlation view (modular rebuild step 5)
// == CGM v0.56 ==
const CGM_TABLE='cgm_readings';
function parseClarityCsv(text){const lines=text.split('\n').filter(l=>l.trim());const readings=[];let headerIdx=-1,headers=[];for(let i=0;i<Math.min(lines.length,20);i++){const cols=lines[i].split(',').map(c=>c.trim().replace(/"/g,''));if(cols.some(c=>c.toLowerCase().includes('timestamp')||c.toLowerCase()==='time')){headerIdx=i;headers=cols.map(c=>c.toLowerCase());break}}if(headerIdx<0)return{readings,error:'No header'};const tsIdx=headers.findIndex(h=>h.includes('timestamp')||h==='time');const glIdx=headers.findIndex(h=>h.includes('glucose')&&h.includes('mg'));if(tsIdx<0||glIdx<0)return{readings,error:'Missing columns'};const evIdx=headers.findIndex(h=>h.includes('event type'));const noteIdx=headers.findIndex(h=>h.includes('source')||h.includes('note'));for(let i=headerIdx+1;i<lines.length;i++){const cols=lines[i].split(',').map(c=>c.trim().replace(/"/g,''));if(!cols[tsIdx]||!cols[glIdx])continue;const glucose=parseFloat(cols[glIdx]);if(isNaN(glucose)||glucose<=0||glucose>600)continue;const dt=new Date(cols[tsIdx]);if(isNaN(dt.getTime()))continue;readings.push({id:'cgm_'+dt.getTime()+'_'+Math.random().toString(36).slice(2,6),timestamp:dt.toISOString(),glucose_mgdl:glucose,event_type:evIdx>=0?(cols[evIdx]||null):null,meal_notes:noteIdx>=0?(cols[noteIdx]||null):null,source:'clarity_csv'})}return{readings,error:null}}
async function cgmUpload(readings){if(!readings.length)return{uploaded:0,error:'No readings'};let uploaded=0;for(let i=0;i<readings.length;i+=500){const chunk=readings.slice(i,i+500);const res=await sbUpsert(CGM_TABLE,chunk,'id');if(res&&res.error)return{uploaded,error:res.error.message};uploaded+=chunk.length}return{uploaded,error:null}}
async function cgmLoad(days=30){const since=new Date();since.setDate(since.getDate()-days);try{const r=await fetch(SB_URL+'/rest/v1/'+CGM_TABLE+'?timestamp=gte.'+encodeURIComponent(since.toISOString())+'&order=timestamp.desc&limit=5000',{headers:sbHeaders()});if(!r.ok)return[];return await r.json()}catch(e){return[]}}
function cgmStats(readings){if(!readings.length)return null;const vals=readings.map(r=>r.glucose_mgdl);const avg=vals.reduce((a,b)=>a+b,0)/vals.length;const sd=Math.sqrt(vals.reduce((a,b)=>a+Math.pow(b-avg,2),0)/vals.length);const n=vals.length;const pct=v=>((v/n)*100).toFixed(0);return{avg:Math.round(avg),min:Math.min(...vals),max:Math.max(...vals),sd:Math.round(sd),cv:(sd/avg*100).toFixed(1),gmi:(3.31+0.02392*avg).toFixed(1),tir:{vhigh:pct(vals.filter(v=>v>180).length),high:pct(vals.filter(v=>v>140&&v<=180).length),inRange:pct(vals.filter(v=>v>=70&&v<=140).length),low:pct(vals.filter(v=>v>=54&&v<70).length),vlow:pct(vals.filter(v=>v<54).length)},count:n}}
function cgmByDay(readings){const days={};readings.forEach(r=>{const d=r.timestamp.substring(0,10);if(!days[d])days[d]=[];days[d].push(r.glucose_mgdl)});return Object.entries(days).sort((a,b)=>b[0].localeCompare(a[0])).map(([date,vals])=>({date,avg:Math.round(vals.reduce((a,b)=>a+b,0)/vals.length),tir:Math.round(vals.filter(v=>v>=70&&v<=140).length/vals.length*100),min:Math.min(...vals),max:Math.max(...vals),count:vals.length}))}
function cgmSparkline(readings,w=500,h=60){if(!readings.length)return'';const lo=40,hi=300;const pts=readings.map(r=>{const ts=new Date(r.timestamp);const x=((ts.getHours()*60+ts.getMinutes())/1440*w).toFixed(1);const y=Math.max(0,Math.min(h,h-((r.glucose_mgdl-lo)/(hi-lo)*h))).toFixed(1);return x+','+y}).join(' ');const yL=h-((70-lo)/(hi-lo)*h),yH=h-((140-lo)/(hi-lo)*h),yVH=h-((180-lo)/(hi-lo)*h);return'<svg class="cgm-svg" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none"><rect x="0" y="'+yH.toFixed(1)+'" width="'+w+'" height="'+(yL-yH).toFixed(1)+'" fill="rgba(29,158,117,.08)"/><line x1="0" y1="'+yH.toFixed(1)+'" x2="'+w+'" y2="'+yH.toFixed(1)+'" stroke="#BA7517" stroke-width=".5" stroke-dasharray="3,3" opacity=".5"/><line x1="0" y1="'+yL.toFixed(1)+'" x2="'+w+'" y2="'+yL.toFixed(1)+'" stroke="#378ADD" stroke-width=".5" stroke-dasharray="3,3" opacity=".5"/><line x1="0" y1="'+yVH.toFixed(1)+'" x2="'+w+'" y2="'+yVH.toFixed(1)+'" stroke="#E24B4A" stroke-width=".5" stroke-dasharray="3,3" opacity=".3"/><polyline points="'+pts+'" fill="none" stroke="#1D9E75" stroke-width="1.5" stroke-linejoin="round"/></svg>'}
function cgmBadge(val){if(!val)return'';const cls=val>180?'cgm-glucose-vhigh':val>140?'cgm-glucose-high':val<54?'cgm-glucose-vlow':val<70?'cgm-glucose-low':'cgm-glucose-ok';return'<span class="cgm-glucose-badge '+cls+'">'+val+' mg/dL</span>'}
const cgmState={readings:[],loaded:false,importing:false};
async function cgmHandleFile(file){if(!file||!file.name.endsWith('.csv')){alert('Please upload a Dexcom Clarity CSV file');return}cgmState.importing=true;rCgmPanel();const text=await file.text();const{readings,error}=parseClarityCsv(text);if(error||!readings.length){alert('Could not parse: '+(error||'No readings found'));cgmState.importing=false;rCgmPanel();return}const{error:upErr}=await cgmUpload(readings);if(upErr)alert('Upload error: '+upErr);cgmState.readings=await cgmLoad(30);cgmState.loaded=true;cgmState.importing=false;rCgmPanel()}
async function cgmClear(){if(!confirm('Delete all CGM data?'))return;try{await fetch(SB_URL+'/rest/v1/'+CGM_TABLE+'?source=eq.clarity_csv',{method:'DELETE',headers:sbHeaders()})}catch(e){}cgmState.readings=[];rCgmPanel()}
async function cgmInit(){if(cgmState.loaded)return;cgmState.readings=await cgmLoad(30);cgmState.loaded=true;rCgmPanel()}
function bindCgmEvents(){const z=document.getElementById("cgmDrop");const inp=document.getElementById("cgmFile");if(!z||!inp)return;inp.onchange=e=>{if(e.target.files[0])cgmHandleFile(e.target.files[0])};z.onclick=e=>{if(e.target!==inp)inp.click()};z.ondragover=e=>{e.preventDefault();z.classList.add('drag-over')};z.ondragleave=()=>z.classList.remove('drag-over');z.ondrop=e=>{e.preventDefault();z.classList.remove('drag-over');if(e.dataTransfer.files[0])cgmHandleFile(e.dataTransfer.files[0])}}
function rCgmPanel(){const el=document.getElementById('cgm-panel');if(el){el.innerHTML=buildCgm();bindCgmEvents()}}
function buildCgm(){const{readings,importing}=cgmState;const up='<div class="cgm-upload-zone" id="cgmDrop"><input type="file" id="cgmFile" accept=".csv"><div class="cgm-upload-icon">📊</div><div class="cgm-upload-label">'+(importing?'Importing...':'Drop Dexcom Clarity CSV or click to browse')+'</div><div class="cgm-upload-sub">Export from clarity.dexcom.com</div></div>';if(importing)return'<div style="padding:12px">'+up+'<div class="cgm-empty"><div class="cgm-upload-icon">⏳</div>Parsing...</div></div>';if(!readings.length)return'<div style="padding:12px">'+up+'<div class="cgm-empty"><div class="cgm-empty-icon">🩺</div>No CGM data yet.<br>Upload a Dexcom Clarity export to see your glucose trends.</div></div>';const s=cgmStats(readings);const days=cgmByDay(readings);const today=new Date().toISOString().substring(0,10);const todayR=readings.filter(r=>r.timestamp.substring(0,10)===today);var _14ago=new Date();_14ago.setDate(_14ago.getDate()-14);var fR=(readings||[]).filter(function(r){var d=new Date(r.timestamp);var h=d.getHours(),m=d.getMinutes();var mins=h*60+m;return d>=_14ago&&mins>=330&&mins<510;});var fV=fR.length?Math.round(fR.reduce(function(a,b){return a+b.glucose_mgdl;},0)/fR.length):null;var fC=fV?(fV<90?'#1D9E75':fV<100?'#BA7517':'#E24B4A'):'var(--color-text-tertiary)';
  const stats='<div class="cgm-stats-row"><div class="cgm-stat"><div class="cgm-stat-label">Average</div><div class="cgm-stat-value" style="color:'+(s.avg>140?'#BA7517':s.avg<70?'#378ADD':'#1D9E75')+'">'+s.avg+'</div><div class="cgm-stat-unit">mg/dL</div></div><div class="cgm-stat"><div class="cgm-stat-label">GMI</div><div class="cgm-stat-value" style="color:'+(parseFloat(s.gmi)>6.5?'#BA7517':'#1D9E75')+'">'+s.gmi+'</div><div class="cgm-stat-unit">%</div></div><div class="cgm-stat"><div class="cgm-stat-label">Std Dev</div><div class="cgm-stat-value">'+s.sd+'</div><div class="cgm-stat-unit">mg/dL</div></div><div class="cgm-stat"><div class="cgm-stat-label">CV</div><div class="cgm-stat-value" style="color:'+(parseFloat(s.cv)>36?'#BA7517':'#1D9E75')+'">'+s.cv+'</div><div class="cgm-stat-unit">% (target &lt;36)</div></div><div class="cgm-stat"><div class="cgm-stat-label">Fasting</div><div class="cgm-stat-value" style="color:'+(fV?fC:'var(--color-text-tertiary)')+'">' +(fV||'--')+'</div><div class="cgm-stat-unit">mg/dL 14d avg</div></div></div>';const tir='<div class="cgm-chart-wrap"><div class="cgm-chart-title">Time in Range &mdash; '+readings.length+' readings</div><div class="tir-bar"><div class="tir-seg tir-very-high" style="width:'+s.tir.vhigh+'%"></div><div class="tir-seg tir-high" style="width:'+s.tir.high+'%"></div><div class="tir-seg tir-in-range" style="width:'+s.tir.inRange+'%"></div><div class="tir-seg tir-low" style="width:'+s.tir.low+'%"></div><div class="tir-seg tir-very-low" style="width:'+s.tir.vlow+'%"></div></div><div class="tir-legend"><div class="tir-legend-item"><div class="tir-dot" style="background:#E24B4A"></div>Very High '+s.tir.vhigh+'%</div><div class="tir-legend-item"><div class="tir-dot" style="background:#BA7517"></div>High '+s.tir.high+'%</div><div class="tir-legend-item"><div class="tir-dot" style="background:#1D9E75"></div>In Range '+s.tir.inRange+'%</div><div class="tir-legend-item"><div class="tir-dot" style="background:#378ADD"></div>Low '+s.tir.low+'%</div><div class="tir-legend-item"><div class="tir-dot" style="background:#7B5EA7"></div>Very Low '+s.tir.vlow+'%</div></div></div>';const todayChart=todayR.length?'<div class="cgm-chart-wrap"><div class="cgm-chart-title">Today &mdash; Fasting: '+cgmBadge((()=>{const tv=S.vitals.find(function(v){return v.date===today;});return tv&&tv.glucose?tv.glucose:(fV||Math.round(todayR[0].glucose_mgdl));})())+'</div>'+cgmSparklineAnnotated(todayR, typeof corrState!=="undefined"&&corrState.data.cycles?corrState.data.cycles:[])+'<div style="display:flex;justify-content:space-between;font-size:9px;color:var(--color-text-tertiary);margin-top:4px"><span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>12am</span></div></div>':'';const dayRows=days.slice(0,14).map(d=>{const ac=d.avg>140?'#BA7517':d.avg<70?'#378ADD':'#1D9E75';const tc=d.tir>=70?'#1D9E75':d.tir>=50?'#BA7517':'#E24B4A';const dow=new Date(d.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});return'<div class="cgm-day-row"><span class="cgm-day-date">'+dow+'</span><span class="cgm-day-avg" style="color:'+ac+'">'+d.avg+' mg/dL</span><span class="cgm-day-tir" style="color:'+tc+'">'+d.tir+'% in range</span><span class="cgm-day-range">'+d.min+'&ndash;'+d.max+'</span></div>'}).join('');const table='<div class="cgm-chart-wrap"><div class="cgm-header-row"><div class="cgm-chart-title">Daily breakdown</div><div style="display:flex;gap:8px"><button class="cgm-import-btn" onclick="cgmFile.click()">+ Import CSV</button><button class="cgm-clear-btn" onclick="cgmClear()">Clear</button></div></div>'+dayRows+'</div>';return'<div style="padding:12px">'+up+stats+tir+todayChart+table+'</div>'}
function rCgm(){if(!cgmState.loaded)cgmInit();return'<div id="cgm-panel" style="overflow-y:auto;height:100%">'+buildCgm()+'</div>'}
// == END CGM ==

// == WHOOP WORKOUT ANNOTATIONS + CORRELATION VIEW v0.56 ==

// ── Load WHOOP cycles (strain/workout data) ──
async function whoopCyclesLoad(days=30){
  const since=new Date();since.setDate(since.getDate()-days);
  try{
    const r=await fetch(SB_URL+'/rest/v1/whoop_cycles?start_time=gte.'+encodeURIComponent(since.toISOString())+'&order=start_time.asc&limit=200',{headers:sbHeaders()});
    if(!r.ok)return[];
    return await r.json();
  }catch(e){return[];}
}

// ── Load WHOOP recovery ──
async function whoopRecoveryLoad(days=30){
  const since=new Date();since.setDate(since.getDate()-days);
  try{
    const r=await fetch(SB_URL+'/rest/v1/whoop_recovery?created_at=gte.'+encodeURIComponent(since.toISOString())+'&order=created_at.asc&limit=200',{headers:sbHeaders()});
    if(!r.ok)return[];
    return await r.json();
  }catch(e){return[];}
}

// ── Load Withings body scans ──
async function withingsBodyLoad(days=30){
  const since=new Date();since.setDate(since.getDate()-days);
  try{
    const r=await fetch(SB_URL+'/rest/v1/withings_body?date=gte.'+encodeURIComponent(since.toISOString().substring(0,10))+'&order=date.asc&limit=200',{headers:sbHeaders()});
    if(!r.ok)return[];
    return await r.json();
  }catch(e){return[];}
}

// ── CGM sparkline WITH workout annotations ──
function cgmSparklineAnnotated(readings, workouts, w=500, h=70){
  if(!readings.length)return'';
  const lo=40,hi=300;
  const todayStr=readings[0].timestamp.substring(0,10);
  
  // Plot glucose line
  const pts=readings.map(r=>{
    const ts=new Date(r.timestamp);
    const x=((ts.getHours()*60+ts.getMinutes())/1440*w).toFixed(1);
    const y=Math.max(0,Math.min(h,h-((r.glucose_mgdl-lo)/(hi-lo)*h))).toFixed(1);
    return x+','+y;
  }).join(' ');
  
  const yL=h-((70-lo)/(hi-lo)*h);
  const yH=h-((140-lo)/(hi-lo)*h);
  const yVH=h-((180-lo)/(hi-lo)*h);
  
  // Build workout annotation lines (only for same day)
  const wkLines=workouts.filter(w=>w.start_time&&w.start_time.substring(0,10)===todayStr&&w.score_strain>=5).map(w=>{
    const ts=new Date(w.start_time);
    const x=((ts.getHours()*60+ts.getMinutes())/1440*w).toFixed(1);
    const strain=w.score_strain||0;
    const ht=Math.min(h,Math.max(10,strain/21*h));
    const color=strain>=14?'#E24B4A':strain>=10?'#BA7517':'#1D9E75';
    return`<line x1="${x}" y1="${(h-ht).toFixed(1)}" x2="${x}" y2="${h}" stroke="${color}" stroke-width="2" opacity="0.7"><title>Strain ${strain.toFixed(1)} · ${ts.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</title></line>
    <text x="${x}" y="${(h-ht-3).toFixed(1)}" font-size="7" fill="${color}" text-anchor="middle" opacity="0.8">${strain.toFixed(0)}</text>`;
  }).join('');
  
  return`<div style="position:relative"><svg class="cgm-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <rect x="0" y="${yH.toFixed(1)}" width="${w}" height="${(yL-yH).toFixed(1)}" fill="rgba(29,158,117,.08)"/>
    <line x1="0" y1="${yH.toFixed(1)}" x2="${w}" y2="${yH.toFixed(1)}" stroke="#BA7517" stroke-width=".5" stroke-dasharray="3,3" opacity=".5"/>
    <line x1="0" y1="${yL.toFixed(1)}" x2="${w}" y2="${yL.toFixed(1)}" stroke="#378ADD" stroke-width=".5" stroke-dasharray="3,3" opacity=".5"/>
    <line x1="0" y1="${yVH.toFixed(1)}" x2="${w}" y2="${yVH.toFixed(1)}" stroke="#E24B4A" stroke-width=".5" stroke-dasharray="3,3" opacity=".3"/>
    ${wkLines}
    <polyline points="${pts}" fill="none" stroke="#1D9E75" stroke-width="1.5" stroke-linejoin="round"/>
  </svg></div>`;
}

// ── CORRELATION VIEW ──
const corrState={days:14,data:{},loaded:false};

async function corrLoad(days){
  corrState.days=days;
  corrState.loaded=false;
  const [cycles,recovery,body,cgm]=await Promise.all([
    whoopCyclesLoad(days),
    whoopRecoveryLoad(days),
    withingsBodyLoad(days),
    cgmLoad(days)
  ]);
  corrState.data={cycles,recovery,body,cgm};
  corrState.loaded=true;
  const el=document.getElementById('corr-panel');
  if(el){el.innerHTML=buildCorr();bindCorrEvents();}
}

function corrStreamSvg(points, color, yMin, yMax, w=500, h=50, fillOpacity=0.08){
  if(!points.length)return'<div class="corr-no-data">No data</div>';
  // Normalize to date positions over the day range
  const dates=points.map(p=>new Date(p.date||p.timestamp||p.created_at||p.start_time));
  const minT=Math.min(...dates.map(d=>d.getTime()));
  const maxT=Math.max(...dates.map(d=>d.getTime()))||minT+86400000;
  const range=maxT-minT||86400000;
  
  const pts=points.map((p,i)=>{
    const x=((dates[i].getTime()-minT)/range*(w-4)+2).toFixed(1);
    const val=parseFloat(p.val);
    const y=Math.max(2,Math.min(h-2,h-2-((val-yMin)/(yMax-yMin||1))*(h-4))).toFixed(1);
    return x+','+y;
  }).join(' ');
  
  // Fill area under line
  const firstX=((dates[0].getTime()-minT)/range*(w-4)+2).toFixed(1);
  const lastX=((dates[dates.length-1].getTime()-minT)/range*(w-4)+2).toFixed(1);
  const fillPts=firstX+','+h+' '+pts+' '+lastX+','+h;
  
  return`<svg class="corr-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="height:${h}px">
    <polygon points="${fillPts}" fill="${color}" opacity="${fillOpacity}"/>
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>`;
}

function buildCorr(){
  const {days,data,loaded}=corrState;
  if(!loaded)return'<div class="corr-no-data" style="padding:40px">Loading correlation data...</div>';
  
  const {cycles=[],recovery=[],body=[],cgm=[]}=data;
  
  // Date range buttons
  const btns=[7,14,30].map(d=>`<button class="corr-range-btn ${days===d?'active':''}" onclick="corrLoad(${d})">${d}d</button>`).join('');
  
  // 1. Glucose stream — daily averages from CGM
  const glucoseByDay={};
  cgm.forEach(r=>{const d=r.timestamp.substring(0,10);if(!glucoseByDay[d])glucoseByDay[d]=[];glucoseByDay[d].push(r.glucose_mgdl);});
  const glucosePoints=Object.entries(glucoseByDay).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,vals])=>({date,val:Math.round(vals.reduce((a,b)=>a+b,0)/vals.length)}));
  const glucoseAvg=glucosePoints.length?Math.round(glucosePoints.reduce((a,b)=>a+b.val,0)/glucosePoints.length):0;
  const glucoseStream=glucosePoints.length?corrStreamSvg(glucosePoints,'#1D9E75',60,180,500,50):'<div class="corr-no-data">Import Clarity CSV first</div>';
  
  // 2. WHOOP Recovery stream
  const recovPoints=recovery.map(r=>({date:(r.created_at||'').substring(0,10),val:r.score_recovery_score||r.recovery_score||r.score||0})).filter(p=>p.val>0);
  const recovAvg=recovPoints.length?Math.round(recovPoints.reduce((a,b)=>a+b.val,0)/recovPoints.length):0;
  const recovStream=recovPoints.length?corrStreamSvg(recovPoints,'#378ADD',0,100,500,50):'<div class="corr-no-data">Sync WHOOP to populate</div>';
  
  // 3. Strain stream
  const strainPoints=cycles.filter(c=>c.score_strain>0).map(c=>({date:(c.start_time||'').substring(0,10),val:parseFloat(c.score_strain)||0}));
  const strainAvg=strainPoints.length?(strainPoints.reduce((a,b)=>a+b.val,0)/strainPoints.length).toFixed(1):0;
  const strainStream=strainPoints.length?corrStreamSvg(strainPoints,'#E24B4A',0,21,500,50,0.12):'<div class="corr-no-data">Sync WHOOP to populate</div>';
  
  // 4. Body fat stream
  const fatPoints=body.filter(b=>b.fat_mass_kg&&b.weight_kg).map(b=>({date:b.date,val:parseFloat(((b.fat_mass_kg/b.weight_kg)*100).toFixed(1))}));
  const fatAvg=fatPoints.length?(fatPoints.reduce((a,b)=>a+b.val,0)/fatPoints.length).toFixed(1):0;
  const fatStream=fatPoints.length?corrStreamSvg(fatPoints,'#BA7517',10,25,500,50):'<div class="corr-no-data">Sync Withings to populate</div>';

  // Key events from logs (protocol starts, donations)
  const keyEvents=[
    {date:'2026-05-09',label:'Berberine start',color:'#BA7517'},
    {date:'2026-05-02',label:'Sema ↓ 10IU',color:'#7B5EA7'},
    {date:'2026-03-20',label:'Blood donation',color:'#E24B4A'},
  ].filter(e=>e.date>=new Date(Date.now()-days*86400000).toISOString().substring(0,10));

  const eventFlags=keyEvents.map(e=>`<span class="corr-event-flag">📌 ${e.date} ${e.label}</span>`).join(' ');

  return`<div class="corr-wrap">
    <div id="insights-ai-block"></div><div class="corr-header">
      <div class="corr-title">Correlation — Last ${days} days</div>
      <div class="corr-range-btns">${btns}</div>
    </div>
    ${keyEvents.length?'<div style="margin-bottom:12px;display:flex;flex-wrap:wrap;gap:6px">'+eventFlags+'</div>':''}
    
    <div class="corr-stream">
      <div class="corr-stream-header">
        <span class="corr-stream-label" style="color:#1D9E75">🩸 Glucose avg</span>
        <span class="corr-stream-stat">${glucoseAvg||'—'} mg/dL avg · target &lt;90 fasting</span>
      </div>
      ${glucoseStream}
    </div>
    
    <div class="corr-stream">
      <div class="corr-stream-header">
        <span class="corr-stream-label" style="color:#378ADD">💙 Recovery</span>
        <span class="corr-stream-stat">${recovAvg||'—'}% avg</span>
      </div>
      ${recovStream}
    </div>
    
    <div class="corr-stream">
      <div class="corr-stream-header">
        <span class="corr-stream-label" style="color:#E24B4A">🔥 Day Strain</span>
        <span class="corr-stream-stat">${strainAvg||'—'} avg · target 12–18</span>
      </div>
      ${strainStream}
    </div>
    
    <div class="corr-stream">
      <div class="corr-stream-header">
        <span class="corr-stream-label" style="color:#BA7517">⚖️ Body fat %</span>
        <span class="corr-stream-stat">${fatAvg||'—'}% avg · target ≤13%</span>
      </div>
      ${fatStream}
    </div>
    
    <div class="corr-legend">
      <div class="corr-legend-item"><div class="corr-dot" style="background:#1D9E75"></div>Glucose</div>
      <div class="corr-legend-item"><div class="corr-dot" style="background:#378ADD"></div>Recovery</div>
      <div class="corr-legend-item"><div class="corr-dot" style="background:#E24B4A"></div>Strain</div>
      <div class="corr-legend-item"><div class="corr-dot" style="background:#BA7517"></div>Body fat</div>
    </div>
  </div>`;
}

function bindCorrEvents(){} // range btns use inline onclick

function rCorr(){
  if(!corrState.loaded){corrLoad(corrState.days);return'<div id="corr-panel" style="overflow-y:auto;height:100%"><div class="corr-no-data" style="padding:40px">Loading...</div></div>';}
  return'<div id="corr-panel" style="overflow-y:auto;height:100%">'+buildCorr()+'</div>';
}
// == END CORRELATION + ANNOTATIONS ==
