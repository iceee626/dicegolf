// Profile Storage, CRUD, Profile Hub, and Menu Profile UI

const MAX_PROFILES=3;
const PROFILE_EMOJIS=[
  '🏌️','🏌️‍♀️','⛳','🏆','🎯','⚡','🔥','🌟','💪',
  '🦅','🐯','🦁','🐺','🦊','🐻','🦝','🐸',
  '🎲','🃏','🏅','🥇','🎖️','👑','💎','🍀',
  '⚽','🏀','🎾','🏈','⚾','🥊','🎿','🏄',
  '🌊','🌈','🐤','☀️','🌙','🌴','🌵','🍁',
  '😎','🤠','🧢','🕶️','🥸','😤','😈','🤩',
];
const AVATARS=['🏌️','⛳','🏆']; 

function getProfileIcon(p, idx){
  return p.icon || AVATARS[idx] || '👤';
}

function loadProfiles(){
  try{
    const profiles = JSON.parse(localStorage.getItem('gg_profiles')||'[]');
    if(!Array.isArray(profiles)) return [];
    let dirty = false;
    profiles.forEach((p, idx)=>{
      const before = JSON.stringify(p);
      ensureProfileDefaults(p);
      if(JSON.stringify(p) !== before) dirty = true;
      if(typeof p.name !== 'string') profiles[idx].name = `PLAYER ${idx+1}`;
    });
    if(dirty) saveProfiles(profiles);
    return profiles;
  }catch{return [];}
}
function saveProfiles(p){localStorage.setItem('gg_profiles',JSON.stringify(p));}
function getActiveProfileIdx(){
  return parseInt(localStorage.getItem('gg_active_profile')||'0');
}
function setActiveProfileIdx(i){localStorage.setItem('gg_active_profile',String(i));}

function getActiveProfile(){
  const profiles=loadProfiles();
  if(!profiles.length)return null;
  const idx=Math.min(getActiveProfileIdx(), profiles.length-1);
  return profiles[idx]||null;
}

function createProfileId(){
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
}

function ensureProfileDefaults(p){
  if(!p || typeof p !== 'object') return p;
  if(typeof p.id !== 'string' || !p.id.trim()) p.id = createProfileId();
  if(!Array.isArray(p.achievements)) p.achievements = [];
  const numericDefaults = {
    gamesPlayed: 0,
    holesPlayed: 0,
    birdies: 0,
    eagles: 0,
    holeInOnes: 0,
    wildcardsUsed: 0,
    bestBirdieStreak: 0,
    bestUnderParStreak: 0,
    bogeyFreeRounds: 0,
    perfectRounds: 0,
    maxWcOneRound: 0,
    easyUnderPar: 0,
    medUnderPar: 0,
    hardRounds: 0,
    hardUnderPar: 0,
    wcDiscardedRound: 0,
    tripleTroubles: 0,
    tutorialCompleted: 0,
    shakeRolls: 0,
    customGamesCompleted: 0,
    tournamentCompletions: 0,
    gamesCompleted: 0,
    versusPlayed: 0,
    majorLikeFinishes: 0,
    par3SpecialistRounds: 0,
    rollercoasterRounds: 0,
    iceVeinsRounds: 0,
    scubaDiverRounds: 0,
    timesInWater: 0,
    beachBumRounds: 0,
    lumberjackRounds: 0,
    scramblerRounds: 0,
    wcDiscardedTotal: 0,
    xpTotal: 0,
    achievementXpEarned: 0,
    totalStrokes: 0,
    totalPar: 0
  };
  Object.keys(numericDefaults).forEach(k=>{
    if(typeof p[k] !== 'number' || !isFinite(p[k])) p[k] = numericDefaults[k];
  });
  if(!p.scoreBuckets || typeof p.scoreBuckets !== 'object') p.scoreBuckets = {};
  const scoreDefaults = { aces:0, eaglesPlus:0, birdies:0, pars:0, bogeys:0, doublePlus:0 };
  Object.keys(scoreDefaults).forEach(k=>{
    if(typeof p.scoreBuckets[k] !== 'number' || !isFinite(p.scoreBuckets[k])) p.scoreBuckets[k] = scoreDefaults[k];
  });
  const bucketTotal = (p.scoreBuckets.aces||0) + (p.scoreBuckets.eaglesPlus||0) + (p.scoreBuckets.birdies||0) + (p.scoreBuckets.pars||0) + (p.scoreBuckets.bogeys||0) + (p.scoreBuckets.doublePlus||0);
  if(bucketTotal === 0 && ((p.holeInOnes||0) > 0 || (p.eagles||0) > 0 || (p.birdies||0) > 0)){
    p.scoreBuckets.aces = Math.max(0, p.holeInOnes || 0);
    p.scoreBuckets.eaglesPlus = Math.max(0, (p.eagles || 0) - p.scoreBuckets.aces);
    p.scoreBuckets.birdies = Math.max(0, p.birdies || 0);
  }
  if(p.bestDiff !== undefined && (typeof p.bestDiff !== 'number' || !isFinite(p.bestDiff))) p.bestDiff = undefined;
  return p;
}

