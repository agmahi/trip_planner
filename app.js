/* ════════════════════════════════════════════════════════════════════
   FIREBASE CONFIG — Replace with your own Firebase project config
   ════════════════════════════════════════════════════════════════════ */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAFISvfFZ1RdJzA2tQRG-y_8rCC2RHltoY",
  authDomain: "trip-planner-d38b1.firebaseapp.com",
  databaseURL: "https://trip-planner-d38b1-default-rtdb.firebaseio.com",
  projectId: "trip-planner-d38b1",
  storageBucket: "trip-planner-d38b1.firebasestorage.app",
  messagingSenderId: "93925138920",
  appId: "1:93925138920:web:803cf46e5224be1c7e845d",
  measurementId: "G-MSFML81MDF"
};

/* ════════════ CONSTANTS ════════════ */
const STORAGE_KEY = 'tripplanner_v5';
const LOCAL_SESSION = 'tripplanner_session';
const DEFAULT_TRIP = 'USA 2026';
const COLORS = ['#4285f4','#ea4335','#34a853','#f9ab00','#9334e6','#e52592','#007b83','#e37400','#0097a7'];
const NOTE_META = {
  general:    {emoji:'\u{1F4DD}',label:'General',    cls:'nt-general'},
  hotel:      {emoji:'\u{1F3E8}',label:'Hotel',      cls:'nt-hotel'},
  flight:     {emoji:'\u{2708}\u{FE0F}', label:'Flight',     cls:'nt-flight'},
  activity:   {emoji:'\u{1F3AF}',label:'Activity',   cls:'nt-activity'},
  restaurant: {emoji:'\u{1F37D}\u{FE0F}',label:'Restaurant', cls:'nt-restaurant'},
  transport:  {emoji:'\u{1F68C}',label:'Transport',  cls:'nt-transport'},
};

/* ════════════ STATE ════════════ */
let stops=[], activeId=null, drawerStopId=null, editingId=null, tripName=DEFAULT_TRIP;
let map, routeLine;
let pendingNotes=[], selNoteType='general', selGeo=null;
let acTimer=null, acSel=-1, acRes=[];
const MK={};
const imgCache={};

// Firebase state
let db=null, tripRef=null, tripCode=null, userName='';
let savePending=false, ignoreNextSync=false;

/* ════════════ DEFAULT DATA ════════════ */
const DEFAULT_STOPS=[
  {id:1,location:'San Francisco, California',lat:37.7749,lng:-122.4194,mapped:true,
   arrival:'2026-05-28',departure:'2026-06-02',stay:'Agastya Home',activity:'Arrival & SF Sightseeing',
   notes:[{id:101,type:'general',text:'Arrival day \u2013 settle in and explore the city'}],
   events:[
     {id:1001,date:'2026-05-28',time:'15:00',name:'Arrive at Agastya Home',note:'Check in, settle in'},
     {id:1002,date:'2026-05-29',time:'10:00',name:'Golden Gate Bridge',note:'Morning walk across the bridge'},
     {id:1003,date:'2026-05-29',time:'13:00',name:"Fisherman's Wharf",note:'Lunch and clam chowder'},
     {id:1004,date:'2026-05-30',time:'09:00',name:'Alcatraz Tour',note:'Book tickets in advance'},
   ]},
  {id:2,location:'Yosemite / Mariposa, California',lat:37.8651,lng:-119.5383,mapped:true,
   arrival:'2026-06-03',departure:'2026-06-05',stay:'Miners Inn',activity:'Yosemite National Park',
   notes:[{id:102,type:'activity',text:'Yosemite National Park \u2013 hiking and sightseeing'}],
   events:[
     {id:2001,date:'2026-06-03',time:'08:00',name:'Arrive at Miners Inn',note:'Check in'},
     {id:2002,date:'2026-06-03',time:'11:30',name:'Lower Yosemite Fall Trail',note:'Easy 1-mile loop, great views'},
     {id:2003,date:'2026-06-03',time:'13:30',name:'Bridalveil Fall',note:'Short hike, misty and beautiful'},
     {id:2004,date:'2026-06-03',time:'17:00',name:'Return to Miners Inn',note:'Rest and dinner'},
     {id:2005,date:'2026-06-04',time:'07:00',name:'Half Dome Village',note:'Early start for Half Dome cables'},
     {id:2006,date:'2026-06-04',time:'16:00',name:'Valley View Overlook',note:'Sunset photos'},
   ]},
  {id:3,location:'South Lake Tahoe, California',lat:38.9399,lng:-119.9772,mapped:true,
   arrival:'2026-06-05',departure:'2026-06-06',stay:'Lakeside Lodge',activity:'Lake Tahoe Sightseeing',
   notes:[{id:301,type:'activity',text:'Scenic drive and lake views'}],
   events:[
     {id:3001,date:'2026-06-05',time:'10:00',name:'Emerald Bay State Park',note:'Stunning panoramic views'},
     {id:3002,date:'2026-06-05',time:'14:00',name:'Sand Harbor Beach',note:'Lunch and swimming'},
   ]},
  {id:4,location:'San Jose, California',lat:37.2867,lng:-121.8829,mapped:true,
   arrival:'2026-06-06',departure:'2026-06-10',stay:'Agastya Home',activity:'Rest & Local SF Spots',
   notes:[{id:103,type:'general',text:'Rest days and exploring local SF neighborhoods'}],
   events:[
     {id:4001,date:'2026-06-07',time:'11:00',name:'Mission District Murals',note:'Street art walk'},
     {id:4002,date:'2026-06-08',time:'10:00',name:'Ferry Building Marketplace',note:'Farmers market Saturday'},
   ]},
  {id:5,location:'Hollywood, Los Angeles, California',lat:34.0928,lng:-118.3287,mapped:true,
   arrival:'2026-06-11',departure:'2026-06-12',stay:'Economy Inn',activity:'Walk of Fame & Griffith',
   notes:[{id:104,type:'activity',text:'Hollywood Walk of Fame and Griffith Observatory'}],
   events:[
     {id:5001,date:'2026-06-11',time:'10:00',name:'Hollywood Walk of Fame',note:'See your favorite stars'},
     {id:5002,date:'2026-06-11',time:'15:00',name:'Griffith Observatory',note:'Free admission, great city views'},
   ]},
  {id:6,location:'Anaheim, California',lat:33.8366,lng:-117.9143,mapped:true,
   arrival:'2026-06-13',departure:'2026-06-15',stay:'Super 8',activity:'Universal Studios & Disneyland',
   notes:[{id:105,type:'activity',text:'Universal Studios on Jun 13, Disneyland on Jun 15'}],
   events:[
     {id:6001,date:'2026-06-13',time:'09:00',name:'Universal Studios Hollywood',note:'Full day \u2013 buy tickets in advance'},
     {id:6002,date:'2026-06-14',time:'12:00',name:'Downtown Disney',note:'Shopping and lunch'},
     {id:6003,date:'2026-06-15',time:'08:00',name:'Disneyland Park',note:'Arrive early for shorter queues'},
   ]},
  {id:7,location:'Las Vegas, Nevada',lat:36.1699,lng:-115.1398,mapped:true,
   arrival:'2026-06-16',departure:'2026-06-17',stay:'Desert Rose',activity:'Strip Walk / Shows',
   notes:[{id:108,type:'activity',text:'Explore the Strip, Fremont Street'}],
   events:[
     {id:7001,date:'2026-06-16',time:'20:00',name:'Las Vegas Strip Walk',note:'Best experienced at night'},
     {id:7002,date:'2026-06-17',time:'10:00',name:'Fremont Street Experience',note:'Downtown Las Vegas'},
   ]},
  {id:8,location:'Grand Canyon South Rim, Arizona',lat:36.0544,lng:-112.1401,mapped:true,
   arrival:'2026-06-18',departure:'2026-06-19',stay:'Tusayan Hotel',activity:'South Rim & Watchtower',
   notes:[{id:109,type:'activity',text:'Jun 18: Sunset at South Rim. Jun 19: Watchtower'}],
   events:[
     {id:8001,date:'2026-06-18',time:'14:00',name:'Arrive at South Rim',note:'Check in at Tusayan'},
     {id:8002,date:'2026-06-18',time:'18:30',name:'Mather Point Sunset',note:'Best sunset viewpoint'},
     {id:8003,date:'2026-06-19',time:'08:00',name:'Bright Angel Trail',note:'Morning hike down 1.5 miles'},
     {id:8004,date:'2026-06-19',time:'13:00',name:'Desert View Watchtower',note:'Historic 1932 tower'},
   ]},
  {id:9,location:'Phoenix, Arizona',lat:33.4484,lng:-112.0740,mapped:true,
   arrival:'2026-06-20',departure:'2026-06-20',stay:'Return Home',activity:'Flight PHX \u2192 SFO',
   notes:[{id:111,type:'flight',text:'Flight from PHX back to SFO \u2013 check-in 2 hrs early'}],
   events:[
     {id:9001,date:'2026-06-20',time:'06:00',name:'Drive to PHX Airport',note:'Allow 3 hrs from Grand Canyon'},
     {id:9002,date:'2026-06-20',time:'11:00',name:'Flight PHX \u2192 SFO',note:'Check flight time'},
   ]},
];

