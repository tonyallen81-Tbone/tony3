import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const WITHINGS_CLIENT_ID = "e7aea96d61b583e6d9e8099c762953c5a63bb911925b3cd302d48461ea25b80b"
const WITHINGS_CLIENT_SECRET = "8f3a028e251d9482836473393931b4b95545f8023a6de4897d8f8c935cfb08ee"
const SUPABASE_URL = "https://rlvvkepcqfzbvgwefjwc.supabase.co"
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

async function refreshToken(supabase) {
  const { data: tokenRow } = await supabase.from('withings_tokens').select('*').single()
  if (!tokenRow) throw new Error('No token found')
  const params = new URLSearchParams({ action: 'requesttoken', grant_type: 'refresh_token', client_id: WITHINGS_CLIENT_ID, client_secret: WITHINGS_CLIENT_SECRET, refresh_token: tokenRow.refresh_token })
  const res = await fetch('https://wbsapi.withings.net/v2/oauth2', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params })
  const json = await res.json()
  if (json.status !== 0) throw new Error('Token refresh failed: ' + json.error)
  const { access_token, refresh_token, expires_in } = json.body
  await supabase.from('withings_tokens').update({ access_token, refresh_token, expires_at: new Date(Date.now() + expires_in * 1000).toISOString() }).eq('id', tokenRow.id)
  return access_token
}

function extractMeas(groups, meastype) {
  for (const g of groups) for (const m of (g.measures || [])) if (m.type === meastype) return m.value * Math.pow(10, m.unit)
  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const token = await refreshToken(supabase)
    const auth = { 'Authorization': `Bearer ${token}` }
    const since = String(Math.floor(Date.now() / 1000) - 90 * 86400)

    // 1. Body + segmental + nerve
    const measParams = new URLSearchParams({ action: 'getmeas', category: '1', lastupdate: since, meastype: '1,6,8,5,76,88,77,170,91,168,174,175,176,177,178,183,184,185,186,187,135,136,80,171' })
    const measJson = await (await fetch('https://wbsapi.withings.net/measure?' + measParams, { headers: auth })).json()
    const allTypes = new Set()
    // DEBUG: log all measure types
    if (measJson.status === 0) {
      ;(measJson.body?.measuregrps || []).forEach(g => g.measures.forEach(m => allTypes.add(m.type)))
      console.log('WITHINGS_MEASTYPE_DEBUG:', JSON.stringify([...allTypes].sort((a,b)=>a-b)))
    }
    if (measJson.status === 0 && measJson.body?.measuregrps?.length) {
      const byDate = {}
      for (const g of measJson.body.measuregrps) { const d = new Date(g.date * 1000).toISOString().substring(0,10); if (!byDate[d]) byDate[d] = []; byDate[d].push(g) }
      await supabase.from('withings_body').upsert(Object.entries(byDate).map(([date, groups]) => ({ id: `body_${date}`, date, weight_kg: extractMeas(groups,1), fat_mass_kg: extractMeas(groups,8), muscle_mass_kg: extractMeas(groups,76), bone_mass_kg: extractMeas(groups,88), visceral_fat: extractMeas(groups,170), fat_trunk: extractMeas(groups,174), fat_arm_left: extractMeas(groups,175), fat_arm_right: extractMeas(groups,176), fat_leg_left: extractMeas(groups,177), fat_leg_right: extractMeas(groups,178), muscle_trunk: extractMeas(groups,183), muscle_arm_left: extractMeas(groups,184), muscle_arm_right: extractMeas(groups,185), muscle_leg_left: extractMeas(groups,186), muscle_leg_right: extractMeas(groups,187), nerve_score_left: extractMeas(groups,135), nerve_score_right: extractMeas(groups,136), bmr: extractMeas(groups,80), metabolic_age: extractMeas(groups,171) })), { onConflict: 'id' })
      // BMR + metabolic age (no category filter needed)
      const measJsonMeta = await (await fetch('https://wbsapi.withings.net/measure?' + measParamsMeta, { headers: auth })).json()
      if (measJsonMeta.status === 0 && measJsonMeta.body?.measuregrps?.length) {
        const byDateMeta = {}
        for (const g of measJsonMeta.body.measuregrps) { const d = new Date(g.date * 1000).toISOString().substring(0,10); if (!byDateMeta[d]) byDateMeta[d] = []; byDateMeta[d].push(g) }
        const metaRows = Object.entries(byDateMeta).map(([date, groups]) => ({ id: 'body_'+date, date, bmr: extractMeas(groups,80), metabolic_age: extractMeas(groups,171) })).filter(r => r.bmr || r.metabolic_age)
        if (metaRows.length) await supabase.from('withings_body').upsert(metaRows, { onConflict: 'id', ignoreDuplicates: false })
      }
      const vascRows = Object.entries(byDate).map(([date, groups]) => ({ id: `vasc_${date}`, date, pwv: extractMeas(groups,91), vascular_age: extractMeas(groups,168) })).filter(r => r.pwv || r.vascular_age)
      if (vascRows.length) await supabase.from('withings_vascular').upsert(vascRows, { onConflict: 'id' })
    }

    // 2. Blood pressure
    const bpJson = await (await fetch('https://wbsapi.withings.net/v2/heart?action=get', { headers: auth })).json()
    if (bpJson.status === 0 && bpJson.body?.series?.length) await supabase.from('withings_bp').upsert(bpJson.body.series.map(s => ({ id: `bp_${s.timestamp}`, date: new Date(s.timestamp*1000).toISOString().substring(0,10), systolic: s.systole, diastolic: s.diastole, heart_rate: s.heart_rate })), { onConflict: 'id' })

    // 3. ECG / AFib
    const ecgJson = await (await fetch('https://wbsapi.withings.net/v2/heart?action=list&offset=0', { headers: auth })).json()
    if (ecgJson.status === 0 && ecgJson.body?.series?.length) {
      const ecgRows = ecgJson.body.series.filter(s => s.ecg?.afib !== undefined || s.afib !== undefined).map(s => { const ts = s.timestamp || s.ecg?.timestamp; const afib = s.ecg?.afib ?? s.afib; return { id: `ecg_${ts}`, date: new Date(ts*1000).toISOString().substring(0,10), timestamp: new Date(ts*1000).toISOString(), afib_classification: afib===0?'normal':afib===1?'afib':'inconclusive', heart_rate: s.heart_rate } })
      if (ecgRows.length) await supabase.from('withings_ecg').upsert(ecgRows, { onConflict: 'id' })
    }

    return new Response(JSON.stringify({ ok: true, debug_types: [...allTypes].sort((a,b)=>a-b) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})