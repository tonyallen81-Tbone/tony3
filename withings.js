// withings.js — Withings Body Scan / vascular / BP tab (modular rebuild step 8)
function doWithingsSync(){
  var btn=document.getElementById('withings-sync-btn');
  if(btn){btn.textContent='Syncing...';btn.disabled=true;}
  fetch('https://rlvvkepcqfzbvgwefjwc.supabase.co/functions/v1/withings-sync',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsdnZrZXBjcWZ6YnZnd2VmandjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1Mjk5MTcsImV4cCI6MjA5NDEwNTkxN30.GysmV5mwbpqta9jVA9butslrfVuSfRNZewledRaMR40'}
  }).then(function(r){return r.json();}).then(function(data){
    if(data.ok||data.status==='success'){
      S.withingsConnected=true;
      var p1=sbGet('withings_body','select=*&order=date.desc&limit=90').catch(function(){return[];});
      var p2=sbGet('withings_bp','select=*&order=date.desc&limit=90').catch(function(){return[];});
      var p3=sbGet('withings_vascular','select=*&order=date.desc&limit=90').catch(function(){return[];});
      Promise.all([p1,p2,p3]).then(function(res){
        S.withingsBody=Array.isArray(res[0])?res[0]:[];
        S.withingsBP=Array.isArray(res[1])?res[1]:[];
        S.withingsVascular=Array.isArray(res[2])?res[2]:[];
        render(false);
      });
    }else{
      alert('Sync error: '+(data.error||JSON.stringify(data)));
      render(false);
    }
  }).catch(function(e){
  if(e.message&&(e.message.toLowerCase().includes('refresh')||e.message.toLowerCase().includes('token')||e.message.toLowerCase().includes('invalid'))){
    if(confirm('Withings connection expired.\nClick OK to reconnect (opens Withings login in new tab).')){
      doWithingsReconnect();
    }
  } else {
    alert('Sync failed: '+e.message);
  }
  render(false);
});
}

function kgToLbs(kg){return kg?(kg*2.20462).toFixed(1):null;}
function kgToLbsRaw(kg){return kg?kg*2.20462:null;}

