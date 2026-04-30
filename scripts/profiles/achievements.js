// Achievement Definitions, Unlocks, and Round Stat Updates

const ACHIEVEMENTS=[
  {id:'mini_tiger',            icon:'🐯', name:'Mini-Tiger',               desc:'Complete the tutorial'},
  {id:'first_round',           icon:'⛳', name:'First Round',              desc:'Complete your first round'},
  {id:'hard_finish',           icon:'💪', name:'Hard Mode',                desc:'Complete a full round on Hard difficulty'},
  {id:'architect',             icon:'🛠️', name:'The Architect',            desc:'Complete a round in Custom Game mode with your own specific settings'},
  {id:'participation_award',   icon:'🏅', name:'Participation award',      desc:'Complete a full 4-Round Tournament mode game'},
  {id:'feels_like_major',      icon:'🏆', name:'Feels like a Major',       desc:'Complete a Tournament on Hard and score Even Par (E) or better in all 4 rounds'},
  {id:'ten_rounds',            icon:'🫡', name:'Veteran',                  desc:'Play 10 complete rounds'},
  {id:'fifty_rounds',          icon:'🏌️', name:'Tour Pro',                 desc:'Play 50 complete rounds'},
  {id:'bogey_free',            icon:'🚫', name:'Bogey Free',               desc:'Complete a round with zero bogeys'},
  {id:'under_par',             icon:'📉', name:'Under Par',                desc:'Finish any round under par'},
  {id:'grand_slam',            icon:'👑', name:'Grand Slam',               desc:'Finish under par on all 3 difficulties'},
  {id:'par_3_specialist',      icon:'🏝️', name:'Par 3 Specialist',         desc:'Play a full 18-hole round and score Par or better on every Par 3 hole'},
  {id:'perfect_round',         icon:'🌟', name:'Perfect Round',            desc:'Par or better on every hole in a round'},
  {id:'first_birdie',          icon:'🐦', name:'First Birdie',             desc:'Score your first Birdie'},
  {id:'eagle',                 icon:'🦅', name:'Eagle Eye',                desc:'Score an Eagle on any hole'},
  {id:'hole_in_one',           icon:'🕳️', name:'Ace!',                     desc:'Hole-in-one on a par 3'},
  {id:'on_a_roll',             icon:'📈', name:'On A Roll',                desc:'Go under par for 3 consecutive holes'},
  {id:'birdie_streak',         icon:'🔥', name:'Birdie Jockey',            desc:'5 Birdies in a single round'},
  {id:'rollercoaster',         icon:'🎢', name:'Rollercoaster Round',      desc:'Score a Birdie (or better) and a Double Bogey (or worse) in the same round'},
  {id:'ice_veins',             icon:'🥶', name:'Ice in the Veins',         desc:'Score a Birdie or better immediately following a hole where you scored a Double Bogey or worse'},
  {id:'triple_trouble',        icon:'💀', name:'Triple Trouble',           desc:'Score +3 or worse on a single hole'},
  {id:'scuba_diver',           icon:'🤿', name:'Scuba Diver',              desc:'Hit into the Water hazard twice during the round'},
  {id:'beach_bum',             icon:'🏖️', name:'Beach Bum',                desc:'Land in the Sand zone 5 times in a single round'},
  {id:'lumberjack',            icon:'🪵', name:'Lumberjack',               desc:'Land in the Rough zone 10 times in a single round'},
  {id:'first_wc',              icon:'🃏', name:'Card Shark',               desc:'Use your first Wildcard'},
  {id:'high_roller',           icon:'🎰', name:'High Roller',              desc:'Use 10 Wildcards in a single round'},
  {id:'not_hungry',            icon:'🙅‍♂️', name:'MOM, I\'M NOT HUNGRY',     desc:'Discard 5 Wildcards during a single round'},
  {id:'hoarder',               icon:'🎒', name:'Hoarder',                  desc:'Have 3 Wildcards equipped in your drawer at the exact same time'},
  {id:'my_precious',           icon:'🤩', name:'My precious!',             desc:'Find the legendary Wildcard'},
  {id:'thanks_but_no_thanks',  icon:'🗑️', name:'Thanks, But No Thanks',    desc:'Discard an Epic or Legendary wildcard from the reveal screen'},
  {id:'calculated_adjustment', icon:'🧤', name:'Calculated Adjustment',    desc:'Use Precision Grip to manually save yourself from a penalty'},
  {id:'express_route',         icon:'⚡', name:'Taking the Express Route', desc:'Use the Shortcut Wildcard on a Par 5 to skip directly to the Chip zone after the tee shot'},
  {id:'magnetic_personality',  icon:'🧲', name:'Magnetic Personality',     desc:'Have the Cup Magnet Wildcard actively turn a missed putt into a 1-Putt'},
  {id:'rocket_approach',       icon:'🚀', name:'Rocket Approach',          desc:'Activate Birdie Boost from the Rough/Sand and successfully land on a Green cell'},
  {id:'landscaper',            icon:'🚜', name:'The Landscaper',           desc:'With Mower\'s Revenge active, convert two Rough results into a Fairway on a single hole'},
  {id:'eyes_closed',           icon:'👀', name:'Eyes closed, mouth shut',  desc:'Use the Mulligan/Precision Grip/Tailwind on the Putting Grid to score Birdie or better'},
  {id:'scrambler',             icon:'🛟', name:'The Scrambler',            desc:'Save Par after hitting a hazard without using Lucky Bounce or Phantom Stroke'},
  {id:'sniper',                icon:'🎯', name:'Sniper',                   desc:'Hole out from off the green (Chip/Sand)'},
  {id:'weasel_way_out',        icon:'🦡', name:'Weasel Way Out',           desc:'Sink a shot directly from the greenside bunker using The Ferrett Wildcard'},
  {id:'get_the_cameras',       icon:'🎥', name:'Get the Cameras!',         desc:'With the help of Highlight Reel Wildcard, successfully land on a "Hole In!" cell from a Chip zone'},
];