function createDefaultProfile(name){
  const p = { name, bestDiff: undefined, achievements: [] };
  return ensureProfileDefaults(p);
}


function updateProfileAfterRound(score, par){
  if(TUT.active) return;
  const profiles=loadProfiles();
  if(!profiles.length)return;
  const idx=Math.min(getActiveProfileIdx(), profiles.length-1);
  const p=profiles[idx];
  if(!p)return;
  p.gamesPlayed=(p.gamesPlayed||0)+1;
  HOLES.forEach((h,i)=>{
    const hist=S.histories[S.currentRound-1][i]; // FIXED
    if(!hist)return;
    p.holesPlayed=(p.holesPlayed||0)+1;
    const d=hist.strokes-hist.par;
    if(h.par===3&&hist.strokes===1) p.holeInOnes=(p.holeInOnes||0)+1;
    else if(d<=-2) p.eagles=(p.eagles||0)+1;
    else if(d===-1) p.birdies=(p.birdies||0)+1;
  });
  const diff=score-par;
  if(p.bestDiff===undefined||diff<p.bestDiff) p.bestDiff=diff;
  saveProfiles(profiles);
}

function renderProfileSlots(){
  const profiles=loadProfiles();
  const activeIdx=Math.min(getActiveProfileIdx(), Math.max(0,profiles.length-1));
  const el=document.getElementById('profileSlots');
  el.innerHTML='';

  profiles.forEach((p,i)=>{
    const slot=document.createElement('div');
    slot.className='profile-slot'+(i===activeIdx?' active-profile':'');
    const profileIconHtml = escapeHtml(getProfileIcon(p,i));
    const profileNameHtml = escapeHtml(p.name);
    slot.innerHTML=`
      <div class="profile-avatar">${profileIconHtml}</div>
      <div class="profile-info">
        <div class="profile-name">${profileNameHtml}</div>
      </div>
      <div class="profile-actions">
        <button class="profile-action-btn" onclick="openEditProfile(${i});event.stopPropagation();">EDIT</button>
        <button class="profile-action-btn" onclick="showProfileStats(${i});event.stopPropagation();">STATS</button>
        <button class="profile-action-btn del" onclick="deleteProfile(${i});event.stopPropagation();">✕</button>
      </div>
    `;
    slot.onclick=()=>selectProfile(i);
    el.appendChild(slot);
  });

  if(profiles.length<MAX_PROFILES){
    const add=document.createElement('div');
    add.className='profile-slot empty';
    add.style.cssText='cursor:pointer;border-style:dashed;justify-content:center;color:var(--muted);gap:6px;';
    add.innerHTML=`<span style="font-size:18px;">+</span><span style="font-family:'Sen', sans-serif;font-size:11px;letter-spacing:1px;">NEW PROFILE</span><span style="font-family:'Sen', sans-serif;font-size:9px;color:var(--muted);margin-left:4px;">(max. 3)</span>`;
    add.onclick=()=>showNewProfileForm();
    add.style.cursor='pointer';
    el.appendChild(add);
  }
}

function selectProfile(i){
  const activeIdx=getActiveProfileIdx();
  if(i===activeIdx){
    setTimeout(()=>closeProfileModal(),200);
    return;
  }
  const profiles=loadProfiles();
  const p=profiles[i];
  if(!p)return;
  setActiveProfileIdx(i);
  PLAYER_NAME=p.name.toUpperCase();
  renderProfileSlots();
  updateMenuProfileDisplay();
  setTimeout(()=>closeProfileModal(),150);
  setTimeout(()=>showToast('PROFILE CHANGED'),300);
}

function deleteProfile(i){
  const profiles=loadProfiles();
  const profileName=profiles[i]?.name||'this profile';
  const profileId=profiles[i]?.id||'';
  showConfirm('Remove ' + profileName + '?', ()=>{
    const profiles=loadProfiles();
    if(profileId) clearSavedGameForProfileId(profileId);
    profiles.splice(i,1);
    saveProfiles(profiles);
    if(!profiles.length){
      try{localStorage.removeItem('gg_tutorial_done');}catch{}
      try{localStorage.removeItem(PROFILE_SAVE_KEY);}catch{}
      try{localStorage.removeItem(LEGACY_SAVE_KEY);}catch{}
      closeProfileModal();
      hideScreen('menuScreen');
      const oi=document.getElementById('onboardInput');
      if(oi)oi.value='';
      const ob=document.getElementById('onboardScreen');
      if(ob){
        ob.style.display='flex';
        void ob.offsetWidth;
        ob.classList.add('visible');
      }
      const el=document.getElementById('menuActiveProfile');
      if(el)el.textContent='';
      return;
    }
    const activeIdx=getActiveProfileIdx();
    if(activeIdx>=profiles.length) setActiveProfileIdx(Math.max(0,profiles.length-1));
    const newActive=getActiveProfile();
    if(newActive) PLAYER_NAME=newActive.name.toUpperCase();
    updateMenuProfileDisplay();
    renderProfileSlots();
  });
}

function showNewProfileForm(){
  document.getElementById('profileNewForm').classList.add('show');
  document.getElementById('profileNewInput').focus();
}