/* ════════════ FIREBASE INIT ════════════ */
function initFirebase(){
  if(FIREBASE_CONFIG.apiKey==='YOUR_API_KEY'){
    console.warn('Firebase not configured \u2013 running in local-only mode');
    setSyncStatus('local','Local mode');
    return false;
  }
  try{
    firebase.initializeApp(FIREBASE_CONFIG);
    db=firebase.database();
    // monitor connection
    db.ref('.info/connected').on('value',snap=>{
      if(snap.val()===true){setSyncStatus('connected','Synced');}
      else{setSyncStatus('error','Offline');}
    });
    return true;
  }catch(e){
    console.error('Firebase init failed',e);
    setSyncStatus('error','Error');
    return false;
  }
}

function setSyncStatus(state,text){
  const dot=document.getElementById('syncDot');
  const txt=document.getElementById('syncText');
  dot.className='sync-dot'+(state==='connected'?' connected':state==='error'?' error':'');
  txt.textContent=text;
}

/* ════════════ TRIP CODE / JOIN FLOW ════════════ */
function generateCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code='';for(let i=0;i<6;i++)code+=chars[Math.floor(Math.random()*chars.length)];
  return code;
}

function saveSession(){
  localStorage.setItem(LOCAL_SESSION,JSON.stringify({tripCode,userName}));
}
function loadSession(){
  try{
    const raw=localStorage.getItem(LOCAL_SESSION);
    if(!raw)return false;
    const s=JSON.parse(raw);
    if(s.tripCode&&s.userName){tripCode=s.tripCode;userName=s.userName;return true;}
    return false;
  }catch(e){return false;}
}

function createTrip(){
  const name=document.getElementById('joinName').value.trim();
  if(!name){toast('Please enter your name.');return;}
  userName=name;
  tripCode=generateCode();
  saveSession();
  document.getElementById('joinOverlay').classList.remove('on');
  showTripCode();
  // write default data to Firebase
  if(db){
    tripRef=db.ref('trips/'+tripCode);
    const data={tripName:DEFAULT_TRIP,stops:DEFAULT_STOPS,lastEditBy:userName,lastEditAt:Date.now()};
    tripRef.set(data).then(()=>{
      toast('Trip created! Share code: '+tripCode);
      listenForChanges();
    });
  }
  bootApp(DEFAULT_STOPS,DEFAULT_TRIP);
}

function joinTrip(){
  const name=document.getElementById('joinName').value.trim();
  const code=document.getElementById('joinCode').value.trim().toUpperCase();
  if(!name){toast('Please enter your name.');return;}
  if(!code||code.length<4){toast('Please enter a valid trip code.');return;}
  userName=name;
  tripCode=code;
  if(db){
    tripRef=db.ref('trips/'+tripCode);
    tripRef.once('value').then(snap=>{
      if(snap.exists()){
        const d=snap.val();
        saveSession();
        document.getElementById('joinOverlay').classList.remove('on');
        showTripCode();
        const loadedStops=(d.stops||[]).map(s=>({
          ...s,notes:s.notes||[],events:s.events||[],stay:s.stay||'',activity:s.activity||''
        }));
        bootApp(loadedStops,d.tripName||DEFAULT_TRIP);
        listenForChanges();
        toast('Joined trip '+tripCode+'!');
      }else{
        toast('Trip not found. Check the code or create a new trip.');
      }
    }).catch(e=>{
      console.error(e);
      toast('Could not connect. Check your internet.');
    });
  }else{
    toast('Firebase not configured \u2013 running locally.');
    saveSession();
    document.getElementById('joinOverlay').classList.remove('on');
    bootApp(DEFAULT_STOPS,DEFAULT_TRIP);
  }
}

function showTripCode(){
  const badge=document.getElementById('tripCodeBadge');
  const display=document.getElementById('tripCodeDisplay');
  if(tripCode){badge.style.display='flex';display.textContent=tripCode;}
}

function copyTripCode(){
  if(!tripCode)return;
  navigator.clipboard.writeText(tripCode).then(()=>toast('Trip code copied: '+tripCode)).catch(()=>toast('Code: '+tripCode));
}

/* ════════════ FIREBASE SYNC ════════════ */
function save(){
  // Save to localStorage as cache
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify({tripName,stops}));}catch(e){}
  flashSave();
  // Save to Firebase
  if(tripRef){
    ignoreNextSync=true;
    tripRef.update({
      tripName,
      stops,
      lastEditBy:userName,
      lastEditAt:Date.now()
    }).catch(e=>console.warn('Firebase save failed',e));
  }
}