const ACHIEVEMENT_RULES = {
  mini_tiger: p => (p.tutorialCompleted||0) >= 1,
  first_round: p => (p.gamesPlayed||0) >= 1,
  hard_finish: p => (p.hardRounds||0) >= 1,
  architect: p => (p.customGamesCompleted||0) >= 1,
  participation_award: p => (p.tournamentCompletions||0) >= 1,
  feels_like_major: p => (p.majorLikeFinishes||0) >= 1,
  ten_rounds: p => (p.gamesPlayed||0) >= 10,
  fifty_rounds: p => (p.gamesPlayed||0) >= 50,
  bogey_free: p => (p.bogeyFreeRounds||0) >= 1,
  under_par: p => p.bestDiff!==undefined && p.bestDiff < 0,
  grand_slam: p => (p.easyUnderPar||0)>=1 && (p.medUnderPar||0)>=1 && (p.hardUnderPar||0)>=1,
  par_3_specialist: p => (p.par3SpecialistRounds||0) >= 1,
  perfect_round: p => (p.perfectRounds||0) >= 1,
  first_birdie: p => (p.birdies||0) >= 1,
  eagle: p => (p.eagles||0) >= 1,
  hole_in_one: p => (p.holeInOnes||0) >= 1,
  on_a_roll: () => false,
  birdie_streak: p => (p.bestBirdieStreak||0) >= 5,
  rollercoaster: p => (p.rollercoasterRounds||0) >= 1,
  ice_veins: p => (p.iceVeinsRounds||0) >= 1,
  triple_trouble: p => (p.tripleTroubles||0) >= 1,
  scuba_diver: p => (p.scubaDiverRounds||0) >= 1,
  beach_bum: p => (p.beachBumRounds||0) >= 1,
  lumberjack: p => (p.lumberjackRounds||0) >= 1,
  first_wc: p => (p.wildcardsUsed||0) >= 1,
  high_roller: p => (p.maxWcOneRound||0) >= 10,
  not_hungry: p => (p.wcDiscardedRound||0) >= 5,
  scrambler: p => (p.scramblerRounds||0) >= 1
};

function isAchievementContextEligible(){
  if (TUT.active) return false;
  if (VS.active) return false;
  return true;
}