function rWithings(){  var h='<div class="body">';

  // Header
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.875rem">';
  h+='<div><div style="font-size:16px;font-weight:600">Withings Body Scan</div>';
  h+='<div style="font-size:11px;color:var(--tx3)">'+(S.withingsConnected?'Connected — '+S.withingsBody.length+' scans synced':'Not connected')+'</div></div>';
  if(S.withingsConnected){
    h+='<button id="withings-sync-btn" data-a="withings-sync" style="padding:6px 14px;background:var(--bg2);border:.5px solid var(--bd2);color:var(--tx);border-radius:var(--r);font-size:12px;font-weight:500;font-family:var(--sans)">'+icn('refresh')+' Sync now</button><button onclick="doWithingsReconnect()" style="font-size:11px;padding:5px 10px;background:none;border:.5px solid var(--color-border-secondary);border-radius:6px;color:var(--color-text-tertiary);cursor:pointer;margin-left:6px">Reconnect</button>';
  }else{
    h+='<a href="https://rlvvkepcqfzbvgwefjwc.supabase.co/functions/v1/withings-auth" style="padding:6px 14px;background:#000;color:#fff;border:none;border-radius:var(--r);font-size:13px;font-weight:500;font-family:var(--sans);text-decoration:none">Connect Withings</a>';
  }
  h+='</div>';

  if(!S.withingsConnected){
    h+='<div style="background:var(--bg2);border:.5px solid var(--bd);border-radius:var(--rl);padding:1.25rem;text-align:center">';
    h+='<div style="font-size:32px;margin-bottom:.75rem">'+icn('scale')+'</div>';
    h+='<div style="font-size:14px;font-weight:600;margin-bottom:.5rem">Connect your Withings Body Scan</div>';
    h+='<div style="font-size:13px;color:var(--tx2);line-height:1.6;margin-bottom:1rem">Sync body composition, vascular age, PWV, and blood pressure directly into Tony³.</div>';
    h+='<a href="https://rlvvkepcqfzbvgwefjwc.supabase.co/functions/v1/withings-auth" style="display:inline-block;padding:.75rem 1.5rem;background:#000;color:#fff;border-radius:var(--r);font-size:14px;font-weight:600;font-family:var(--sans);text-decoration:none">Connect Withings -></a>';
    h+='</div>';
    return h+'</div>';
  }

  var latest=S.withingsBody[0]||null;
  var prev=S.withingsBody[1]||null;
  // Sort vascular by date desc
  var sortedV=S.withingsVascular.slice().sort(function(a,b){return b.date.localeCompare(a.date);});
  var latestV=sortedV[0]||null;
  var latestBP=S.withingsBP[0]||null;

  // Latest body composition card
  if(latest){
    var wLbs=kgToLbs(latest.weight_kg);
    var fLbs=kgToLbs(latest.fat_mass_kg);
    var mLbs=kgToLbs(latest.muscle_mass_kg);
    var fatPct=latest.fat_mass_kg&&latest.weight_kg?(latest.fat_mass_kg/latest.weight_kg*100).toFixed(1):(latest.fat_ratio!=null?latest.fat_ratio.toFixed(1):null);
    var fatColor=fatPct<=14?'var(--tx-ok)':fatPct<=18?'var(--tx-warn)':'var(--tx-err)';
    var prevFat=prev&&prev.fat_ratio!=null?prev.fat_ratio:null;
    var fatDelta=fatPct&&prevFat?((parseFloat(fatPct)-prevFat)).toFixed(1):null;
    var prevMuscle=prev?kgToLbsRaw(prev.muscle_mass_kg):null;
    var muscleDelta=mLbs&&prevMuscle?(parseFloat(mLbs)-prevMuscle).toFixed(1):null;

    h+='<div style="background:var(--bg2);border:.5px solid var(--bd);border-radius:var(--rl);padding:1rem;margin-bottom:.75rem">';
    h+='<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--tx3);margin-bottom:.75rem">Latest scan — '+latest.date+'</div>';
    h+='<div style="display:flex;gap:.75rem;flex-wrap:wrap">';

    h+='<div style="flex:1;min-width:70px;text-align:center">';
    h+='<div style="font-size:28px;font-weight:700;font-family:var(--mono)">'+(wLbs||'--')+'</div>';
    h+='<div style="font-size:11px;color:var(--tx3)">Weight (lbs)</div></div>';

    h+='<div style="flex:1;min-width:70px;text-align:center">';
    h+='<div style="font-size:28px;font-weight:700;font-family:var(--mono);color:'+fatColor+'">'+(fatPct||'--')+'%</div>';
    h+='<div style="font-size:11px;color:var(--tx3)">Body fat</div>';
    if(fatDelta)h+='<div style="font-size:10px;color:'+(parseFloat(fatDelta)<0?'var(--tx-ok)':'var(--tx-err)')+'">'+( parseFloat(fatDelta)<0?'â':'â')+Math.abs(parseFloat(fatDelta))+'% vs prev</div>';
    h+='</div>';

    h+='<div style="flex:1;min-width:70px;text-align:center">';
    h+='<div style="font-size:28px;font-weight:700;font-family:var(--mono);color:var(--tx-info)">'+(mLbs||'--')+'</div>';
    h+='<div style="font-size:11px;color:var(--tx3)">Muscle (lbs)</div>';
    if(muscleDelta)h+='<div style="font-size:10px;color:'+(parseFloat(muscleDelta)>0?'var(--tx-ok)':'var(--tx-err)')+'">'+( parseFloat(muscleDelta)>0?'â':'â')+Math.abs(parseFloat(muscleDelta))+' lbs vs prev</div>';
    h+='</div>';

    if(latest.visceral_fat!=null){
      var vfColor=latest.visceral_fat<=9?'var(--tx-ok)':latest.visceral_fat<=14?'var(--tx-warn)':'var(--tx-err)';
      h+='<div style="flex:1;min-width:70px;text-align:center">';
      h+='<div style="font-size:28px;font-weight:700;font-family:var(--mono);color:'+vfColor+'">'+latest.visceral_fat.toFixed(1)+'</div>';
      h+='<div style="font-size:11px;color:var(--tx3)">Visceral fat</div></div>';
    }
    h+='</div>';

    // Target bars
    h+='<div style="margin-top:.875rem">';
    // Body fat target bar
    if(fatPct){
      var fatNum=parseFloat(fatPct);
      var fatPct2=Math.min(100,(fatNum/25)*100);
      var fatTarget=(14/25)*100;
      h+='<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.375rem">';
      h+='<div style="font-size:10px;color:var(--tx3);width:65px">Body fat</div>';
      h+='<div style="flex:1;position:relative;height:6px;background:var(--bd);border-radius:3px">';
      h+='<div style="position:absolute;left:0;top:0;height:100%;width:'+fatTarget+'%;background:var(--bg-ok);border-radius:3px"></div>';
      h+='<div style="position:absolute;left:0;top:0;height:100%;width:'+fatPct2+'%;background:'+fatColor+';border-radius:3px"></div>';
      h+='</div><div style="font-size:10px;color:var(--tx3);width:40px;text-align:right">Target 13%</div></div>';
    }
    // Muscle target bar
    if(mLbs){
      var mNum=parseFloat(mLbs);
      var mPct=Math.min(100,(mNum/170)*100);
      var mTarget=(157/170)*100;
      h+='<div style="display:flex;align-items:center;gap:.5rem">';
      h+='<div style="font-size:10px;color:var(--tx3);width:65px">Muscle</div>';
      h+='<div style="flex:1;position:relative;height:6px;background:var(--bd);border-radius:3px">';
      h+='<div style="position:absolute;left:0;top:0;height:100%;width:'+mTarget+'%;background:var(--bg-info);border-radius:3px"></div>';
      h+='<div style="position:absolute;left:0;top:0;height:100%;width:'+mPct+'%;background:var(--tx-info);border-radius:3px"></div>';
      h+='</div><div style="font-size:10px;color:var(--tx3);width:55px;text-align:right">Target 160 lbs</div></div>';
    }
    h+='</div></div>';
  }

  // Vascular card
  if(latestV){
    var vaColor=latestV.vascular_age<=49?'var(--tx-ok)':'var(--tx-warn)';
    var pwvColor=latestV.pwv&&latestV.pwv<7.0?'var(--tx-ok)':'var(--tx-warn)';
    h+='<div style="background:var(--bg2);border:.5px solid var(--bd);border-radius:var(--rl);padding:1rem;margin-bottom:.75rem">';
    h+='<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--tx3);margin-bottom:.75rem">Vascular health — '+latestV.date+'</div>';
    h+='<div style="display:flex;gap:1rem;flex-wrap:wrap">';
    h+='<div style="flex:1;text-align:center"><div style="font-size:32px;font-weight:700;font-family:var(--mono);color:'+vaColor+'">'+(latestV.vascular_age||'--')+'</div>';
    h+='<div style="font-size:11px;color:var(--tx3)">Vascular age</div>';
    h+='<div style="font-size:10px;color:var(--tx3)">Chron. age: 50</div></div>';
    if(latestV.pwv){
      h+='<div style="flex:1;text-align:center"><div style="font-size:32px;font-weight:700;font-family:var(--mono);color:'+pwvColor+'">'+latestV.pwv.toFixed(1)+'</div>';
      h+='<div style="font-size:11px;color:var(--tx3)">PWV (m/s)</div>';
      h+='<div style="font-size:10px;color:var(--tx3)">Target below 7.0</div></div>';
    }
    h+='</div></div>';
  }

  // Blood pressure card
  if(latestBP){
    var sysColor=latestBP.systolic<120?'var(--tx-ok)':latestBP.systolic<130?'var(--tx-warn)':'var(--tx-err)';
    h+='<div style="background:var(--bg2);border:.5px solid var(--bd);border-radius:var(--rl);padding:1rem;margin-bottom:.75rem">';
    h+='<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--tx3);margin-bottom:.75rem">Blood pressure — '+latestBP.date+'</div>';
    h+='<div style="display:flex;gap:1rem;flex-wrap:wrap">';
    h+='<div style="flex:1;text-align:center"><div style="font-size:28px;font-weight:700;font-family:var(--mono);color:'+sysColor+'">'+(latestBP.systolic||'--')+'/'+(latestBP.diastolic||'--')+'</div>';
    h+='<div style="font-size:11px;color:var(--tx3)">Systolic / Diastolic</div></div>';
    if(latestBP.heart_rate){
      h+='<div style="flex:1;text-align:center"><div style="font-size:28px;font-weight:700;font-family:var(--mono)">'+latestBP.heart_rate+'</div>';
      h+='<div style="font-size:11px;color:var(--tx3)">Heart rate (bpm)</div></div>';
    }
    h+='</div></div>';
  h+='<div id="withings-ecg-card" style="margin-bottom:12px"></div>';
  }

  
  // ECG + BP prompt cards
  (async () => {
    try {
      const ecgRes = await fetch(SB_URL+'/rest/v1/withings_ecg?order=date.desc&limit=1',{headers:sbHeaders()});
      const ecgData = ecgRes.ok ? await ecgRes.json() : [];
      const latestECG = ecgData[0];
      let ecgCard = '<div style="background:var(--color-background-secondary);border-radius:12px;padding:14px 16px;border:.5px solid var(--color-border-tertiary);margin-bottom:12px">';
      ecgCard += '<div style="font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:var(--color-text-tertiary);margin-bottom:8px">ECG / AFIB STATUS</div>';
      if(latestECG){
        const afibColor = latestECG.afib_classification==='normal'?'#1D9E75':latestECG.afib_classification==='afib'?'#E24B4A':'#BA7517';
        ecgCard += '<div style="font-size:22px;font-weight:500;color:'+afibColor+'">'+latestECG.afib_classification.toUpperCase()+'</div>';
        ecgCard += '<div style="font-size:11px;color:var(--color-text-tertiary);margin-top:2px">Last reading: '+latestECG.date+(latestECG.heart_rate?' · HR '+latestECG.heart_rate+' bpm':'')+'</div>';
      } else {
        ecgCard += '<div style="font-size:13px;color:var(--color-text-tertiary)">No ECG data yet — step on scale and grip handle for 30s</div>';
      }
      ecgCard += '</div>';
      const ecgEl = document.getElementById('withings-ecg-card');
      if(ecgEl) ecgEl.innerHTML = ecgCard;
    } catch(e) {}
  })();

  // Body composition trend table
  if(S.withingsBody.length>1){
    h+='<div style="font-size:13px;font-weight:600;margin-bottom:.5rem">Body composition history</div>';
    h+='<div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Date</th><th>Weight</th><th>Fat %</th><th>Muscle</th><th>Visceral</th></tr></thead><tbody>';
    S.withingsBody.slice(0,20).forEach(function(b){
      var f=b.fat_ratio!=null?b.fat_ratio.toFixed(1)+'%':'--';
      var fc=b.fat_ratio!=null?(b.fat_ratio<=14?'var(--tx-ok)':b.fat_ratio<=18?'var(--tx-warn)':'var(--tx-err)'):'var(--tx3)';
      h+='<tr>'
        +'<td style="font-family:var(--mono)">'+b.date+'</td>'
        +'<td style="font-family:var(--mono)">'+(kgToLbs(b.weight_kg)||'--')+' lbs</td>'
        +'<td><span style="font-weight:700;color:'+fc+';font-family:var(--mono)">'+f+'</span></td>'
        +'<td style="font-family:var(--mono)">'+(kgToLbs(b.muscle_mass_kg)||'--')+' lbs</td>'
        +'<td style="font-family:var(--mono)">'+(b.visceral_fat!=null?b.visceral_fat.toFixed(1):'--')+'</td>'
        +'</tr>';
    });
    h+='</tbody></table></div>';
  }

  return h+'</div>';
}