function listenForChanges(){
  if(!tripRef)return;
  tripRef.on('value',snap=>{
    if(ignoreNextSync){ignoreNextSync=false;return;}
    if(!snap.exists())return;
    const d=snap.val();
    const editor=d.lastEditBy||'Someone';
    // Don't re-apply our own changes
    if(editor===userName&&Date.now()-d.lastEditAt<2000)return;
    // Apply remote changes
    tripName=d.tripName||DEFAULT_TRIP;
    stops=(d.stops||[]).map(s=>({
      ...s,notes:s.notes||[],events:s.events||[],stay:s.stay||'',activity:s.activity||''
    }));
    stops.sort((a,b)=>a.arrival.localeCompare(b.arrival));
    // Rebuild UI
    clearMarkers();
    stops.forEach(s=>{if(s.mapped&&s.lat)placeMarker(s);});
    refreshIcons();drawRoute();renderTimeline();updateSidebarHeader();
    if(drawerStopId){
      const ds=stops.find(x=>x.id===drawerStopId);
      if(ds)renderDrawerBody(ds);else closeDrawer();
    }
    if(activeId){
      const as=stops.find(x=>x.id===activeId);
      if(as&&as.mapped)updateMapCard(as);
    }
    // Flash sync indicator
    const badge=document.getElementById('syncBadge');
    badge.classList.add('sync-update');
    setTimeout(()=>badge.classList.remove('sync-update'),700);
    toast(editor+' updated the itinerary');
    // Cache locally
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify({tripName,stops}));}catch(e){}
  });
}

function clearMarkers(){
  Object.keys(MK).forEach(id=>{map.removeLayer(MK[id]);delete MK[id];});
}

function flashSave(){
  const d=document.getElementById('saveDot');
  d.classList.add('on');clearTimeout(d._t);
  d._t=setTimeout(()=>d.classList.remove('on'),1500);
}

/* ════════════ MAP ════════════ */
map=L.map('map',{zoomControl:true}).setView([37,-100],5);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{
  attribution:'\u00a9 <a href="https://openstreetmap.org">OSM</a> \u00a9 <a href="https://carto.com">CARTO</a>',maxZoom:19
}).addTo(map);

function mkIcon(idx,active){
  const c=COLORS[idx%COLORS.length],s=active?34:26;
  return L.divIcon({className:'',
    html:`<div style="width:${s}px;height:${s}px;position:relative">
      <div style="width:${s}px;height:${s}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        background:${c};border:2.5px solid #fff;
        box-shadow:${active?'0 3px 12px rgba(0,0,0,.35)':'0 2px 6px rgba(0,0,0,.22)'}"></div>
      <div style="position:absolute;top:47%;left:50%;transform:translate(-48%,-52%);
        font-size:${active?12:10}px;font-weight:700;color:#fff;
        font-family:'Google Sans',sans-serif;line-height:1">${idx+1}</div>
    </div>`,iconSize:[s,s],iconAnchor:[s/2,s],popupAnchor:[0,-s]});
}
function placeMarker(stop){
  if(MK[stop.id])map.removeLayer(MK[stop.id]);
  const i=stops.findIndex(s=>s.id===stop.id);
  const m=L.marker([stop.lat,stop.lng],{icon:mkIcon(i,false)}).addTo(map)
    .bindPopup(`<div class="pop-inner"><div class="pop-city">${stop.location}</div><div class="pop-dates">${fmtRange(stop.arrival,stop.departure)}</div></div>`,
      {className:'gmpop',closeButton:false});
  m.on('click',()=>setActive(stop.id,false));
  MK[stop.id]=m;
}
function refreshIcons(){stops.forEach((s,i)=>{if(MK[s.id])MK[s.id].setIcon(mkIcon(i,s.id===activeId));});}
function drawRoute(){
  if(routeLine){map.removeLayer(routeLine);routeLine=null;}
  const geo=stops.filter(s=>s.mapped);
  if(geo.length<2)return;
  routeLine=L.polyline(geo.map(s=>[s.lat,s.lng]),{color:'#4285f4',weight:3,opacity:.5,dashArray:'8 10'}).addTo(map);
}
function invalidateMap(){setTimeout(()=>map.invalidateSize(),320);}