function _getAchievementContext(){
  if(!isAchievementContextEligible()) return null;
  const profiles=loadProfiles();
  if(!profiles.length) return null;
  const idx=Math.min(getActiveProfileIdx(),profiles.length-1);
  const p=profiles[idx];
  if(!p) return null;
  ensureProfileDefaults(p);
  return {profiles, idx, p};
}

function _findAchievementById(id){
  return ACHIEVEMENTS.find(a=>a.id===id) || null;
}

function grantAchievementXpForProfile(ctx, count){
  const grants = Math.max(0, count || 0);
  if(!ctx || !ctx.p || !grants) return;
  const add = grants * XP_ACH_UNLOCK_BONUS;
  _queueAchievementXp(ctx.idx, add);
}

function hasAchievement(id, p){
  const prof = p || getActiveProfile();
  if(!prof) return false;
  return (prof.achievements||[]).includes(id);
}

function unlockAchievement(id){
  const ach = _findAchievementById(id);
  if(!ach) return false;
  const ctx = _getAchievementContext();
  if(!ctx) return false;
  if((ctx.p.achievements||[]).includes(id)) return false;
  ctx.p.achievements.push(id);
  grantAchievementXpForProfile(ctx, 1);
  ctx.profiles[ctx.idx]=ctx.p;
  saveProfiles(ctx.profiles);
  showAchievementPopup(ach);
  return true;
}

function maybeUnlockHoarder(){
  if(Array.isArray(WCS.equipped) && WCS.equipped.length >= 3){
    unlockAchievement('hoarder');
  }
}

function trackImmediateRoundAchievementProgress(resolvedOutcome, isPenalty){
  if(isPenalty){
    if(resolvedOutcome === 'h2o'){
      S._roundWaterHits = (S._roundWaterHits || 0) + 1;
      if(S._roundWaterHits >= 2) unlockAchievement('scuba_diver');
    }
    return;
  }
  if(resolvedOutcome === 'sand'){
    S._roundSandHits = (S._roundSandHits || 0) + 1;
    if(S._roundSandHits >= 5) unlockAchievement('beach_bum');
    return;
  }
  if(resolvedOutcome === 'rgh'){
    S._roundRoughHits = (S._roundRoughHits || 0) + 1;
    if(S._roundRoughHits >= 10) unlockAchievement('lumberjack');
  }
}

function handleShotAchievementOutcome(resolvedOutcome, prevZone){
  if(S._rocketApproachPending){
    if(resolvedOutcome === 'grn') unlockAchievement('rocket_approach');
    S._rocketApproachPending = false;
  }
  if(resolvedOutcome === 'hole' && (prevZone === 'chip' || prevZone === 'sand')){
    unlockAchievement('sniper');
    if(prevZone === 'sand' && S._ferrettArmedShot) unlockAchievement('weasel_way_out');
    if(prevZone === 'chip' && S._highlightReelArmedShot) unlockAchievement('get_the_cameras');
  }
  S._ferrettArmedShot = false;
  S._highlightReelArmedShot = false;
}

function checkAndAwardAchievements(options = {}){
  const ctx = _getAchievementContext();
  if(!ctx) return [];
  const newlyEarned=[];
  ACHIEVEMENTS.forEach(a=>{
    const rule = ACHIEVEMENT_RULES[a.id];
    if(!rule) return;
    if((ctx.p.achievements||[]).includes(a.id)) return;
    if(rule(ctx.p)){
      ctx.p.achievements.push(a.id);
      newlyEarned.push(a);
    }
  });
  if(!newlyEarned.length) return [];
  grantAchievementXpForProfile(ctx, newlyEarned.length);
  ctx.profiles[ctx.idx]=ctx.p;
  saveProfiles(ctx.profiles);
  if(!options.silent){
    showAchievementPopups(newlyEarned);
  }
  return newlyEarned;
}

function showAchievementPopups(achievements, initialDelay = 0){
  if(!Array.isArray(achievements) || !achievements.length) return;
  achievements.forEach((achievement, i)=>{
    const ach = typeof achievement === 'string' ? _findAchievementById(achievement) : achievement;
    if(ach) setTimeout(()=>showAchievementPopup(ach), initialDelay + (i * 2000));
  });
}

