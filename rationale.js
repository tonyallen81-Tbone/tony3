// rationale.js — per-compound rationale data for dropdown display
var RATIONALE = {
  c1: {
    why: "Primary TRT — diagnosed hypogonadism ~5 yrs ago, full symptom reversal. Now in optimization phase targeting 600-900 ng/dL trough.",
    mechanism: "Exogenous testosterone replaces deficient endogenous production. Cypionate ester provides stable 7-day pharmacokinetics.",
    dna: "CYP19A1 C/T+C/C = elevated aromatase activity, monitor E2. ACTN3 RR fast-twitch benefits maximally from T-driven muscle protein synthesis.",
    evidence: "A",
    flag: "Drives erythrocytosis — monitor hematocrit. TRAVERSE 2023 cleared CV safety. Avoid aggressive E2 lowering with AIs (raises CV risk)."
  },
  c2: {
    why: "Maintains testicular volume and endogenous hormone signaling alongside exogenous TRT. Preserves fertility option.",
    mechanism: "LH analog — stimulates Leydig cells for intratesticular testosterone production and testicular function.",
    dna: "No direct genetic driver — standard adjunct for TRT protocols.",
    evidence: "B+",
    flag: "Dose is 250 IU per injection (25 units on U-100 syringe). Protocol: Mon/Wed/Fri mornings."
  },
  c3: {
    why: "Body composition optimization and neuroprotection. Relevant to Parkinson genetic risk profile. Temporary — discontinue once composition goals met.",
    mechanism: "GLP-1 receptor agonist. Reduces appetite, slows gastric emptying, improves insulin sensitivity. Neuroprotective in dopaminergic pathways.",
    dna: "Parkinson predisposition noted — GLP-1 neuroprotection in dopaminergic circuits is directly relevant.",
    evidence: "A (weight/metabolic), B (neuro)",
    flag: "Current dose 10 IU (~0.2mg) — likely below therapeutic threshold. CGM fasting glucose is personal arbiter. Do not adjust without 3-5 day stable baseline post confound."
  },
  c4: {
    why: "CJC-1295 (No DAC) + Ipamorelin — pulsatile GH stimulus pre-bed. Primary target: SWS architecture, the BDNF synthesis window.",
    mechanism: "No-DAC form creates pulsatile GH release. Ipamorelin adds ghrelin-receptor mediated GH pulse. Synergistic.",
    dna: "Val/Val BDNF genotype = reduced activity-dependent BDNF release. SWS optimization is the highest-leverage compensatory lever.",
    evidence: "B",
    flag: "NEW VIAL May 31 2026: 10 IU = 200mcg (prior was 20 IU = 200mcg). ~6 months continuous = desensitization risk. IGF-1 baseline mandatory at next draw. Adds upward pressure on fasting glucose."
  },
  c5: {
    why: "Tissue repair and recovery. BPC-157 for gut/tendon healing, TB-500 for systemic recovery, GHK-Cu for collagen and regeneration.",
    mechanism: "BPC-157: cytoprotective, angiogenic. TB-500: actin-binding peptide promoting cell migration. GHK-Cu: copper complex upregulating collagen synthesis.",
    dna: "Posterior chain vulnerability (hamstring history) makes recovery peptides clinically relevant.",
    evidence: "D (human data)",
    flag: "Weakest evidence in stack. Only 3 human BPC-157 trials, publication bias concerns. WADA-banned. Dose/frequency TBD."
  },
  c7: {
    why: "NAD+ precursor — mitochondrial function, DNA repair, sirtuin activation. Core longevity mechanism.",
    mechanism: "NMN converts to NAD+ via salvage pathway. Raises systemic NAD+ measurably within weeks.",
    dna: "General aging mechanism — relevant to overall healthspan protocol.",
    evidence: "B",
    flag: "2025 meta-analysis: NAD+ rises confirmed but no functional outcome benefit demonstrated yet. Pair with Resveratrol (SIRT1) to make elevated NAD+ productive. Requires TMG as methylation safety net."
  },
  c8: {
    why: "SIRT1 activator — makes elevated NAD+ from NMN functionally productive. Without SIRT1 activation, NAD+ accumulation may not translate to downstream benefit.",
    mechanism: "Trans-resveratrol binds SIRT1 allosteric site, enhancing deacetylase activity 13x. Synergistic with NMN.",
    dna: "SIRT1 pathway relevant to longevity across genotypes.",
    evidence: "B",
    flag: "Genex 1500mg label = ~250mg active trans-resveratrol (50% Japanese Knotweed). Current: 1 cap (250mg) AM with fat."
  },
  c9: {
    why: "AMPK activator — glucose disposal, insulin sensitivity, comparable to metformin effect. NOT redundant with semaglutide.",
    mechanism: "AMPK activation improves peripheral glucose uptake. Alpha-glucosidase inhibition slows carb absorption. Modest GLP-1 secretion synergizes with semaglutide.",
    dna: "Covers metabolic ground as semaglutide tapers.",
    evidence: "A-",
    flag: "Take with meals — GI sensitivity on empty stomach. 500mg 3x/day."
  },
  c10: {
    why: "Methylation safety partner for NMN. High-dose NMN consumes methyl groups — TMG donates methyl groups to prevent homocysteine accumulation.",
    mechanism: "Betaine donates methyl groups via BHMT pathway, regenerating SAM and preventing hyperhomocysteinemia.",
    dna: "Check MTHFR — if polymorphism present, methylation support becomes critical.",
    evidence: "B",
    flag: "Not standalone — context-dependent on NMN coadministration. Add homocysteine to next lab panel."
  },
  c11: {
    why: "Mitochondrial electron transport chain cofactor. Ubiquinol form appropriate for age 44+. More justified if statin ever added.",
    mechanism: "Essential for ATP synthesis in Complex I/II/III. Antioxidant protection of mitochondrial membrane.",
    dna: "LDL 124 / ApoB 101 both elevated — CoQ10 more clinically relevant if statin indicated.",
    evidence: "A (statin/deficiency), B (optimization)",
    flag: "Ubiquinol is the correct form (vs ubiquinone). Take with fat."
  },
  c12: {
    why: "Nitric oxide precursor — vascular health, endothelial function, workout performance. Directly targets PWV improvement goal.",
    mechanism: "L-Citrulline converts to L-Arginine, then NO. Citrulline superior to Arginine orally (avoids first-pass hepatic metabolism).",
    dna: "Vascular age 50 (target 47). PWV 7.5 m/s (target <7.0). NO support directly targets these metrics.",
    evidence: "A- (vascular/performance)",
    flag: "5g morning. Take 30-60 min pre-workout when training to maximize performance effect."
  },
  c14: {
    why: "CD38 inhibitor — preserves NAD+ by blocking the enzyme that degrades it. This is why apigenin is stacked next to NMN: build NAD+ and protect it.",
    mechanism: "CD38 degrades NAD+. Apigenin blocks CD38. Secondary: GABA-A modulation for sleep depth, senolytic activity.",
    dna: "Universal aging pathway — no variant dependency.",
    evidence: "B",
    flag: "Pre-bed timing (22:00). Start 50mg, can titrate to 100mg."
  },
  c21: {
    why: "Acetylcholine precursor — cognitive sharpness and working memory. Timed for Portuguese study sessions.",
    mechanism: "Alpha GPC crosses BBB efficiently, converts to choline, then acetylcholine. Cholinergic enhancement for focus and encoding.",
    dna: "COMT G/G = efficient dopamine clearance — cholinergic boost complements catecholamine profile for sustained cognitive work.",
    evidence: "B+",
    flag: "Take pre-study session, not all-day. 500mg AM or 30-60 min before Portuguese work block."
  },
  c22: {
    why: "Mitochondrial biogenesis + BDNF upregulation. One of few compounds with direct BDNF gene expression relevance — directly targets Val/Val BDNF limitation.",
    mechanism: "PQQ activates CREB and PGC-1alpha — both mitochondrial biogenesis and BDNF gene expression. Redox cofactor in electron transport chain.",
    dna: "Val/Val BDNF = reduced activity-dependent BDNF. PQQ provides compensatory transcriptional BDNF upregulation.",
    evidence: "B",
    flag: "AM with food. 15mg within studied range. Stacks well with Alpha GPC for cognitive session support."
  },
  c23: {
    why: "Mitochondrial membrane antioxidant with longevity association. Difficult to obtain meaningfully from diet alone at age 44+.",
    mechanism: "Ergothioneine accumulates selectively in mitochondria and high-oxidative-stress tissues. Scavenges peroxynitrite and superoxide. Associated with reduced all-cause mortality.",
    dna: "ETFDH transporter variant affects absorption — not yet tested.",
    evidence: "B-",
    flag: "Assess after Tier 3.5 shows signal. 10mg within studied range."
  },
  c24: {
    why: "Neuroinflammation reduction and peripheral pain modulation. Relevant to recovery from training and chronic low-grade inflammation.",
    mechanism: "Palmitoylethanolamide (PEA) — endocannabinoid-like fatty acid. Activates PPAR-alpha, reduces mast cell degranulation, modulates neuroinflammatory signaling.",
    dna: "No direct genetic driver. Relevant to inflammation and recovery optimization.",
    evidence: "B-",
    flag: "Assess after Tier 3.5. 500mg Levagen+ (bioavailable form). No known conflicts with stack."
  },
  c15: {
    why: "Daily greens and micronutrient insurance. Baseline coverage given complex supplement schedule.",
    mechanism: "Broad-spectrum micronutrients, adaptogenic herbs, probiotics, digestive enzymes, antioxidants.",
    dna: "No genetic driver — general nutritional baseline.",
    evidence: "B (proprietary blend — individual ingredient evidence varies)",
    flag: "Take AM on empty stomach or light food."
  },
  c16: {
    why: "Cognitive and physical performance — one of the most evidence-dense supplements available. Dual purpose: workout output and neuroprotection.",
    mechanism: "Phosphocreatine replenishment for ATP regeneration. Brain creatine supports cognitive performance, especially under stress or sleep deprivation.",
    dna: "ACTN3 RR fast-twitch benefits maximally for explosive performance. Val/Val BDNF — creatine has neuroprotective relevance.",
    evidence: "A",
    flag: "TWO FLAGS: (1) 20g is a loading dose — cognitive benefit plateaus at 3-5g, reconsider maintenance dose. (2) Elevates serum creatinine artifactually — always flag when interpreting kidney markers. Add Cystatin C eGFR to next panel."
  },
  c17: {
    why: "BDNF upregulation via VDR receptors on neurons, immune function, and testosterone synthesis support.",
    mechanism: "VDR nuclear receptor activation drives BDNF gene transcription, immune modulation, testosterone synthesis enzyme support.",
    dna: "Val/Val BDNF — D3 provides transcriptional BDNF support. H15b maternal haplogroup associated with Vitamin D metabolism efficiency.",
    evidence: "A (deficiency), B+ (optimization above sufficiency)",
    flag: "Current level 58 ng/mL — already optimal. MAINTAIN, do not increase. Benefit already captured; excess concentration may be counterproductive."
  },
  c18: {
    why: "ApoB and inflammation management — TG already excellent at 55 so this is ApoB/inflammatory play. DHA supports neuroplasticity via neuronal membrane incorporation.",
    mechanism: "EPA: anti-inflammatory, TG reduction, ApoB modulation. DHA: neuronal membrane fluidity, synaptogenesis, BDNF expression.",
    dna: "Val/Val BDNF — DHA supports neuronal membrane environment for BDNF receptor signaling. ApoB 101 elevated — EPA directly relevant.",
    evidence: "A",
    flag: "Use rTG (re-esterified triglyceride) form — 4x bioavailability vs ethyl ester. AFib signal at >4g EPA+DHA — watch Withings ECG. Take with fat."
  },
  c19: {
    why: "Magnesium replenishment — 300+ enzymatic reactions, ATP synthesis, muscle relaxation. Evening timing for sleep and recovery support.",
    mechanism: "Glycinate chelate: gentle, high bioavailability, low GI impact. Activates enzymes in protein synthesis, energy metabolism, neurotransmitter regulation.",
    dna: "No specific genetic driver — general physiological requirement.",
    evidence: "A (deficiency/repletion)",
    flag: "Note: Dropped Magnesium Glycinate in favor of Magtein only. May reduce total elemental Mg — check RBC magnesium at next labs."
  },
  c20: {
    why: "Magnesium L-Threonate crosses the blood-brain barrier — uniquely positioned to raise brain Mg and support neuroplasticity vs other Mg forms.",
    mechanism: "L-Threonate chelation enables Mg transport across BBB, increasing brain Mg levels, enhancing NMDA receptor function and synaptic plasticity.",
    dna: "Val/Val BDNF — Mg L-Threonate supports synaptic plasticity mechanisms that partially compensate for reduced BDNF activity-dependence.",
    evidence: "B+",
    flag: "Magtein (NOW Foods). Split AM/PM. Primary Mg source now — monitor total elemental Mg (RBC Mg at next panel)."
  }
};