function cancelNewProfile(){
  document.getElementById('profileNewForm').classList.remove('show');
  document.getElementById('profileNewInput').value='';
}

function saveNewProfile(){
  const val=sanitizeName(document.getElementById('profileNewInput').value,10);
  if(!val)return;
  const profiles=loadProfiles();
  if(profiles.length>=MAX_PROFILES)return;
  profiles.push(createDefaultProfile(val));
  saveProfiles(profiles);
  const newIdx=profiles.length-1;
  setActiveProfileIdx(newIdx);
  PLAYER_NAME=val;
  updateMenuProfileDisplay();
  cancelNewProfile();
  renderProfileSlots();
  closeProfileModal();
}

function openEditProfile(i){
  const profiles=loadProfiles();
  const p=profiles[i];
  if(!p)return;
  document.getElementById('editProfileModal').dataset.editIdx=i;
  document.getElementById('editProfileName').value=p.name;
  const currentIcon=getProfileIcon(p,i);
  document.getElementById('editProfileIconPreview').textContent=currentIcon;
  document.getElementById('editProfileIconPreview').dataset.selectedIcon=currentIcon;
  const grid=document.getElementById('editProfileEmojiGrid');
  grid.innerHTML='';
  PROFILE_EMOJIS.forEach(emoji=>{
    const btn=document.createElement('button');
    btn.textContent=emoji;
    btn.style.cssText=`font-size:22px;background:${emoji===currentIcon?'rgba(78,158,66,.25)':'rgba(255,255,255,.04)'};border:${emoji===currentIcon?'1px solid var(--c-fwyl)':'1px solid var(--border)'};border-radius:8px;padding:5px;cursor:pointer;transition:all .12s;line-height:1;`;
    btn.onclick=()=>{
      document.getElementById('editProfileIconPreview').textContent=emoji;
      document.getElementById('editProfileIconPreview').dataset.selectedIcon=emoji;
      grid.querySelectorAll('button').forEach(b=>{
        const isSelected=b.textContent===emoji;
        b.style.background=isSelected?'rgba(78,158,66,.25)':'rgba(255,255,255,.04)';
        b.style.borderColor=isSelected?'var(--c-fwyl)':'var(--border)';
      });
    };
    grid.appendChild(btn);
  });
  const backdrop=document.getElementById('profileModal');
  const editModal=document.getElementById('editProfileModal');
  backdrop.classList.remove('show');
  editModal.classList.add('show');
}