/* ════════════ AUTOCOMPLETE ════════════ */
function onLocInput(v){
  selGeo=null;clearTimeout(acTimer);
  const l=document.getElementById('acList');
  if(v.length<2){l.classList.remove('on');l.innerHTML='';return;}
  acTimer=setTimeout(()=>fetchAc(v),300);
}
async function fetchAc(q){
  const l=document.getElementById('acList');
  l.innerHTML=`<div class="ac-load"><div class="ac-spin"></div> Searching\u2026</div>`;l.classList.add('on');
  try{
    const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1`,
      {headers:{'Accept-Language':'en'},signal:AbortSignal.timeout(5000)});
    acRes=await r.json();acSel=-1;renderAc(acRes);
  }catch(e){l.innerHTML=`<div class="ac-load">Could not fetch suggestions</div>`;}
}
function renderAc(res){
  const l=document.getElementById('acList');
  if(!res.length){l.innerHTML=`<div class="ac-load">No results found</div>`;return;}
  l.innerHTML=res.map((r,i)=>{
    const a=r.address||{};
    const main=a.city||a.town||a.village||a.county||a.state||r.name||r.display_name.split(',')[0];
    const parts=[];if(a.state)parts.push(a.state);if(a.country)parts.push(a.country);
    const sub=parts.join(', ')||r.display_name.split(',').slice(1,3).join(',').trim();
    return`<div class="ac-item" onclick="selAc(${i})"><span style="font-size:14px">\u{1F4CD}</span>
      <div><div class="ac-main">${main}</div><div class="ac-sub">${sub}</div></div></div>`;
  }).join('');l.classList.add('on');
}
function selAc(i){
  const r=acRes[i];if(!r)return;
  const a=r.address||{};
  const main=a.city||a.town||a.village||a.county||a.state||r.name||r.display_name.split(',')[0];
  const parts=[];if(a.state)parts.push(a.state);if(a.country)parts.push(a.country);
  const dn=parts.length?`${main}, ${parts.join(', ')}`:main;
  document.getElementById('mLoc').value=dn;selGeo={lat:+r.lat,lng:+r.lon,displayName:dn};closeAc();
}
function closeAc(){const l=document.getElementById('acList');l.classList.remove('on');l.innerHTML='';acRes=[];acSel=-1;}
function onLocKey(e){
  const items=document.querySelectorAll('.ac-item');
  if(e.key==='ArrowDown'){e.preventDefault();acSel=Math.min(acSel+1,items.length-1);items.forEach((el,i)=>el.classList.toggle('sel',i===acSel));}
  else if(e.key==='ArrowUp'){e.preventDefault();acSel=Math.max(acSel-1,0);items.forEach((el,i)=>el.classList.toggle('sel',i===acSel));}
  else if(e.key==='Enter'){e.preventDefault();if(acSel>=0&&acSel<acRes.length)selAc(acSel);else closeAc();}
  else if(e.key==='Escape')closeAc();
}
document.addEventListener('click',e=>{if(!e.target.closest('.ac-wrap'))closeAc();});
function onArrChange(){
  const arr=document.getElementById('mArr').value,dep=document.getElementById('mDep');
  if(arr){dep.min=arr;if(dep.value&&dep.value<arr)dep.value=arr;dep.focus();}
}

/* ════════════ NOTES ════════════ */
function selNT(btn){document.querySelectorAll('.ntb').forEach(b=>b.classList.remove('on'));btn.classList.add('on');selNoteType=btn.dataset.type;}
function addNote(){
  const txt=document.getElementById('mNoteText').value.trim();if(!txt)return;
  pendingNotes.push({id:Date.now(),type:selNoteType,text:txt});
  document.getElementById('mNoteText').value='';renderNotesList();
}
function removeNote(id){pendingNotes=pendingNotes.filter(n=>n.id!==id);renderNotesList();}
function renderNotesList(){
  document.getElementById('notesList').innerHTML=pendingNotes.map(n=>{
    const m=NOTE_META[n.type]||NOTE_META.general;
    return`<div class="note-entry"><span class="note-type-chip ${m.cls}">${m.emoji} ${m.label}</span><span style="flex:1;font-size:13px;color:var(--t1)">${n.text}</span><button class="note-del" onclick="removeNote(${n.id})">\u2715</button></div>`;
  }).join('');
}

/* ════════════ STOP MODAL ════════════ */
function openStopModal(mode,stopId){
  editingId=mode==='edit'?stopId:null;pendingNotes=[];selGeo=null;
  document.getElementById('stopModalTitle').textContent=mode==='edit'?'Edit Stop':'Add a Stop';
  document.getElementById('btnOk').textContent=mode==='edit'?'Save Changes':'Add to Itinerary';
  document.querySelectorAll('.ntb').forEach(b=>b.classList.toggle('on',b.dataset.type==='general'));selNoteType='general';
  if(mode==='edit'&&stopId){
    const s=stops.find(x=>x.id===stopId);if(!s)return;
    document.getElementById('mLoc').value=s.location;
    document.getElementById('mArr').value=s.arrival;
    document.getElementById('mDep').value=s.departure;
    document.getElementById('mDep').min=s.arrival;
    document.getElementById('mStay').value=s.stay||'';
    document.getElementById('mAct').value=s.activity||'';
    pendingNotes=s.notes?[...s.notes]:[];
    if(s.lat)selGeo={lat:s.lat,lng:s.lng,displayName:s.location};
  }else{
    document.getElementById('mLoc').value='';
    ['mArr','mDep','mStay','mAct'].forEach(id=>{const el=document.getElementById(id);el.value='';if(id==='mDep')el.min='';});
  }
  document.getElementById('mNoteText').value='';renderNotesList();closeAc();
  document.getElementById('stopOverlay').classList.add('on');
  setTimeout(()=>document.getElementById('mLoc').focus(),80);
}
function closeStopModal(){document.getElementById('stopOverlay').classList.remove('on');closeAc();editingId=null;}
document.getElementById('stopOverlay').addEventListener('click',e=>{if(e.target===document.getElementById('stopOverlay'))closeStopModal();});

/* ════════════ SAVE STOP ════════════ */
async function saveStop(){
  const locVal=document.getElementById('mLoc').value.trim();
  const arr=document.getElementById('mArr').value;
  const dep=document.getElementById('mDep').value;
  const stay=document.getElementById('mStay').value.trim();
  const act=document.getElementById('mAct').value.trim();
  if(!locVal)return toast('Please enter a destination.');
  if(!arr)return toast('Please select an arrival date.');
  if(dep&&dep<arr)return toast('Departure must be after arrival.');

  if(editingId){
    const s=stops.find(x=>x.id===editingId);if(!s)return closeStopModal();
    s.location=locVal;s.arrival=arr;s.departure=dep||arr;s.stay=stay;s.activity=act;s.notes=[...pendingNotes];
    if(selGeo&&(selGeo.lat!==s.lat||selGeo.lng!==s.lng)){
      s.lat=selGeo.lat;s.lng=selGeo.lng;s.mapped=true;
      if(MK[s.id]){map.removeLayer(MK[s.id]);delete MK[s.id];}placeMarker(s);
    }else if(!s.mapped&&!selGeo)geocodeBg(s);
    stops.sort((a,b)=>a.arrival.localeCompare(b.arrival));
    closeStopModal();drawRoute();refreshIcons();renderTimeline();setActive(s.id,s.mapped);
    if(drawerStopId===s.id)openDrawer(s.id);
    save();updateSidebarHeader();toast('\u270F\uFE0F '+s.location+' updated');
  }else{
    const stop={id:Date.now(),location:locVal,lat:null,lng:null,mapped:false,
      arrival:arr,departure:dep||arr,stay,activity:act,notes:[...pendingNotes],events:[]};
    if(selGeo){stop.lat=selGeo.lat;stop.lng=selGeo.lng;stop.mapped=true;}
    stops.push(stop);stops.sort((a,b)=>a.arrival.localeCompare(b.arrival));
    closeStopModal();
    if(stop.mapped){placeMarker(stop);drawRoute();}
    refreshIcons();renderTimeline();setActive(stop.id,false);
    if(stop.mapped){map.flyTo([stop.lat,stop.lng],Math.max(map.getZoom(),9),{duration:1.1});updateMapCard(stop);toast('\u{1F4CD} '+stop.location+' added');}
    else{toast('\u{1F4CD} '+stop.location+' added \u2014 locating on map\u2026');geocodeBg(stop);}
    save();updateSidebarHeader();
  }
}

async function geocodeBg(stop){
  document.getElementById('geoStatus').classList.add('on');
  try{
    const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(stop.location)}&limit=1`,
      {headers:{'Accept-Language':'en'},signal:AbortSignal.timeout(6000)});
    const d=await r.json();
    if(d.length){stop.lat=+d[0].lat;stop.lng=+d[0].lon;stop.mapped=true;placeMarker(stop);drawRoute();refreshIcons();renderTimeline();
      if(activeId===stop.id){map.flyTo([stop.lat,stop.lng],Math.max(map.getZoom(),9),{duration:1.1});updateMapCard(stop);}save();}
    else{stop.mapped=false;renderTimeline();toast('\u26A0 Couldn\'t locate "'+stop.location+'"');}
  }catch(e){stop.mapped=false;renderTimeline();}
  document.getElementById('geoStatus').classList.remove('on');
}

