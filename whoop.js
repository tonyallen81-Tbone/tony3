// whoop.js — WHOOP recovery/sleep/strain tab (modular rebuild step 7)
function doWhoopSync(){
  var btn=document.getElementById('whoop-sync-btn');
  if(btn){btn.textContent='Syncing...';btn.disabled=true;}
  fetch('https://rlvvkepcqfzbvgwefjwc.supabase.co/functions/v1/whoop-sync',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsdnZrZXBjcWZ6YnZnd2VmandjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1Mjk5MTcsImV4cCI6MjA5NDEwNTkxN30.GysmV5mwbpqta9jVA9butslrfVuSfRNZewledRaMR40'}
  }).then(function(r){return r.json();}).then(function(data){
    if(data.status==='success'){
      S.whoopConnected=true;
      // Reload WHOOP data
      var p1=sbGet('whoop_recovery','select=*&order=created_at.desc&limit=90').catch(function(){return[];});
      var p2=sbGet('whoop_sleep','select=*&order=start_time.desc&limit=90').catch(function(){return[];});
      var p3=sbGet('whoop_cycles','select=*&order=start_time.desc&limit=90').catch(function(){return[];});
      Promise.all([p1,p2,p3]).then(function(res){
        S.whoopRecovery=Array.isArray(res[0])?res[0]:[];
        S.whoopSleep=Array.isArray(res[1])?res[1]:[];
        S.whoopCycles=Array.isArray(res[2])?res[2]:[];
        render(false);
      });
    }else{
      alert('Sync error: '+(data.error||'unknown'));
      render(false);
    }
  }).catch(function(e){alert('Sync failed: '+e.message);render(false);});
}

function fmtMins(ms){
  if(!ms)return '--';
  var m=Math.round(ms/60000);
  var h=Math.floor(m/60);
  var min=m%60;
  return h>0?h+'h '+(min>0?min+'m':''):min+'m';
}