function focusIconPicker(){
  const grid=document.getElementById('editProfileEmojiGrid');
  if(grid)grid.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function closeEditProfile(){
  const editModal=document.getElementById('editProfileModal');
  const profileModal=document.getElementById('profileModal');
  if(editModal) editModal.classList.remove('show');
  if(profileModal) profileModal.classList.add('show');
  renderProfileSlots();
}

function saveEditProfile(){
  const idx=parseInt(document.getElementById('editProfileModal').dataset.editIdx||'0');
  const name=sanitizeName(document.getElementById('editProfileName').value,10);
  const icon=document.getElementById('editProfileIconPreview').dataset.selectedIcon||'🏌️';
  if(!name)return;
  const profiles=loadProfiles();
  if(!profiles[idx])return;
  profiles[idx].name=name;
  profiles[idx].icon=icon;
  saveProfiles(profiles);
  const activeIdx=getActiveProfileIdx();
  if(idx===activeIdx){
    PLAYER_NAME=name;
    updateMenuProfileDisplay();
    // Live update the TV Banner if playing
    const tvName = document.getElementById('tvName');
    if (tvName) tvName.textContent = name;
  }
  renderProfileSlots();
  closeEditProfile();
}

function openProfileModal(){
  _profileHubEditing = false;
  _profileHubEmoji = null;
  _profileHubCreateOpen = false;
  renderProfileHub('home', { animateRing:true });
  const modal = document.getElementById('profileHubModal');
  if(modal) modal.classList.add('show');
}
function closeProfileModal(){
  _closeProfileLikeModal('profileHubModal');
  _closeProfileLikeModal('profileModal');
}

function autoLoadProfile(){
  const profiles=loadProfiles();
  if(!profiles.length){
    const obs=document.getElementById('onboardScreen');
    if(obs){obs.style.display='flex';void obs.offsetWidth;obs.classList.add('visible');}
    document.getElementById('menuScreen').style.display='none';
  } else {
    const p=getActiveProfile();
    if(p) PLAYER_NAME=p.name.toUpperCase();
    document.getElementById('onboardScreen').style.display='none';
    showScreen('menuScreen','flex');
    updateMenuProfileDisplay();
    updateMenuContinueBtn();
  }
}

function createFirstProfile(){
  const val=sanitizeName(document.getElementById('onboardInput').value,12);
  if(!val){document.getElementById('onboardInput').focus();return;}
  const profiles=loadProfiles();
  profiles.push(createDefaultProfile(val));
  saveProfiles(profiles);
  setActiveProfileIdx(0);
  PLAYER_NAME=val;
  hideScreen('onboardScreen');
  updateMenuProfileDisplay();
  setTimeout(()=>{
    maybeTutorialPrompt();
  }, 300);
}

function resetProfileStats(i){
  showConfirm('Reset stats?', ()=>{
    const profiles=loadProfiles();
    if(!profiles[i])return;
    const name=profiles[i].name;
    const icon=profiles[i].icon;
    const profileId = profiles[i].id;
    profiles[i]=createDefaultProfile(name);
    if(profileId) profiles[i].id = profileId;
    if(icon) profiles[i].icon = icon;
    saveProfiles(profiles);
    const sp=document.getElementById('profileStatsPanel');
    if(sp)sp.remove();
    renderProfileSlots();
    showProfileStats(i);
  });
}
function showProfileStats(i){
  const profiles=loadProfiles();
  const p=profiles[i];
  if(!p)return;
  
  const slotsContainer = document.getElementById('profileSlots');
  const allBtns = slotsContainer.querySelectorAll('.profile-action-btn');
  
  const existing=document.getElementById('profileStatsPanel');
  if(existing){
    const isSame = existing.dataset.profileIdx === String(i);
    existing.remove();
    allBtns.forEach(b => b.classList.remove('active-action'));
    if(isSame) return; // If clicking the same one, just close it and return
  }
  
  // Highlight the clicked STATS button
  const slotDivs = slotsContainer.querySelectorAll('.profile-slot:not(.empty)');
  if (slotDivs[i]) {
      const statsBtn = slotDivs[i].querySelectorAll('.profile-action-btn')[1];
      if (statsBtn) statsBtn.classList.add('active-action');
  }

  const panel=document.createElement('div');
  panel.id='profileStatsPanel';
  panel.dataset.profileIdx = String(i);
  panel.style.cssText='background:rgba(255,255,255,.04);border:1px solid var(--c-fwyl);border-radius:10px;padding:12px;margin-top:6px;animation:fadein .2s ease;max-height:60vh;overflow-y:auto;';
  
  const bestStr=p.bestDiff===undefined?'—':p.bestDiff===0?'E':p.bestDiff>0?`+${p.bestDiff}`:`${p.bestDiff}`;
  const rows=[
    ['Games Played', p.gamesPlayed||0],['Holes Played', p.holesPlayed||0],
    ['Birdies', p.birdies||0],['Eagles', p.eagles||0],
    ['Hole-in-Ones', p.holeInOnes||0],['Wildcards Used', p.wildcardsUsed||0],['Best Score', bestStr],
  ];
  const earned=p.achievements||[];
  const total=ACHIEVEMENTS.length;
  const count=ACHIEVEMENTS.filter(a=>earned.includes(a.id)).length;

  const statsHTML=rows.map(([label,val])=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-family:'Sen',sans-serif;font-size:12px;"><span style="color:var(--muted);">${label}</span><span style="color:var(--text);font-weight:600;">${val}</span></div>`).join('');
  const achListHTML=ACHIEVEMENTS.map(a=>{
    const yes=earned.includes(a.id);
    return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);opacity:${yes?1:.35};">
      <span style="font-size:16px;flex-shrink:0;">${a.icon}</span>
      <div style="flex:1;min-width:0;"><div style="font-family:'Bebas Neue',cursive;font-size:12px;letter-spacing:1px;color:${yes?'var(--gold)':'var(--muted)'};">${a.name}</div><div style="font-family:'Sen', sans-serif;font-size:10px;color:var(--muted);">${a.desc}</div></div>
      <span style="font-size:11px;">${yes?'✅':'🔒'}</span>
    </div>`;
  }).join('');

  panel.innerHTML=
    `<div style="font-family:Bebas Neue,cursive;font-size:14px;letter-spacing:2px;color:var(--c-fwyl);margin-bottom:8px;">${escapeHtml(p.name.toUpperCase())} — STATS</div>`+
    statsHTML+
    `<button id="achToggleBtn" onclick="(function(){
      const l=document.getElementById('achList');
      const open=l.style.display!=='none';
      l.style.display=open?'none':'block';
      document.getElementById('achToggleArrow').textContent=open?'▸':'▾';
    })()" style="width:100%;background:transparent;border:none;border-top:1px solid var(--border);color:var(--c-fwyl);font-family:'Bebas Neue',cursive;font-size:13px;letter-spacing:2px;cursor:pointer;text-align:left;padding:8px 0 4px;display:flex;justify-content:space-between;align-items:center;">
      <span>ACHIEVEMENTS — ${count}/${total} (${Math.round(count/total*100)}%)</span><span id="achToggleArrow">▾</span>
    </button>`+
    `<div id="achList" style="display:block;">${achListHTML}</div>`+
    `<div style="margin-top:10px;"><button onclick="resetProfileStats(${i})" style="width:100%;background:rgba(255,82,82,.12);color:#ff8080;border:1px solid rgba(255,82,82,.3);border-radius:7px;padding:7px;font-family:'Sen',sans-serif;font-size:10px;letter-spacing:1px;cursor:pointer;">RESET STATS</button></div>`;
  
  slotsContainer.parentNode.insertBefore(panel, slotsContainer.nextSibling);
}
function updateMenuProfileDisplay(){
  const p=getActiveProfile();
  const el=document.getElementById('menuActiveProfile');
  if(el)el.textContent=''; 
  const nameEl=document.getElementById('menuProfileName');
  if(nameEl)nameEl.textContent=p?p.name.toUpperCase():'';
  const iconBtn=document.getElementById('menuProfileIconBtn');
  if(iconBtn){
    const idx=getActiveProfileIdx();
    iconBtn.textContent=p?getProfileIcon(p,idx):'👤';
  }
  const tvIcon=document.querySelector('.tv-icon-box');
  if(tvIcon&&p){const idx=getActiveProfileIdx();tvIcon.textContent=getProfileIcon(p,idx);}
  updateMenuContinueBtn();
}

let _profileHubView = 'home';
let _profileHubEditing = false;
let _profileHubEmoji = null;
let _profileHubCreateOpen = false;

function profileHubSwitchView(view){
  _profileHubView = view;
  ['home','stats','achievements'].forEach(v=>{
    const el = document.getElementById(`profileHubView${v.charAt(0).toUpperCase()+v.slice(1)}`);
    if(el) el.classList.toggle('active', v === view);
  });
}

function profileHubBackToHome(){
  renderProfileHub('home');
}

function profileHubGetCtx(){
  const profiles = loadProfiles();
  if(!profiles.length) return null;
  const activeIdx = Math.min(getActiveProfileIdx(), profiles.length - 1);
  const p = profiles[activeIdx];
  if(!p) return null;
  ensureProfileDefaults(p);
  return { profiles, activeIdx, p };
}

function renderProfileHub(view = _profileHubView, opts = {}){
  const ctx = profileHubGetCtx();
  const home = document.getElementById('profileHubViewHome');
  const stats = document.getElementById('profileHubViewStats');
  const ach = document.getElementById('profileHubViewAchievements');
  if(!home || !stats || !ach) return;
  if(!ctx){
    home.innerHTML = '';
    stats.innerHTML = '';
    ach.innerHTML = '';
    profileHubSwitchView('home');
    return;
  }

  const totalAch = ACHIEVEMENTS.length;
  const earned = ctx.p.achievements || [];
  const earnedCount = ACHIEVEMENTS.filter(a=>earned.includes(a.id)).length;
  const bestStr = ctx.p.bestDiff===undefined ? '—' : ctx.p.bestDiff===0 ? 'E' : ctx.p.bestDiff>0 ? `+${ctx.p.bestDiff}` : `${ctx.p.bestDiff}`;
  const xp = getXpSnapshot(ctx.p.xpTotal || 0);
  const animateRing = !!opts.animateRing;
  const ringCirc = 2 * Math.PI * 34;
  const ringOffset = ringCirc * (1 - (xp.progressPct / 100));
  const rank = getRankLabelForLevel(xp.level);
  const activeIcon = getProfileIcon(ctx.p, ctx.activeIdx);
  const nameVal = String(ctx.p.name || '').toUpperCase();
  const nameHtml = escapeHtml(nameVal);
  const activeIconHtml = escapeHtml(activeIcon);
  const buckets = ctx.p.scoreBuckets || { aces:0, eaglesPlus:0, birdies:0, pars:0, bogeys:0, doublePlus:0 };
  const acesTotal = Math.max(buckets.aces || 0, ctx.p.holeInOnes || 0);
  const eaglesPlusTotal = Math.max(buckets.eaglesPlus || 0, Math.max(0, (ctx.p.eagles || 0) - acesTotal));

  const emojis = PROFILE_EMOJIS.slice(0, 32);
  const emojiGrid = emojis.map(emoji=>{
    const selected = (_profileHubEmoji || activeIcon) === emoji;
    return `<button class="ph-emoji${selected?' sel':''}" onclick="profileHubSelectEmoji('${emoji.replace(/'/g, "\\'")}')">${emoji}</button>`;
  }).join('');

  const inactiveCards = ctx.profiles
    .map((p, i)=>({p, i}))
    .filter(row=>row.i !== ctx.activeIdx)
    .map(({p, i})=>{
      const s = getXpSnapshot(p.xpTotal || 0);
      const miniName = escapeHtml(String(p.name || '').toUpperCase());
      const miniIcon = escapeHtml(getProfileIcon(p, i));
      return `
        <button class="ph-mini-card" onclick="profileHubSelectProfile(${i})">
          <div class="ph-mini-avatar">${miniIcon}</div>
          <div style="min-width:0;text-align:left;">
            <div class="ph-mini-name">${miniName}</div>
            <div class="ph-mini-sub">LVL ${s.level} · ${getRankLabelForLevel(s.level)}</div>
          </div>
          <div class="ph-mini-arrow">›</div>
        </button>
      `;
    }).join('');

  const createBlock = _profileHubCreateOpen ? `
    <div class="ph-new-row">
      <input class="profile-new-input" id="profileHubNewInput" placeholder="YOUR NAME" maxlength="10" autocomplete="off" spellcheck="false" style="margin:0;">
      <button class="ph-btn primary" style="flex:0 0 auto;min-width:92px;" onclick="profileHubCreateProfile()">Create</button>
      <button class="ph-btn" style="flex:0 0 auto;min-width:84px;" onclick="profileHubToggleCreate(false)">Cancel</button>
    </div>
  ` : (ctx.profiles.length < MAX_PROFILES ? `
    <button class="ph-btn" style="width:100%;margin-top:10px;" onclick="profileHubToggleCreate(true)">+ New Profile (max. 3)</button>
  ` : '');

  home.innerHTML = `
    <div class="ph-main-card${_profileHubEditing ? ' editing' : ''}">
      <div class="ph-main-top">
        <div class="ph-ring-wrap glow">
          <svg class="ph-ring-svg" viewBox="0 0 82 82">
            <circle class="ph-ring-bg" cx="41" cy="41" r="34"></circle>
            <circle class="ph-ring-fill" id="profileHubRingFill" cx="41" cy="41" r="34" style="stroke-dasharray:${ringCirc};stroke-dashoffset:${animateRing ? ringCirc : ringOffset};"></circle>
          </svg>
          <div class="ph-avatar">${_profileHubEditing ? escapeHtml(_profileHubEmoji || activeIcon) : activeIconHtml}</div>
        </div>
        <div class="ph-main-info">
          ${_profileHubEditing
            ? `<input class="profile-new-input" id="profileHubNameInput" maxlength="10" autocomplete="off" spellcheck="false" value="${nameHtml}" style="margin-bottom:6px;">`
            : `<div class="ph-name">${nameHtml}</div>`
          }
          <div class="ph-sub">LVL ${xp.level} · ${rank}</div>
          <div class="ph-xp">${xp.level >= XP_MAX_LEVEL ? 'MAX LEVEL' : `${Math.max(0, Math.ceil(xp.need - xp.xpIntoLevel))} XP LEFT TO LEVEL UP`}</div>
        </div>
      </div>
      <div class="ph-stats6">
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.gamesPlayed||0}</div><div class="ph-stat-lbl">Rounds</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${bestStr}</div><div class="ph-stat-lbl">Best Score</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${earnedCount}</div><div class="ph-stat-lbl">Achievements</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.birdies||0}</div><div class="ph-stat-lbl">Birdies</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${eaglesPlusTotal}</div><div class="ph-stat-lbl">Eagles+</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${acesTotal}</div><div class="ph-stat-lbl">Aces</div></div>
      </div>
      <div class="ph-actions ph-actions-main">
        <button class="ph-btn" onclick="profileHubToggleEdit(true)">Edit</button>
        <button class="ph-btn primary" onclick="profileHubSwitchTo('stats')">Full Stats</button>
      </div>
      <div class="ph-actions ph-actions-ach">
        <button class="ph-btn gold" onclick="profileHubSwitchTo('achievements')">Achievements</button>
      </div>
      <div class="ph-edit-block">
        <div class="ph-edit-grid">${emojiGrid}</div>
      </div>
      <div class="ph-actions ph-actions-edit">
        <button class="ph-btn" onclick="profileHubToggleEdit(false)">Cancel</button>
        <button class="ph-btn primary" onclick="profileHubSaveEdit()">Save</button>
      </div>
      <div class="ph-delete-wrap">
        <button class="ph-btn danger" style="width:100%;" onclick="profileHubDeleteActive()">Delete Profile</button>
      </div>
    </div>
    <div class="ph-mini-list">
      ${inactiveCards}
    </div>
    ${createBlock}
  `;

  const totalParAll = ctx.p.totalPar || 0;
  const totalStrokesAll = ctx.p.totalStrokes || 0;
  const avgDiff = totalParAll > 0 ? ((totalStrokesAll - totalParAll) / Math.max(1, ctx.p.gamesPlayed || 1)) : 0;
  const avgDiffText = totalParAll > 0 ? (avgDiff===0?'E':avgDiff>0?`+${avgDiff.toFixed(1)}`:`${avgDiff.toFixed(1)}`) : '—';
  const distRows = [
    { key: 'aces', label: 'Ace', cls: 'eagle', value: acesTotal },
    { key: 'eaglesPlus', label: 'Eagle+', cls: 'eagle', value: eaglesPlusTotal },
    { key: 'birdies', label: 'Birdie', cls: 'birdie', value: buckets.birdies || 0 },
    { key: 'pars', label: 'Par', cls: 'par', value: buckets.pars || 0 },
    { key: 'bogeys', label: 'Bogey', cls: 'bogey', value: buckets.bogeys || 0 },
    { key: 'doublePlus', label: 'Double+', cls: 'double', value: buckets.doublePlus || 0 }
  ];
  const distMax = Math.max(1, ...distRows.map(r=>r.value || 0));
  stats.innerHTML = `
    <div class="ph-section">
      <div class="ph-sec-title" style="margin:0 0 8px;">FULL STATS</div>
      <div class="ph-kv-grid">
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.gamesPlayed||0}</div><div class="ph-stat-lbl">Rounds</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.holesPlayed||0}</div><div class="ph-stat-lbl">Holes</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${totalStrokesAll||0}</div><div class="ph-stat-lbl">Total Strokes</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${avgDiffText}</div><div class="ph-stat-lbl">Avg vs Par</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.xpTotal||0}</div><div class="ph-stat-lbl">Total XP</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${earnedCount}</div><div class="ph-stat-lbl">Achievements</div></div>
      </div>
    </div>
    <div class="ph-section">
      <div class="ph-sec-title">Score Distribution</div>
      <div class="ph-dist-list">
        ${distRows.map(row=>{
          const pct = Math.round((row.value / distMax) * 100);
          return `
            <div class="ph-dist-row">
              <div class="ph-dist-lbl">${row.label}</div>
              <div class="ph-dist-track"><div class="ph-dist-fill ${row.cls}" data-to="${pct}" style="width:0%;"></div></div>
              <div class="ph-dist-val">${row.value}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    <div class="ph-section">
      <div class="ph-sec-title">Streaks & Specials</div>
      <div class="ph-kv-grid">
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.bestBirdieStreak||0}</div><div class="ph-stat-lbl">Best Birdie Streak</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.bestUnderParStreak||0}</div><div class="ph-stat-lbl">Best Under-Par Streak</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.bogeyFreeRounds||0}</div><div class="ph-stat-lbl">Bogey-Free Rounds</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.gamesCompleted||0}</div><div class="ph-stat-lbl">Games Completed</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.versusPlayed||0}</div><div class="ph-stat-lbl">Versus Played</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.tournamentCompletions||0}</div><div class="ph-stat-lbl">Tournaments</div></div>
      </div>
    </div>
    <div class="ph-section">
      <div class="ph-sec-title">Wildcards & Hazards</div>
      <div class="ph-kv-grid">
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.wildcardsUsed||0}</div><div class="ph-stat-lbl">Wildcards Used</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.maxWcOneRound||0}</div><div class="ph-stat-lbl">Max WC / Round</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.wcDiscardedTotal||0}</div><div class="ph-stat-lbl">WC Discarded</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.timesInWater||0}</div><div class="ph-stat-lbl">Times in Water</div></div>
      </div>
    </div>
    <div style="padding:0 2px 2px;">
      <button class="ph-btn danger" style="width:100%;" onclick="profileHubResetStats()">RESET STATS</button>
    </div>
  `;

  const progressPct = totalAch > 0 ? Math.round((earnedCount / totalAch) * 100) : 0;
  const unlockedList = ACHIEVEMENTS.filter(a=>earned.includes(a.id));
  const lockedList = ACHIEVEMENTS.filter(a=>!earned.includes(a.id));
  const renderAchItem = (a, locked) => `
    <div class="ph-ach-item${locked?' locked':''}">
      <div class="ph-ach-icon">${a.icon}</div>
      <div style="min-width:0;">
        <div class="ph-ach-name">${a.name}</div>
        <div class="ph-ach-desc">${a.desc}</div>
      </div>
      <div class="ph-ach-xp">+${XP_ACH_UNLOCK_BONUS} XP</div>
    </div>
  `;
  ach.innerHTML = `
    <div class="ph-section">
      <div class="ph-sec-title" style="margin:0 0 8px;">ACHIEVEMENTS</div>
      <div class="xp-bar-track"><div class="xp-bar-fill" data-from="0" data-to="${progressPct}" style="width:0%;"></div></div>
      <div class="xp-bar-meta" style="margin-top:6px;"><span>${earnedCount} / ${totalAch} unlocked</span><span>${progressPct}%</span></div>
    </div>
    <div class="ph-section">
      <div class="ph-sec-title">Unlocked</div>
      <div class="ph-ach-list">${unlockedList.map(a=>renderAchItem(a, false)).join('') || `<div class="ph-ach-desc">No achievements yet.</div>`}</div>
    </div>
    <div class="ph-section">
      <div class="ph-sec-title">Locked</div>
      <div class="ph-ach-list">${lockedList.map(a=>renderAchItem(a, true)).join('')}</div>
    </div>
  `;

  profileHubSwitchView(view);
  const hubBack = document.getElementById('profileHubBackBtn');
  if(hubBack){
    const showBack = view !== 'home';
    hubBack.style.visibility = showBack ? 'visible' : 'hidden';
    hubBack.style.pointerEvents = showBack ? 'auto' : 'none';
  }
  const ring = document.getElementById('profileHubRingFill');
  if(ring){
    if(animateRing){
      requestAnimationFrame(()=>{ ring.style.strokeDashoffset = String(ringOffset); });
    } else {
      ring.style.transition = 'none';
      ring.style.strokeDashoffset = String(ringOffset);
      requestAnimationFrame(()=>{ ring.style.transition = ''; });
    }
  }
  if(view === 'stats') animateProfileDistBars(stats);
  animateXpBars(ach);
}

function animateProfileDistBars(root){
  const scope = root || document;
  scope.querySelectorAll('.ph-dist-fill[data-to]').forEach(fill=>{
    const to = Math.max(0, Math.min(100, parseFloat(fill.dataset.to || '0')));
    fill.style.width = '0%';
    requestAnimationFrame(()=>{ fill.style.width = `${to}%`; });
  });
}

function profileHubSwitchTo(view){
  renderProfileHub(view, { animateRing:false });
}

function profileHubToggleEdit(editing){
  _profileHubEditing = !!editing;
  if(!_profileHubEditing) _profileHubEmoji = null;
  renderProfileHub('home');
}

function profileHubSelectEmoji(emoji){
  _profileHubEmoji = emoji;
  _profileHubEditing = true;
  const home = document.getElementById('profileHubViewHome');
  const avatar = home ? home.querySelector('.ph-avatar') : null;
  if(avatar) avatar.textContent = emoji;
  if(home){
    home.querySelectorAll('.ph-emoji').forEach(btn=>{
      btn.classList.toggle('sel', btn.textContent === emoji);
    });
  }
}

function profileHubSaveEdit(){
  const ctx = profileHubGetCtx();
  if(!ctx) return;
  const input = document.getElementById('profileHubNameInput');
  const name = sanitizeName(input ? input.value : ctx.p.name, 10);
  if(!name) return;
  ctx.p.name = name;
  if(_profileHubEmoji) ctx.p.icon = _profileHubEmoji;
  ctx.profiles[ctx.activeIdx] = ctx.p;
  saveProfiles(ctx.profiles);
  PLAYER_NAME = name.toUpperCase();
  updateMenuProfileDisplay();
  const tvName = document.getElementById('tvName');
  if(tvName) tvName.textContent = name;
  _profileHubEditing = false;
  _profileHubEmoji = null;
  renderProfileHub('home');
}

function profileHubSelectProfile(i){
  const profiles = loadProfiles();
  if(!profiles[i]) return;
  setActiveProfileIdx(i);
  PLAYER_NAME = String(profiles[i].name || '').toUpperCase();
  updateMenuProfileDisplay();
  const tvName = document.getElementById('tvName');
  if(tvName) tvName.textContent = String(profiles[i].name || '');
  _profileHubEditing = false;
  _profileHubEmoji = null;
  _profileHubCreateOpen = false;
  renderProfileHub('home', { animateRing:true });
  showToast('PROFILE CHANGED');
}

function profileHubToggleCreate(open){
  _profileHubCreateOpen = !!open;
  renderProfileHub('home');
  if(_profileHubCreateOpen){
    const input = document.getElementById('profileHubNewInput');
    if(input) input.focus();
  }
}

function profileHubCreateProfile(){
  const input = document.getElementById('profileHubNewInput');
  const val = sanitizeName(input ? input.value : '', 10);
  if(!val) return;
  const profiles = loadProfiles();
  if(profiles.length >= MAX_PROFILES) return;
  profiles.push(createDefaultProfile(val));
  saveProfiles(profiles);
  setActiveProfileIdx(profiles.length - 1);
  PLAYER_NAME = val.toUpperCase();
  updateMenuProfileDisplay();
  const tvName = document.getElementById('tvName');
  if(tvName) tvName.textContent = val;
  _profileHubCreateOpen = false;
  renderProfileHub('home', { animateRing:true });
}

function profileHubResetStats(){
  const ctx = profileHubGetCtx();
  if(!ctx) return;
  showConfirm('ARE YOU SURE YOU WANT TO RESET YOUR CURRENT STATS AND LEVEL?', ()=>{
    const name = String(ctx.p.name || '').trim() || 'PLAYER';
    const icon = ctx.p.icon;
    const profileId = ctx.p.id;
    ctx.profiles[ctx.activeIdx] = createDefaultProfile(name);
    if(profileId) ctx.profiles[ctx.activeIdx].id = profileId;
    if(icon) ctx.profiles[ctx.activeIdx].icon = icon;
    saveProfiles(ctx.profiles);
    PLAYER_NAME = name.toUpperCase();
    updateMenuProfileDisplay();
    const tvName = document.getElementById('tvName');
    if(tvName) tvName.textContent = name;
    renderProfileHub('stats', { animateRing:true });
  });
}

function profileHubDeleteActive(){
  const ctx = profileHubGetCtx();
  if(!ctx) return;
  const name = ctx.p.name || 'this profile';
  const profileId = ctx.p.id || '';
  showConfirm(`Remove ${name}?`, ()=>{
    const profiles = loadProfiles();
    const idx = Math.min(getActiveProfileIdx(), profiles.length - 1);
    if(profileId) clearSavedGameForProfileId(profileId);
    profiles.splice(idx, 1);
    saveProfiles(profiles);
    if(!profiles.length){
      try{localStorage.removeItem('gg_tutorial_done');}catch{}
      try{localStorage.removeItem(PROFILE_SAVE_KEY);}catch{}
      try{localStorage.removeItem(LEGACY_SAVE_KEY);}catch{}
      closeProfileModal();
      hideScreen('menuScreen');
      const oi=document.getElementById('onboardInput');
      if(oi)oi.value='';
      const ob=document.getElementById('onboardScreen');
      if(ob){ob.style.display='flex';void ob.offsetWidth;ob.classList.add('visible');}
      return;
    }
    if(getActiveProfileIdx() >= profiles.length) setActiveProfileIdx(Math.max(0, profiles.length - 1));
    const p = getActiveProfile();
    if(p) PLAYER_NAME = String(p.name || '').toUpperCase();
    updateMenuProfileDisplay();
    _profileHubEditing = false;
    _profileHubEmoji = null;
    renderProfileHub('home');
  });
}

// ═══════════════════════════════════════
// LEGEND TOGGLE
// ═══════════════════════════════════════