/* ════════════ SET ACTIVE ════════════ */
function setActive(id,fly){
  activeId=id;const s=stops.find(x=>x.id===id);if(!s)return;
  refreshIcons();
  if(s.mapped){
    if(fly)map.flyTo([s.lat,s.lng],Math.max(map.getZoom(),9),{duration:1.1});
    else map.panTo([s.lat,s.lng]);
    MK[id]?.openPopup();updateMapCard(s);
  }
  renderTimeline();
  setTimeout(()=>{const el=document.querySelector(`.day-block[data-id="${id}"]`);if(el)el.scrollIntoView({behavior:'smooth',block:'nearest'});},60);
}
function updateMapCard(s){
  const i=stops.findIndex(x=>x.id===s.id);
  document.getElementById('mcLbl').textContent=`Stop ${i+1} of ${stops.length}`;
  document.getElementById('mcCity').textContent=s.location;
  document.getElementById('mcDates').textContent=fmtRange(s.arrival,s.departure);
  const mm=document.getElementById('mcMeta');
  const parts=[];if(s.stay)parts.push('\u{1F3E8} '+s.stay);if(s.activity)parts.push('\u{1F3AF} '+s.activity);
  if(parts.length){mm.textContent=parts.join(' \u00b7 ');mm.style.display='block';}else mm.style.display='none';
  document.getElementById('mcNights').textContent=nightsBetween(s.arrival,s.departure);
  document.getElementById('mapCard').classList.add('on');
  // render swipe dots
  const dotsEl=document.getElementById('mcDots');
  const hintEl=document.getElementById('mcSwipeHint');
  if(dotsEl&&stops.length>1){
    const idx=stops.findIndex(x=>x.id===s.id);
    dotsEl.innerHTML=stops.map((_,j)=>`<div class="mc-dot${j===idx?' active':''}"></div>`).join('');
    if(hintEl)hintEl.style.display='flex';
  }else if(hintEl){hintEl.style.display='none';}
}
function removeStop(id){
  if(MK[id]){map.removeLayer(MK[id]);delete MK[id];}
  stops=stops.filter(s=>s.id!==id);
  if(activeId===id)activeId=stops.length?stops[0].id:null;
  if(drawerStopId===id)closeDrawer();
  renderTimeline();drawRoute();refreshIcons();
  if(activeId)setActive(activeId,false);
  else{document.getElementById('mapCard').classList.remove('on');if(!stops.length)map.setView([37,-100],5);}
  updateSidebarHeader();save();
}
function focusStop(id){const s=stops.find(x=>x.id===id);if(s&&s.mapped){setActive(id,true);map.flyTo([s.lat,s.lng],13,{duration:1.2});}else toast('Still locating on map.');}

/* ════════════ DRAWER ════════════ */
function openDrawer(id){
  const s=stops.find(x=>x.id===id);if(!s)return;
  drawerStopId=id;
  document.getElementById('dCity').textContent=s.location;
  document.getElementById('dDates').textContent=fmtRange(s.arrival,s.departure)+(s.stay?' \u00b7 '+s.stay:'');
  renderDrawerBody(s);
  document.getElementById('drawer').classList.add('open');
  invalidateMap();
  setActive(id,true);
}
function closeDrawer(){
  document.getElementById('drawer').classList.remove('open');
  drawerStopId=null;invalidateMap();
}
function openDrawerForActive(){if(activeId)openDrawer(activeId);}
function editCurrentStop(){if(drawerStopId)openStopModal('edit',drawerStopId);}

function renderDrawerBody(s){
  const body=document.getElementById('drawerBody');
  let html='';

  if(s.stay||s.activity){
    html+=`<div class="drawer-meta-strip">`;
    if(s.stay)html+=`<div class="dms-item"><div class="dms-ico">\u{1F3E8}</div><div class="dms-body"><div class="dms-label">Stay</div><div class="dms-val">${s.stay}</div></div></div>`;
    if(s.activity)html+=`<div class="dms-item"><div class="dms-ico">\u{1F3AF}</div><div class="dms-body"><div class="dms-label">Activity</div><div class="dms-val">${s.activity}</div></div></div>`;
    html+=`</div>`;
  }

  const days=daysInRange(s.arrival,s.departure);
  days.forEach(dateStr=>{
    const dayEvts=(s.events||[]).filter(e=>e.date===dateStr).sort((a,b)=>a.time.localeCompare(b.time));
    const fid=`aef-${s.id}-${dateStr.replace(/-/g,'')}`;
    const listId=`evtlist-${s.id}-${dateStr.replace(/-/g,'')}`;
    html+=`
    <div class="drawer-day-section">
      <div class="drawer-day-header">
        <div class="ddh-date">${fmtDateLong(dateStr)}</div>
        <div class="ddh-right">
          <span class="ddh-count">${dayEvts.length} event${dayEvts.length!==1?'s':''}</span>
          <button class="ddh-add" onclick="showAddEvt('${fid}','${s.id}','${dateStr}')">+ Add</button>
        </div>
      </div>
      <div class="evt-list" id="${listId}">`;

    if(!dayEvts.length){
      html+=`<div class="evt-empty">No events \u2014 click + Add to plan your day</div>`;
    }else{
      dayEvts.forEach((ev,ei)=>{
        const[h,m]=ev.time.split(':');const hr=+h,ampm=hr>=12?'PM':'AM',h12=hr%12||12;
        const isLast=ei===dayEvts.length-1;
        html+=`
        <div class="evt-item" id="evt-${ev.id}">
          <div class="evt-time-col"><div class="evt-time">${h12}:${m}</div><div class="evt-ampm">${ampm}</div></div>
          <div class="evt-dot-col"><div class="evt-dot"></div>${!isLast?'<div class="evt-vline"></div>':''}</div>
          <div class="evt-body">
            <div class="evt-name">${ev.name}</div>
            ${ev.note?`<div class="evt-note">${ev.note}</div>`:''}
            <div class="evt-img-row" id="imgs-${ev.id}">
              <div class="evt-img-skel"></div><div class="evt-img-skel"></div>
            </div>
          </div>
          <button class="evt-del" onclick="deleteEvt(${s.id},${ev.id})" title="Remove">\u2715</button>
        </div>`;
      });
    }
    html+=`</div>
      <div class="add-evt-form" id="${fid}">
        <div class="aef-row">
          <input type="time" class="aef-input aef-time" id="${fid}-time" value="09:00"/>
          <input type="text" class="aef-input aef-name" id="${fid}-name" placeholder="Event name (e.g. Bridalveil Fall)"
            onkeydown="if(event.key==='Enter')saveEvt('${s.id}','${dateStr}','${fid}')"/>
        </div>
        <input type="text" class="aef-input" id="${fid}-note" placeholder="Note (optional)"
          onkeydown="if(event.key==='Enter')saveEvt('${s.id}','${dateStr}','${fid}')"/>
        <div class="aef-hint">\u{1F4A1} Photos of landmarks auto-load from Wikipedia</div>
        <div class="aef-btns">
          <button class="aef-save"   onclick="saveEvt('${s.id}','${dateStr}','${fid}')">Save</button>
          <button class="aef-cancel" onclick="hideAddEvt('${fid}')">Cancel</button>
        </div>
      </div>
    </div>`;
  });

  if(s.notes&&s.notes.length){
    html+=`<div class="drawer-notes"><div class="dns-title">Notes</div>`;
    s.notes.forEach(n=>{
      const m=NOTE_META[n.type]||NOTE_META.general;
      html+=`<div class="note-chip"><span class="ntc ${m.cls}">${m.emoji} ${m.label}</span><span class="note-text">${n.text}</span></div>`;
    });
    html+=`</div>`;
  }

  body.innerHTML=html;
  (s.events||[]).forEach(ev=>loadEvtImages(ev.id,ev.name));
}

