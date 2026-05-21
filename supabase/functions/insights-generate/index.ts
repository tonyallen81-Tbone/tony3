import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? ""
const SUPABASE_URL = "https://rlvvkepcqfzbvgwefjwc.supabase.co"
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

const SYSTEM_PROMPT = `You are Tony Allen's personal health optimization analyst. Be direct, specific, lead with the most important signals. No hedging. Use concrete numbers. Organize into exactly 4 sections:

🔴 PRIORITY FLAGS
🟡 PROTOCOL PERFORMANCE
🟢 WHAT'S WORKING
⚡ THIS WEEK'S FOCUS

Each section: 2-4 bullet points max starting with "- ". Each bullet under 25 words. No preamble. No sign-off.

ACTIVE PROTOCOLS:
- TRT: Testosterone Cypionate 100-120mg IM, weekly Saturday mornings
- HCG: 25 IU SQ, Mon/Wed/Fri mornings
- Semaglutide: 10 IU (~0.2mg) SQ weekly Saturday - at minimum effective dose taper. CGM fasting glucose is the signal. Target <90 mg/dL. DO NOT suggest increasing dose.
- CJC-1295 + Ipamorelin: 20 IU SQ, 3-4x/week pre-bed (never Fri/Sat) - deep sleep % is primary efficacy signal
- Creatine: 20g/day cap - artificially elevates serum creatinine. Flag this context when kidney markers appear.
- Berberine: 500mg 3x/day with meals
- NAD+ stack: NMN 500mg, Resveratrol 500mg, TMG 2000mg, CoQ10 200mg
- AG1, Vitamin D3 5000IU, Fish Oil 1200mg, Magnesium Glycinate, Magnesium L-Threonate

BIOMARKER TARGETS:
- Fasting glucose: <90 mg/dL - flag >=100 as priority
- Body fat: <=14% (from 15.1%)
- Muscle mass: >=157 lbs (from 155.6 lbs)
- E2: <40 pg/mL - last reading 64, chronically elevated, NOT on current panel. Fat loss is the E2 lever via aromatase.
- Hematocrit: 42-50% - >=52% = donate blood immediately
- Vascular age: <=47 (from 50)
- PWV: <7.0 m/s (from 7.5)
- HbA1c: <=5.6%

GENETICS:
- CYP19A1 C/T+C/C: elevated aromatase - body fat reduction IS E2 management
- COMT G/G: max 1 HIIT/week, walking therapeutic, chronic cardio depletes dopamine
- West African E1b1a: fast-twitch - compound lifts highest ROI, Saturday = heaviest session
- Nordic H15b: Zone 2 mitochondrial efficiency - rucking is optimal hybrid modality
- APOL1: kidney monitor - always flag creatinine with creatine context
- APOE4 clear: standard protocol

8-WEEK TARGETS: Body fat <=14%, muscle >=157 lbs, fasting glucose <90, HbA1c <=5.6%, E2 <40`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY secret not set in Supabase')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const since30 = new Date(); since30.setDate(since30.getDate() - 30)
    const since7 = new Date(); since7.setDate(since7.getDate() - 7)
    const s30 = since30.toISOString().substring(0, 10)
    const s7 = since7.toISOString().substring(0, 10)

    const [vitalsRes, logsRes, withingsRes, cgmRes, vascRes] = await Promise.all([
      supabase.from('vitals').select('date,energy,fasting_glucose').gte('date', s30).order('date', { ascending: false }).limit(30),
      supabase.from('daily_logs').select('logged_at,compound_name,dose,status').gte('logged_at', s30 + 'T00:00:00').order('logged_at', { ascending: false }).limit(300),
      supabase.from('withings_body').select('date,weight_kg,fat_mass_kg,muscle_mass_kg,fat_ratio').gte('date', s30).order('date', { ascending: false }).limit(60),
      supabase.from('cgm_readings').select('timestamp,glucose_value').gte('timestamp', s7 + 'T00:00:00').order('timestamp', { ascending: false }).limit(2016),
      supabase.from('withings_vascular').select('date,pwv,vascular_age').order('date', { ascending: false }).limit(10),
    ])

    const vitals = vitalsRes.data ?? []
    const logs = logsRes.data ?? []
    const withings = withingsRes.data ?? []
    const cgm = cgmRes.data ?? []
    const vasc = vascRes.data ?? []

    const vWithEnergy = vitals.filter(v => v.energy)
    const vWithGlucose = vitals.filter(v => v.fasting_glucose)
    const avgEnergy = vWithEnergy.length ? (vWithEnergy.reduce((a,v)=>a+v.energy,0)/vWithEnergy.length).toFixed(1) : null
    const avgGlucose = vWithGlucose.length ? Math.round(vWithGlucose.reduce((a,v)=>a+v.fasting_glucose,0)/vWithGlucose.length) : null
    const latestGlucose = vitals.find(v => v.fasting_glucose)?.fasting_glucose ?? null

    const latestBody = withings[0]
    const oldestBody = withings[withings.length - 1]
    const fatPct = latestBody?.fat_ratio != null ? (latestBody.fat_ratio * 100).toFixed(1) : (latestBody?.fat_mass_kg && latestBody?.weight_kg ? (latestBody.fat_mass_kg/latestBody.weight_kg*100).toFixed(1) : null)
    const muscleLb = latestBody?.muscle_mass_kg ? (latestBody.muscle_mass_kg * 2.205).toFixed(1) : null
    const weightDelta = (latestBody?.weight_kg && oldestBody?.weight_kg && latestBody.date !== oldestBody.date) ? ((latestBody.weight_kg - oldestBody.weight_kg) * 2.205).toFixed(1) : null

    const latestVasc = vasc[0]
    const egvs = cgm.filter(r => r.glucose_value > 0)
    const cgmAvg = egvs.length ? Math.round(egvs.reduce((a,r)=>a+r.glucose_value,0)/egvs.length) : null
    const inRange = egvs.length ? Math.round(egvs.filter(r=>r.glucose_value>=70&&r.glucose_value<=140).length/egvs.length*100) : null
    const fastingEgv = egvs.filter(r => { const h = new Date(r.timestamp).getHours(); return h>=5 && h<=8 })
    const fastingCgm = fastingEgv.length ? Math.round(fastingEgv.reduce((a,r)=>a+r.glucose_value,0)/fastingEgv.length) : null

    const last7 = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-i); return d.toISOString().substring(0,10) })
    const logsByDay = {}
    logs.forEach(l => { const d=(l.logged_at||'').substring(0,10); logsByDay[d]=(logsByDay[d]||0)+1 })
    const activeDays = last7.filter(d=>logsByDay[d]>0).length
    const thisWeekLogs = logs.filter(l => l.logged_at >= last7[6] + 'T00:00:00')
    const compoundCounts = {}
    thisWeekLogs.forEach(l => { const c=l.compound_name||'unknown'; compoundCounts[c]=(compoundCounts[c]||0)+1 })
    const topCompounds = Object.entries(compoundCounts).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([n,c])=>n+'('+c+'x)').join(', ')

    const dataBlock = [
      'TODAY: ' + new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}),
      '',
      'VITALS (last 30 days, ' + vitals.length + ' entries):',
      '- Avg energy: ' + (avgEnergy ?? 'no data') + '/10',
      '- Latest fasting glucose: ' + (latestGlucose ?? 'no data') + ' mg/dL',
      '- 30-day avg fasting glucose: ' + (avgGlucose ?? 'no data') + ' mg/dL',
      '',
      'CGM - LAST 7 DAYS (' + egvs.length + ' readings):',
      '- Avg glucose: ' + (cgmAvg ?? 'no data') + ' mg/dL',
      '- Time in range (70-140): ' + (inRange ?? '--') + '%',
      '- Fasting window avg (5-8am): ' + (fastingCgm ?? '--') + ' mg/dL',
      '',
      'BODY COMPOSITION (latest: ' + (latestBody?.date ?? 'no data') + '):',
      '- Body fat: ' + (fatPct ?? '--') + '% | target <=14%',
      '- Muscle mass: ' + (muscleLb ?? '--') + ' lbs | target >=157 lbs',
      '- Weight change (30-day): ' + (weightDelta != null ? weightDelta + ' lbs' : 'insufficient data'),
      '',
      'VASCULAR (latest: ' + (latestVasc?.date ?? 'no data') + '):',
      '- Vascular age: ' + (latestVasc?.vascular_age ?? '--') + ' | target <=47',
      '- PWV: ' + (latestVasc?.pwv ?? '--') + ' m/s | target <7.0',
      '',
      'PROTOCOL ADHERENCE:',
      '- Days logged this week: ' + activeDays + '/7',
      '- Compounds this week: ' + (topCompounds || 'none recorded'),
    ].join('\n')

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: "Analyze Tony's current data:\n\n" + dataBlock }] }),
    })
    if (!anthropicRes.ok) { const err = await anthropicRes.text(); throw new Error('Anthropic API error ' + anthropicRes.status + ': ' + err) }
    const anthropicData = await anthropicRes.json()
    const insights = anthropicData.content?.find(b => b.type === 'text')?.text ?? ''
    return new Response(JSON.stringify({ ok: true, insights, generatedAt: new Date().toISOString() }), { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