var RAT_OPEN = {};

function rRationale(cid) {
  var r = RATIONALE[cid];
  if (!r) return "";
  var open = RAT_OPEN[cid];
  var h = "<div class=\"rat-wrap\">";
  h += "<button class=\"rat-btn\" data-a=\"rat-toggle\" data-cid=\"" + cid + "\">"
    + "<span>" + (open ? "Hide rationale" : "Why this?") + "</span>"
    + "<i class=\"ti ti-chevron-" + (open ? "up" : "down") + "\"></i>"
    + "</button>";
  if (open) {
    h += "<div class=\"rat-panel\">";
    h += "<div class=\"rat-sec\"><span class=\"rat-lbl\">Rationale</span>" + esc(r.why) + "</div>";
    h += "<div class=\"rat-sec\"><span class=\"rat-lbl\">Mechanism</span>" + esc(r.mechanism) + "</div>";
    h += "<div class=\"rat-sec\"><span class=\"rat-lbl\">DNA relevance</span>" + esc(r.dna) + "</div>";
    h += "<div class=\"rat-sec rat-ev\"><span class=\"rat-lbl\">Evidence</span><span class=\"rat-grade\">" + esc(r.evidence) + "</span></div>";
    if (r.flag) h += "<div class=\"rat-sec rat-flag\"><span class=\"rat-lbl\">Note</span>" + esc(r.flag) + "</div>";
    h += "</div>";
  }
  h += "</div>";
  return h;
}