function daysInRange(start,end){
  const days=[];let d=new Date(start+'T12:00:00');const e=new Date(end+'T12:00:00');
  while(d<=e){days.push(d.toISOString().split('T')[0]);d.setDate(d.getDate()+1);}
  return days;
}

/* \u2500\u2500 Event CRUD \u2500\u2500 */
function showAddEvt(fid,stopId,dateStr){
  document.querySelectorAll('.add-evt-form.on').forEach(f=>{if(f.id!==fid)f.classList.remove('on');});
  const f=document.getElementById(fid);if(!f)return;
  f.classList.toggle('on');
  if(f.classList.contains('on'))setTimeout(()=>document.getElementById(`${fid}-name`)?.focus(),50);
}
function hideAddEvt(fid){const f=document.getElementById(fid);if(f)f.classList.remove('on');}

function saveEvt(stopId,dateStr,fid){
  const sid=+stopId;const s=stops.find(x=>x.id===sid);if(!s)return;
  const time=document.getElementById(`${fid}-time`).value||'09:00';
  const name=document.getElementById(`${fid}-name`).value.trim();
  const note=document.getElementById(`${fid}-note`).value.trim();
  if(!name)return toast('Please enter an event name.');
  if(!s.events)s.events=[];
  const evId=Date.now();
  s.events.push({id:evId,date:dateStr,time,name,note});
  s.events.sort((a,b)=>a.date===b.date?a.time.localeCompare(b.time):a.date.localeCompare(b.date));
  save();hideAddEvt(fid);renderDrawerBody(s);renderTimeline();toast('\u2713 "'+name+'" added');
}

function deleteEvt(stopId,evId){
  const s=stops.find(x=>x.id===+stopId);if(!s)return;
  s.events=(s.events||[]).filter(e=>e.id!==evId);
  save();renderDrawerBody(s);renderTimeline();
}

/* \u2500\u2500 Images \u2500\u2500 */
async function loadEvtImages(evId,query){
  const row=document.getElementById(`imgs-${evId}`);if(!row)return;
  if(imgCache[query]){renderImgs(row,imgCache[query]);return;}
  try{
    const url=`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(query)}&prop=pageimages&pithumbsize=800&format=json&origin=*`;
    const r=await fetch(url);const d=await r.json();
    const pages=d.query?.pages||{};const imgs=[];
    Object.values(pages).forEach(p=>{if(p.thumbnail?.source)imgs.push(p.thumbnail.source);});
    if(imgs.length<2){
      const url2=`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(query)}&prop=images&imlimit=4&format=json&origin=*`;
      const r2=await fetch(url2);const d2=await r2.json();
      const pages2=d2.query?.pages||{};const titles=[];
      Object.values(pages2).forEach(p=>(p.images||[]).slice(0,3).forEach(img=>{
        if(!img.title.match(/\.svg|logo|icon|flag|map/i))titles.push(img.title);
      }));
      for(const t of titles.slice(0,2)){
        if(imgs.length>=3)break;
        try{
          const ru=`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(t)}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`;
          const rr=await fetch(ru);const dd=await rr.json();
          Object.values(dd.query?.pages||{}).forEach(p=>{const u=(p.imageinfo||[])[0]?.thumburl;if(u)imgs.push(u);});
        }catch(e){}
      }
    }
    imgCache[query]=imgs;
    const rowNow=document.getElementById(`imgs-${evId}`);if(rowNow)renderImgs(rowNow,imgs);
  }catch(e){const rowNow=document.getElementById(`imgs-${evId}`);if(rowNow)rowNow.innerHTML='';}
}
function renderImgs(row,imgs){
  if(!imgs||!imgs.length){row.innerHTML='';return;}
  row.innerHTML=imgs.slice(0,4).map(src=>
    `<img class="evt-img" src="${src}" alt="" loading="lazy" onclick="openLightbox('${src}')" onerror="this.style.display='none'"/>`
  ).join('');
}
function openLightbox(src){document.getElementById('lbImg').src=src;document.getElementById('lightbox').classList.add('on');}
function closeLightbox(){document.getElementById('lightbox').classList.remove('on');document.getElementById('lbImg').src='';}

/* ════════════ TIMELINE ════════════ */
function renderTimeline(){
  const list=document.getElementById('tlList'),empty=document.getElementById('emptyState');
  if(!stops.length){empty.style.display='flex';list.innerHTML='';return;}
  empty.style.display='none';list.innerHTML='';
  stops.forEach((s,i)=>{
    const n=nightsBetween(s.arrival,s.departure),act=s.id===activeId;
    const prev=(s.events||[]).slice(0,2);
    const prevHtml=prev.map(e=>{
      const[h,m]=e.time.split(':');const hr=+h,ampm=hr>=12?'PM':'AM',h12=hr%12||12;
      return`<div class="day-evt-preview"><span class="ep-time">${h12}:${m}${ampm}</span>${e.name}</div>`;
    }).join('');
    const moreN=(s.events||[]).length-prev.length;
    const div=document.createElement('div');
    div.className=`day-block${act?' active':''}`;div.dataset.id=s.id;
    div.innerHTML=`
      <div class="day-spine"><div class="day-dot"></div><div class="day-line"></div></div>
      <div class="day-content" onclick="setActive(${s.id},true)">
        <div class="day-date">${fmtDate(s.arrival)}</div>
        <div class="day-name">${s.location}</div>
        ${n>0?`<div class="day-meta">${n} night${n!==1?'s':''}${s.departure!==s.arrival?' \u00b7 until '+fmtDate(s.departure):''}</div>`:''}
        ${s.stay?`<div class="day-meta">\u{1F3E8} ${s.stay}</div>`:''}
        ${!s.mapped?`<div class="no-map-badge">\u23F3 Locating\u2026</div>`:''}
        ${prevHtml}
        ${moreN>0?`<div class="day-meta" style="color:var(--blue)">+${moreN} more\u2026</div>`:''}
        <div class="day-btns">
          <button class="day-btn db-detail" onclick="openDrawer(${s.id});event.stopPropagation()">\u{1F4CB} Details</button>
          <button class="day-btn db-edit"   onclick="openStopModal('edit',${s.id});event.stopPropagation()">\u270F Edit</button>
          <button class="day-btn db-del"    onclick="removeStop(${s.id});event.stopPropagation()">Remove</button>
        </div>
      </div>`;
    list.appendChild(div);
  });
}

