// utils.js — pure helpers + shared constants (modular rebuild step 2)
var _now=new Date();
var TIER_LABELS={'Tier 1 Stack':'T1','Tier 2 Stack':'T2','Tier 3 Stack':'T3','Tier 3.5 Stack':'T3.5','Optional Stack':'OPT'};
function pad(v){return String(v).padStart(2,'0');}
function ystrStr(){var d=new Date(_now);d.setDate(d.getDate()-1);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function nowTime(){return pad(new Date().getHours())+':'+pad(new Date().getMinutes());}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function fmtD(s){if(!s)return '';return new Date(s+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}
function daysTo(s){if(!s)return 0;var d=new Date(s+'T00:00:00'),n=new Date();n.setHours(0,0,0,0);return Math.max(0,Math.ceil((d-n)/86400000));}
function spill(s){var m={ACTIVE:'s-active',UPCOMING:'s-upcoming',PAUSED:'s-paused',DISCONTINUED:'s-paused'};return '<span class="s-tag '+(m[s]||'s-paused')+'">'+s.charAt(0)+s.slice(1).toLowerCase()+'</span>';}
function icn(n){return '<i class="ti ti-'+n+'" aria-hidden="true"></i>';}
function tpill(proto){var t=TIER_LABELS[proto];return t?'<span class="tier-pill">'+t+'</span>':'';}