function rWhoop(){
  var h='<div class="body">';

  // Header
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.875rem">';
  h+='<div><div style="font-size:16px;font-weight:600">WHOOP</div>';
  h+='<div style="font-size:11px;color:var(--tx3)">'+(S.whoopConnected?'Connected — '+S.whoopRecovery.length+' days synced':'Not connected')+'</div></div>';
  if(S.whoopConnected){
    h+='<button id="whoop-sync-btn" data-a="whoop-sync" style="padding:6px 14px;background:var(--bg2);border:.5px solid var(--bd2);color:var(--tx);border-radius:var(--r);font-size:12px;font-weight:500;font-family:var(--sans)">'+icn('refresh')+' Sync now</button>';
  }else{
    h+='<a href="https://rlvvkepcqfzbvgwefjwc.supabase.co/functions/v1/whoop-auth" style="padding:6px 14px;background:#000;color:#fff;border:none;border-radius:var(--r);font-size:13px;font-weight:500;font-family:var(--sans);text-decoration:none">Connect WHOOP</a>';
  }
  h+='</div>';

  if(!S.whoopConnected){
    h+='<div style="background:var(--bg2);border:.5px solid var(--bd);border-radius:var(--rl);padding:1.25rem;text-align:center">';
    h+='<div style="font-size:32px;margin-bottom:.75rem">'+icn('activity')+'</div>';
    h+='<div style="font-size:14px;font-weight:600;margin-bottom:.5rem">Connect your WHOOP</div>';
    h+='<div style="font-size:13px;color:var(--tx2);line-height:1.6;margin-bottom:1rem">Sync your HRV, recovery score, sleep data, strain, and workouts directly into Tony³.</div>';
    h+='<a href="https://rlvvkepcqfzbvgwefjwc.supabase.co/functions/v1/whoop-auth" style="display:inline-block;padding:.75rem 1.5rem;background:#000;color:#fff;border-radius:var(--r);font-size:14px;font-weight:600;font-family:var(--sans);text-decoration:none">Connect WHOOP -></a>';
    h+='</div>';
    return h+'</div>';
  }

  // Latest recovery card
  var latest=S.whoopRecovery[0];
  if(latest){
    var rec=latest.score_recovery_score;
    var hrv=latest.score_hrv_rmssd_milli?Math.round(latest.score_hrv_rmssd_milli):null;
    var rhr=latest.score_resting_heart_rate?Math.round(latest.score_resting_heart_rate):null;
    var recColor=rec>=67?'var(--tx-ok)':rec>=34?'var(--tx-warn)':'var(--tx-err)';
    h+='<div style="background:var(--bg2);border:.5px solid var(--bd);border-radius:var(--rl);padding:1rem;margin-bottom:.75rem">';
    h+='<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--tx3);margin-bottom:.75rem">Latest recovery — '+latest.created_at.slice(0,10)+'</div>';
    h+='<div style="display:flex;gap:1rem;flex-wrap:wrap">';
    h+='<div style="flex:1;min-width:80px;text-align:center"><div style="font-size:36px;font-weight:700;font-family:var(--mono);color:'+recColor+'">'+(rec!=null?Math.round(rec):'--')+'</div><div style="font-size:11px;color:var(--tx3)">Recovery %</div></div>';
    h+='<div style="flex:1;min-width:80px;text-align:center"><div style="font-size:36px;font-weight:700;font-family:var(--mono);color:var(--tx-info)">'+(hrv||'--')+'</div><div style="font-size:11px;color:var(--tx3)">HRV (ms)</div></div>';
    h+='<div style="flex:1;min-width:80px;text-align:center"><div style="font-size:36px;font-weight:700;font-family:var(--mono)">'+(rhr||'--')+'</div><div style="font-size:11px;color:var(--tx3)">Resting HR</div></div>';
    h+='</div></div>';
  }

  // Latest sleep card
  var latestSleep=S.whoopSleep.filter(function(s){return !s.nap;})[0];
  if(latestSleep){
    var perf=latestSleep.score_sleep_performance_percentage;
    var sws=latestSleep.score_total_slow_wave_sleep_time_milli;
    var rem=latestSleep.score_total_rem_sleep_time_milli;
    var total=latestSleep.score_total_in_bed_time_milli;
    var eff=latestSleep.score_sleep_efficiency_percentage;
    var perfColor=perf>=85?'var(--tx-ok)':perf>=70?'var(--tx-warn)':'var(--tx-err)';
    h+='<div style="background:var(--bg2);border:.5px solid var(--bd);border-radius:var(--rl);padding:1rem;margin-bottom:.75rem">';
    h+='<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--tx3);margin-bottom:.75rem">Latest sleep — '+latestSleep.start_time.slice(0,10)+'</div>';
    h+='<div style="display:flex;gap:1rem;flex-wrap:wrap">';
    h+='<div style="flex:1;min-width:80px;text-align:center"><div style="font-size:28px;font-weight:700;font-family:var(--mono);color:'+perfColor+'">'+(perf!=null?Math.round(perf)+'%':'--')+'</div><div style="font-size:11px;color:var(--tx3)">Performance</div></div>';
    h+='<div style="flex:1;min-width:80px;text-align:center"><div style="font-size:28px;font-weight:700;font-family:var(--mono);color:var(--tx-info)">'+fmtMins(sws)+'</div><div style="font-size:11px;color:var(--tx3)">Deep (SWS)</div></div>';
    h+='<div style="flex:1;min-width:80px;text-align:center"><div style="font-size:28px;font-weight:700;font-family:var(--mono)">'+fmtMins(rem)+'</div><div style="font-size:11px;color:var(--tx3)">REM</div></div>';
    h+='<div style="flex:1;min-width:80px;text-align:center"><div style="font-size:28px;font-weight:700;font-family:var(--mono)">'+fmtMins(total)+'</div><div style="font-size:11px;color:var(--tx3)">In bed</div></div>';
    h+='</div></div>';
  }

  // 14-day HRV + Strain trend
  if(S.whoopRecovery.length>1){
    var last14rec=S.whoopRecovery.slice(0,14).reverse();
    // Match cycles to recovery dates for strain
    var cycleMap={};
    S.whoopCycles.forEach(function(c){
      var d=c.start_time?c.start_time.slice(0,10):'';
      if(d)cycleMap[d]=c;
    });

    var hrvVals=last14rec.map(function(r){return r.score_hrv_rmssd_milli||0;});
    var maxHrv=Math.max.apply(null,hrvVals)||1;
    var minHrv=Math.min.apply(null,hrvVals.filter(function(v){return v>0;}))||0;
    var hrvRange=maxHrv-minHrv||1;

    // For strain: previous day's cycle strain
    var strainVals=last14rec.map(function(r,i){
      var prevDate=last14rec[i-1]?last14rec[i-1].created_at.slice(0,10):'';
      var cyc=cycleMap[prevDate];
      return cyc&&cyc.score_strain?cyc.score_strain:null;
    });
    var strainMax=Math.max.apply(null,strainVals.filter(function(v){return v!=null;}))||21;

    var chartH=120;
    h+='<div style="background:var(--bg2);border:.5px solid var(--bd);border-radius:var(--rl);padding:1rem;margin-bottom:.75rem">';
    h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.75rem">';
    h+='<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--tx3)">14-day HRV & Strain</div>';
    h+='<div style="display:flex;gap:.875rem;font-size:10px;color:var(--tx3)">';
    h+='<span><span style="display:inline-block;width:10px;height:3px;background:var(--tx-info);border-radius:2px;vertical-align:middle;margin-right:3px"></span>HRV</span>';
    h+='<span><span style="display:inline-block;width:10px;height:3px;background:var(--tx-err);border-radius:2px;vertical-align:middle;margin-right:3px"></span>Strain (prev day)</span>';
    h+='</div></div>';

    // SVG chart
    var svgW=600, svgH=chartH+40;
    var padL=30, padR=10, padT=10, padB=30;
    var chartW=svgW-padL-padR;
    var n=last14rec.length;
    var xStep=n>1?chartW/(n-1):chartW;

    // Build point coords
    var hrvPts=[], strainPts=[];
    last14rec.forEach(function(r,i){
      var x=padL+(i*xStep);
      var hrv=r.score_hrv_rmssd_milli||0;
      var yHrv=hrv>0?padT+chartH-((hrv-minHrv)/hrvRange*chartH):null;
      if(yHrv!=null)hrvPts.push({x:x,y:yHrv,hrv:Math.round(hrv)});
      else hrvPts.push(null);

      var prevDate=last14rec[i-1]?last14rec[i-1].created_at.slice(0,10):'';
      var cyc=cycleMap[prevDate];
      var strain=cyc&&cyc.score_strain?cyc.score_strain:null;
      if(strain!=null){
        var yStrain=padT+chartH-(strain/strainMax*chartH);
        strainPts.push({x:x,y:yStrain,strain:strain.toFixed(1)});
      }else{
        strainPts.push(null);
      }
    });

    // Build SVG path
    function makePath(pts,col){
      var d='';
      pts.forEach(function(p,i){
        if(!p)return;
        if(d===''||!pts[i-1])d+='M'+p.x.toFixed(1)+','+p.y.toFixed(1);
        else d+='L'+p.x.toFixed(1)+','+p.y.toFixed(1);
      });
      return d?'<path d="'+d+'" stroke="'+col+'" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/>':'';
    }

    var svg='<svg viewBox="0 0 '+svgW+' '+svgH+'" style="width:100%;height:'+(chartH+40)+'px">';
    // Grid lines
    svg+='<line x1="'+padL+'" y1="'+padT+'" x2="'+(svgW-padR)+'" y2="'+padT+'" stroke="var(--bd)" stroke-width="0.5"/>';
    svg+='<line x1="'+padL+'" y1="'+(padT+chartH/2)+'" x2="'+(svgW-padR)+'" y2="'+(padT+chartH/2)+'" stroke="var(--bd)" stroke-width="0.5" stroke-dasharray="3,3"/>';
    svg+='<line x1="'+padL+'" y1="'+(padT+chartH)+'" x2="'+(svgW-padR)+'" y2="'+(padT+chartH)+'" stroke="var(--bd)" stroke-width="0.5"/>';
    // Y labels HRV
    svg+='<text x="'+(padL-4)+'" y="'+(padT+4)+'" text-anchor="end" fill="var(--tx3)" font-size="9">'+Math.round(maxHrv)+'</text>';
    svg+='<text x="'+(padL-4)+'" y="'+(padT+chartH+4)+'" text-anchor="end" fill="var(--tx3)" font-size="9">'+Math.round(minHrv)+'</text>';
    // Lines
    svg+=makePath(hrvPts,'#3b82f6');
    svg+=makePath(strainPts.filter(function(p){return p;})[0]?strainPts:'','#ef4444');
    // HRV dots + values
    hrvPts.forEach(function(p,i){
      if(!p)return;
      var rec=last14rec[i].score_recovery_score||0;
      var col=rec>=67?'#22c55e':rec>=34?'#f59e0b':'#ef4444';
      svg+='<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="3" fill="'+col+'" stroke="white" stroke-width="1"/>';
    });
    // Strain dots
    strainPts.forEach(function(p){
      if(!p)return;
      svg+='<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="3" fill="#ef4444" stroke="white" stroke-width="1"/>';
    });
    // X axis labels (day names)
    last14rec.forEach(function(r,i){
      var x=padL+(i*xStep);
      var day=new Date(r.created_at+'').toLocaleDateString('en-US',{weekday:'short'});
      var dateShort=r.created_at.slice(5,10);
      svg+='<text x="'+x.toFixed(1)+'" y="'+(padT+chartH+18)+'" text-anchor="middle" fill="var(--tx3)" font-size="8">'+day+'</text>';
      svg+='<text x="'+x.toFixed(1)+'" y="'+(padT+chartH+28)+'" text-anchor="middle" fill="var(--tx3)" font-size="7">'+dateShort+'</text>';
    });
    svg+='</svg>';

    h+=svg;

    // Value summary row below chart
    h+='<div style="display:flex;justify-content:space-between;margin-top:.5rem;font-size:10px;color:var(--tx3)">';
    h+='<span>HRV range: <b style="color:var(--tx)">'+Math.round(minHrv)+' – '+Math.round(maxHrv)+' ms</b></span>';
    var strainFiltered=strainVals.filter(function(v){return v!=null;});
    if(strainFiltered.length){
      var avgStrain=(strainFiltered.reduce(function(a,b){return a+b;},0)/strainFiltered.length).toFixed(1);
      h+='<span>Avg strain: <b style="color:var(--tx)">'+avgStrain+'</b></span>';
    }
    h+='</div>';
    h+='</div>';
  }

  // 7-day recovery history table
  if(S.whoopRecovery.length){
    h+='<div style="font-size:13px;font-weight:600;margin-bottom:.5rem">Recent recovery history</div>';
    h+='<div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Date</th><th>Recovery</th><th>HRV</th><th>Resting HR</th><th>SpO2</th></tr></thead><tbody>';
    S.whoopRecovery.slice(0,14).forEach(function(r){
      var rec=r.score_recovery_score!=null?Math.round(r.score_recovery_score):null;
      var recColor=rec!=null?(rec>=67?'var(--tx-ok)':rec>=34?'var(--tx-warn)':'var(--tx-err)'):'var(--tx3)';
      h+='<tr>'
        +'<td style="font-family:var(--mono)">'+r.created_at.slice(0,10)+'</td>'
        +'<td><span style="font-weight:700;color:'+recColor+';font-family:var(--mono)">'+(rec!=null?rec+'%':'--')+'</span></td>'
        +'<td style="font-family:var(--mono)">'+(r.score_hrv_rmssd_milli?Math.round(r.score_hrv_rmssd_milli)+' ms':'--')+'</td>'
        +'<td style="font-family:var(--mono)">'+(r.score_resting_heart_rate?Math.round(r.score_resting_heart_rate)+' bpm':'--')+'</td>'
        +'<td style="font-family:var(--mono)">'+(r.score_spo2_percentage?Math.round(r.score_spo2_percentage)+'%':'--')+'</td>'
        +'</tr>';
    });
    h+='</tbody></table></div>';
  }

  return h+'</div>';
}