/* ════════════ SIDEBAR HEADER ════════════ */
function updateSidebarHeader(){
  const name=tripName||DEFAULT_TRIP;
  document.getElementById('tripNameEl').textContent=name;
  document.getElementById('sthTitle').textContent=name;
  if(!stops.length){['sthSub','sthStops','sthDays'].forEach(id=>document.getElementById(id).textContent='');return;}
  const first=stops[0].arrival,last=stops[stops.length-1].departure||stops[stops.length-1].arrival;
  const days=Math.max(1,Math.round((new Date(last)-new Date(first))/86400000)+1);
  document.getElementById('sthSub').textContent=`${fmtDate(first)} \u2013 ${fmtDate(last)}`;
  document.getElementById('sthStops').textContent=`${stops.length} stop${stops.length!==1?'s':''}`;
  document.getElementById('sthDays').textContent=`${days} day${days!==1?'s':''}`;
}
function renameTripPrompt(){const n=prompt('Rename your trip:',tripName);if(n&&n.trim()){tripName=n.trim();updateSidebarHeader();save();}}

/* ════════════ SCROLL \u2192 MAP ════════════ */
const tlScroll=document.getElementById('tlScroll');let scrollTimer;
tlScroll.addEventListener('scroll',()=>{
  clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{
    const rect=tlScroll.getBoundingClientRect(),midY=rect.top+rect.height/2;
    let best=null,bestD=Infinity;
    tlScroll.querySelectorAll('.day-block').forEach(c=>{
      const cr=c.getBoundingClientRect(),d=Math.abs(cr.top+cr.height/2-midY);
      if(d<bestD){bestD=d;best=c;}
    });
    if(best){
      const id=+best.dataset.id;
      if(id!==activeId){
        activeId=id;const s=stops.find(x=>x.id===id);
        if(s&&s.mapped){map.panTo([s.lat,s.lng],{animate:true,duration:.7});MK[id]?.openPopup();updateMapCard(s);}
        refreshIcons();
        tlScroll.querySelectorAll('.day-block').forEach(c=>c.classList.toggle('active',+c.dataset.id===id));
      }
    }
  },70);
});

/* ════════════ DATE FINDER ════════════ */
function findLocation(date){
  const strip=document.getElementById('resultStrip');
  if(!date||!stops.length){strip.classList.remove('on');return;}
  const found=stops.find(s=>date>=s.arrival&&date<=s.departure);
  if(found){
    document.getElementById('rsCity').textContent=found.location;
    document.getElementById('rsSub').textContent=`${fmtDate(date)} \u00b7 ${fmtRange(found.arrival,found.departure)}`;
    strip.classList.add('on');
    activeId=found.id;
    refreshIcons();renderTimeline();
    if(found.mapped){
      map.flyTo([found.lat,found.lng],Math.max(map.getZoom(),10),{duration:1.2});
      MK[found.id]?.openPopup();
      updateMapCard(found);
    }
    setTimeout(()=>{
      const el=document.querySelector(`.day-block[data-id="${found.id}"]`);
      if(el)el.scrollIntoView({behavior:'smooth',block:'center'});
    },100);
  }else{
    document.getElementById('rsCity').textContent='Not scheduled';
    document.getElementById('rsSub').textContent=`No stop on ${fmtDate(date)}`;
    strip.classList.add('on');
  }
}
function closeStrip(){document.getElementById('resultStrip').classList.remove('on');document.getElementById('finderDate').value='';}

/* ════════════ DRIVING DISTANCES ════════════ */
let distLabels=[], distVisible=false, distCache={};

function toggleDistances(){
  const btn=document.getElementById('distToggle');
  if(distVisible){
    clearDistLabels();
    distVisible=false;
    btn.classList.remove('active');
  }else{
    distVisible=true;
    btn.classList.add('active');
    fetchAllDistances();
  }
}

function clearDistLabels(){
  distLabels.forEach(m=>map.removeLayer(m));
  distLabels=[];
}

async function fetchAllDistances(){
  const geo=stops.filter(s=>s.mapped);
  if(geo.length<2){toast('Need at least 2 mapped stops.');distVisible=false;document.getElementById('distToggle').classList.remove('active');return;}

  const btn=document.getElementById('distToggle');
  btn.classList.add('loading');
  btn.textContent='\u{1F504} Loading...';
  clearDistLabels();

  for(let i=0;i<geo.length-1;i++){
    const a=geo[i], b=geo[i+1];
    const key=`${a.lat},${a.lng}-${b.lat},${b.lng}`;
    let data=distCache[key];
    if(!data){
      try{
        const url=`https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=false`;
        const r=await fetch(url,{signal:AbortSignal.timeout(8000)});
        const json=await r.json();
        if(json.code==='Ok'&&json.routes&&json.routes.length){
          const route=json.routes[0];
          data={distance:route.distance,duration:route.duration};
          distCache[key]=data;
        }
      }catch(e){console.warn('OSRM fetch failed for segment',i,e);}
    }
    if(data){
      placeDistLabel(a,b,data);
    }
  }

  btn.classList.remove('loading');
  btn.textContent='\u{1F697} Distances';
}

function placeDistLabel(a,b,data){
  const midLat=(a.lat+b.lat)/2;
  const midLng=(a.lng+b.lng)/2;

  const km=data.distance/1000;
  const mi=km*0.621371;
  const hrs=data.duration/3600;

  let timeStr;
  if(hrs<1){
    timeStr=Math.round(hrs*60)+' min';
  }else{
    const h=Math.floor(hrs);
    const m=Math.round((hrs-h)*60);
    timeStr=m>0?h+'h '+m+'m':h+'h';
  }

  const html=`<div class="dist-label-wrap"><div class="dist-label">
    <div class="dl-dist">${km.toFixed(0)} km (${mi.toFixed(0)} mi)</div>
    <div class="dl-time">\u{1F552} ${timeStr} drive</div>
  </div></div>`;

  const icon=L.divIcon({className:'dist-icon',html:html,iconSize:[0,0],iconAnchor:[0,0]});
  const marker=L.marker([midLat,midLng],{icon:icon,interactive:false,zIndexOffset:-100}).addTo(map);
  distLabels.push(marker);
}

// Refresh distance labels when route changes (if visible)
const origDrawRoute=drawRoute;
drawRoute=function(){
  origDrawRoute();
  if(distVisible){clearDistLabels();fetchAllDistances();}
};