function applyCompletionModeAchievements(){
  if(!isAchievementContextEligible()) return;
  if(S.currentRound !== S.totalRounds) return;
  const ctx = _getAchievementContext();
  if(!ctx) return;
  if(S.mode === 'custom'){
    ctx.p.customGamesCompleted = (ctx.p.customGamesCompleted||0) + 1;
  }
  if(S.mode === 'tournament' && S.totalRounds === 4){
    ctx.p.tournamentCompletions = (ctx.p.tournamentCompletions||0) + 1;
    const allEvenOrBetter = Array.from({length:S.totalRounds}, (_,rIdx)=>{
      const sc = S.scorecards[rIdx] || [];
      let total=0, par=0;
      let complete=true;
      for(let i=S.startIdx;i<=S.endIdx;i++){
        const v=sc[i];
        if(v===null || v===undefined){ complete=false; break; }
        total += v;
        par += HOLES[i].par;
      }
      if(!complete) return false;
      return (total - par) <= 0;
    }).every(Boolean);
    if(GAME_DIFF===3 && allEvenOrBetter){
      ctx.p.majorLikeFinishes = (ctx.p.majorLikeFinishes||0) + 1;
    }
  }
  ctx.profiles[ctx.idx]=ctx.p;
  saveProfiles(ctx.profiles);
}

function showAchievementPopup(a){
  if(!document.getElementById('achStyles')){
    const s=document.createElement('style');s.id='achStyles';
    s.textContent='@keyframes achIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes achOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(120%)}}';
    document.head.appendChild(s);
  }
  const el=document.createElement('div');
  el.style.cssText='position:fixed;top:calc(env(safe-area-inset-top) + 60px);right:16px;background:linear-gradient(135deg,#2a1a40,#1a3020);border:1px solid var(--gold);border-radius:14px;padding:12px 16px;z-index:999;display:flex;align-items:center;gap:12px;box-shadow:0 4px 24px rgba(0,0,0,.6);max-width:260px;animation:achIn .4s cubic-bezier(.34,1.56,.64,1) forwards;';
  el.innerHTML=`<div style="font-size:28px;flex-shrink:0;">${a.icon}</div><div><div style="font-family:'Sen',sans-serif;font-size:9px;letter-spacing:2px;color:var(--gold);margin-bottom:2px;">ACHIEVEMENT UNLOCKED</div><div style="font-family:'Bebas Neue',cursive;font-size:16px;letter-spacing:2px;color:#fff;line-height:1;">${a.name}</div><div style="font-family:'Sen',sans-serif;font-size:9px;color:rgba(255,255,255,.6);margin-top:2px;">${a.desc}</div></div>`;
  document.body.appendChild(el);
  let _achStartX=0,_achDismissed=false;
  el.addEventListener('touchstart',e=>{_achStartX=e.touches[0].clientX;},{passive:true});
  el.addEventListener('touchmove',e=>{
    const dx=e.touches[0].clientX-_achStartX;
    if(dx>0)el.style.transform=`translateX(${dx}px)`;
  },{passive:true});
  el.addEventListener('touchend',e=>{
    const dx=e.changedTouches[0].clientX-_achStartX;
    if(dx>60&&!_achDismissed){_achDismissed=true;el.style.animation='achOut .3s ease forwards';setTimeout(()=>el.remove(),320);}
    else{el.style.transform='';}
  },{passive:true});
  el.addEventListener('click',()=>{if(!_achDismissed){_achDismissed=true;el.style.animation='achOut .3s ease forwards';setTimeout(()=>el.remove(),320);}});
  const _achTimer=setTimeout(()=>{if(!_achDismissed){_achDismissed=true;el.style.animation='achOut .5s ease forwards';setTimeout(()=>el.remove(),520);}},3500);
}

