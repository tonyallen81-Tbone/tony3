// data.js — Supabase connection primitives + local cache (modular rebuild step 3)
var SB_URL = 'https://rlvvkepcqfzbvgwefjwc.supabase.co';
var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsdnZrZXBjcWZ6YnZnd2VmandjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1Mjk5MTcsImV4cCI6MjA5NDEwNTkxN30.GysmV5mwbpqta9jVA9butslrfVuSfRNZewledRaMR40';

function sbHeaders(){
  return {'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY};
}

function sbGet(table,params){
  var url=SB_URL+'/rest/v1/'+table+'?'+( params||'select=*&order=created_at.desc' );
  return fetch(url,{headers:sbHeaders()}).then(function(r){return r.json();});
}

function sbUpsert(table,data){
  return fetch(SB_URL+'/rest/v1/'+table,{
    method:'POST',
    headers:Object.assign({},sbHeaders(),{'Prefer':'resolution=merge-duplicates'}),
    body:JSON.stringify(data)
  });
}

function sbDelete(table,col,val){
  return fetch(SB_URL+'/rest/v1/'+table+'?'+col+'=eq.'+encodeURIComponent(val),{
    method:'DELETE',headers:sbHeaders()
  });
}

// ââ Local cache (localStorage) for offline/fast access âââââââââââââââââââââââ
var _ls={
  get:function(k){try{var v=localStorage.getItem(k);return v?JSON.parse(v):null;}catch(e){return null;}},
  set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
};