/* ════════════ UTILS ════════════ */
const MO=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function fmtDate(d){if(!d)return'\u2014';const[y,m,day]=d.split('-');return`${MO[+m-1]} ${+day}, ${y}`;}
function fmtDateLong(d){if(!d)return'\u2014';const dt=new Date(d+'T12:00:00');return`${DOW[dt.getDay()]}, ${MO[dt.getMonth()]} ${dt.getDate()}`;}
function fmtRange(a,b){
  if(!a)return'\u2014';if(!b||a===b)return fmtDate(a);
  const[ay,am,ad]=a.split('-'),[by,bm,bd]=b.split('-');
  if(ay===by&&am===bm)return`${MO[+am-1]} ${+ad}\u2013${+bd}, ${ay}`;
  if(ay===by)return`${MO[+am-1]} ${+ad} \u2013 ${MO[+bm-1]} ${+bd}, ${ay}`;
  return`${fmtDate(a)} \u2013 ${fmtDate(b)}`;
}
function nightsBetween(a,b){return!a||!b?0:Math.max(0,Math.round((new Date(b)-new Date(a))/86400000));}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),3000);}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeStopModal();closeLightbox();}});
window.addEventListener('resize',()=>map.invalidateSize());

/* ════════════ MOBILE VIEW SWITCHING ════════════ */
function isMobile(){return window.innerWidth<=768;}
function switchMobView(view){
  const sidebar=document.querySelector('.sidebar');
  const mapArea=document.querySelector('.map-area');
  document.querySelectorAll('.mob-tab').forEach(t=>t.classList.toggle('active',t.dataset.view===view));
  if(view==='list'){
    sidebar.classList.add('mob-on');
    mapArea.classList.add('mob-off');
  }else{
    sidebar.classList.remove('mob-on');
    mapArea.classList.remove('mob-off');
    setTimeout(()=>map.invalidateSize(),120);
  }
}
const origSetActive=setActive;
setActive=function(id,fly){
  origSetActive(id,fly);
  if(isMobile()&&fly)switchMobView('map');
};
const origOpenDrawer=openDrawer;
openDrawer=function(id){origOpenDrawer(id);};

/* ════════════ MAP CARD SWIPE ════════════ */
(function initSwipe(){
  const card=document.getElementById('mapCard');
  if(!card)return;
  let startX=0,startY=0,dx=0,swiping=false;
  const THRESHOLD=50;

  card.addEventListener('touchstart',e=>{
    if(!isMobile()||stops.length<2)return;
    const t=e.touches[0];
    startX=t.clientX;startY=t.clientY;dx=0;swiping=true;
    card.classList.add('swiping');
  },{passive:true});

  card.addEventListener('touchmove',e=>{
    if(!swiping)return;
    const t=e.touches[0];
    dx=t.clientX-startX;
    const dy=Math.abs(t.clientY-startY);
    // if scrolling vertically, cancel swipe
    if(dy>Math.abs(dx)){swiping=false;card.style.transform='';card.classList.remove('swiping');return;}
    card.style.transform=`translateX(${dx}px)`;
    card.style.opacity=Math.max(0.3,1-Math.abs(dx)/300);
  },{passive:true});

  card.addEventListener('touchend',()=>{
    if(!swiping){card.style.transform='';card.style.opacity='';return;}
    card.classList.remove('swiping');
    swiping=false;

    if(Math.abs(dx)<THRESHOLD){
      // snap back
      card.style.transform='';card.style.opacity='';
      return;
    }

    const curIdx=stops.findIndex(s=>s.id===activeId);
    let nextIdx;
    if(dx<0){
      // swipe left → next stop
      nextIdx=curIdx+1;
    }else{
      // swipe right → previous stop
      nextIdx=curIdx-1;
    }

    if(nextIdx<0||nextIdx>=stops.length){
      // bounce back — no more stops in that direction
      card.style.transform='';card.style.opacity='';
      toast(dx<0?'Last stop':'First stop');
      return;
    }

    // animate out
    const dir=dx<0?'swipe-out-left':'swipe-out-right';
    card.style.transform='';card.style.opacity='';
    card.classList.add(dir);

    setTimeout(()=>{
      card.classList.remove(dir);
      // switch to next stop
      const next=stops[nextIdx];
      if(next){
        activeId=next.id;
        refreshIcons();renderTimeline();
        if(next.mapped){
          map.flyTo([next.lat,next.lng],Math.max(map.getZoom(),9),{duration:0.8});
          MK[next.id]?.openPopup();
          updateMapCard(next);
        }
      }
      // animate in
      card.classList.add('swipe-in');
      setTimeout(()=>card.classList.remove('swipe-in'),300);
    },250);
  });
})();

/* ════════════ BOOT ════════════ */
function bootApp(stopsData,name){
  stops=stopsData.map(s=>({...s,events:(s.events||[]).map(e=>({...e}))}));
  tripName=name;
  stops.sort((a,b)=>a.arrival.localeCompare(b.arrival));

  updateSidebarHeader();
  clearMarkers();
  stops.forEach(s=>{if(s.mapped&&s.lat)placeMarker(s);});
  refreshIcons();drawRoute();
  renderTimeline();

  const geo=stops.filter(s=>s.mapped);
  if(geo.length>1)map.fitBounds(L.latLngBounds(geo.map(s=>[s.lat,s.lng])),{padding:[40,40]});
  else if(geo.length===1)map.setView([geo[0].lat,geo[0].lng],9);

  if(stops.length)setActive(stops[0].id,false);
}

(function init(){
  const fbOk=initFirebase();

  // Check for existing session
  if(loadSession()&&fbOk&&db){
    tripRef=db.ref('trips/'+tripCode);
    document.getElementById('joinOverlay').classList.remove('on');
    showTripCode();
    // Load from Firebase
    tripRef.once('value').then(snap=>{
      if(snap.exists()){
        const d=snap.val();
        const loadedStops=(d.stops||[]).map(s=>({
          ...s,notes:s.notes||[],events:s.events||[],stay:s.stay||'',activity:s.activity||''
        }));
        bootApp(loadedStops,d.tripName||DEFAULT_TRIP);
      }else{
        // Trip was deleted remotely, use defaults
        bootApp(DEFAULT_STOPS,DEFAULT_TRIP);
      }
      listenForChanges();
    }).catch(()=>{
      // Offline — load from localStorage cache
      try{
        const raw=localStorage.getItem(STORAGE_KEY);
        if(raw){
          const d=JSON.parse(raw);
          bootApp(d.stops||DEFAULT_STOPS,d.tripName||DEFAULT_TRIP);
        }else{
          bootApp(DEFAULT_STOPS,DEFAULT_TRIP);
        }
      }catch(e){bootApp(DEFAULT_STOPS,DEFAULT_TRIP);}
      listenForChanges();
    });
  }else if(loadSession()&&!fbOk){
    // Firebase not configured, run locally
    document.getElementById('joinOverlay').classList.remove('on');
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      if(raw){const d=JSON.parse(raw);bootApp(d.stops||DEFAULT_STOPS,d.tripName||DEFAULT_TRIP);}
      else bootApp(DEFAULT_STOPS,DEFAULT_TRIP);
    }catch(e){bootApp(DEFAULT_STOPS,DEFAULT_TRIP);}
  }
  // else: show join overlay and wait for user action
})();