function updateProfileStatsAfterRound(score,par,wcUsedThisRound){
  if(TUT.active) return;
  const profiles=loadProfiles();
  const idx=Math.min(getActiveProfileIdx(),profiles.length-1);
  const p=profiles[idx];if(!p)return;
  ensureProfileDefaults(p);
  let maxStreak=0,curStreak=0,bogeyFree=true,allParOrBetter=true,underParStreak=0,maxUnderParStreak=0;
  let hasBirdieOrBetter=false;
  let hasDoubleOrWorse=false;
  let iceArmed=false;
  let iceTriggered=false;
  let waterHits=0;
  let sandHits=0;
  let roughHits=0;
  let scramblerQualified=false;
  HOLES.forEach((h,i)=>{
    const hist=S.histories[S.currentRound-1][i];
    if(!hist)return;
    const d=hist.strokes-hist.par;
    if(d===-1){curStreak++;}else{maxStreak=Math.max(maxStreak,curStreak);curStreak=0;}
    if(d>=1)bogeyFree=false;
    if(d>0)allParOrBetter=false;
    if(d<0){underParStreak++;maxUnderParStreak=Math.max(maxUnderParStreak,underParStreak);}else{underParStreak=0;}
    if(d<=-1){
      hasBirdieOrBetter=true;
      if(iceArmed) iceTriggered=true;
    }
    if(d>=2){
      hasDoubleOrWorse=true;
      iceArmed=true;
    }
    (hist.log||[]).forEach(e=>{
      if(e.pen && e.zk==='h2o') waterHits++;
      if(!e.pen && e.zk==='sand') sandHits++;
      if(!e.pen && e.zk==='rgh') roughHits++;
    });
    const wcsUsed = hist.wcsUsed || [];
    const usedDisallowed = wcsUsed.some(n=>n==='Lucky Bounce' || n==='Phantom Stroke');
    const hadHazPenalty = (hist.log||[]).some(e=>e.pen && (e.zk==='h2o' || e.zk==='ob'));
    if(hadHazPenalty && !usedDisallowed && d<=0) scramblerQualified=true;
  });
  maxStreak=Math.max(maxStreak,curStreak);
  p.bestBirdieStreak=Math.max(p.bestBirdieStreak||0,maxStreak);
  p.bestUnderParStreak=Math.max(p.bestUnderParStreak||0,maxUnderParStreak);
  p._curUnderParStreak=0; 
  if(bogeyFree)p.bogeyFreeRounds=(p.bogeyFreeRounds||0)+1;
  if(allParOrBetter)p.perfectRounds=(p.perfectRounds||0)+1;
  p.maxWcOneRound=Math.max(p.maxWcOneRound||0,wcUsedThisRound||0);
  const diff=score-par;
  if(GAME_DIFF===1&&diff<0)p.easyUnderPar=(p.easyUnderPar||0)+1;
  if(GAME_DIFF===2&&diff<0)p.medUnderPar=(p.medUnderPar||0)+1;
  if(GAME_DIFF===3){p.hardRounds=(p.hardRounds||0)+1;if(diff<0)p.hardUnderPar=(p.hardUnderPar||0)+1;}
  if(hasBirdieOrBetter && hasDoubleOrWorse) p.rollercoasterRounds=(p.rollercoasterRounds||0)+1;
  if(iceTriggered) p.iceVeinsRounds=(p.iceVeinsRounds||0)+1;
  p.timesInWater = (p.timesInWater || 0) + waterHits;
  if(waterHits>=2) p.scubaDiverRounds=(p.scubaDiverRounds||0)+1;
  if(sandHits>=5) p.beachBumRounds=(p.beachBumRounds||0)+1;
  if(roughHits>=10) p.lumberjackRounds=(p.lumberjackRounds||0)+1;
  if(scramblerQualified) p.scramblerRounds=(p.scramblerRounds||0)+1;
  if(S.startIdx===0 && S.endIdx===17){
    const par3Indices = HOLES.map((h, i)=>h.par===3 ? i : -1).filter(i=>i>=0);
    const par3Specialist = par3Indices.length>0 && par3Indices.every(i=>{
      const hist = S.histories[S.currentRound-1][i];
      return !!hist && hist.strokes <= hist.par;
    });
    if(par3Specialist) p.par3SpecialistRounds=(p.par3SpecialistRounds||0)+1;
  }
  profiles[idx]=p;saveProfiles(profiles);
}
