// Tutorial Prompt, Tutorial Round Setup, Guidance, and Completion Rewards
// TUTORIAL SYSTEM (complete rewrite)
// ═══════════════════════════════════════════════════════
let _tutWaitingForAction = false;
let TUT = { active:false, step:0, blocked:true };

function tutHasPlayed(){
  try{return localStorage.getItem('gg_tutorial_done')==='1';}catch{return false;}
}
function tutMarkDone(){
  try{localStorage.setItem('gg_tutorial_done','1');}catch{}
}

function maybeTutorialPrompt(){
  if(tutHasPlayed()) { showScreen('menuScreen','flex'); updateMenuProfileDisplay(); updateMenuContinueBtn(); return; }
  document.getElementById('tutPrompt').classList.add('show');
}

function skipTutorial(){
  tutMarkDone();
  document.getElementById('tutPrompt').classList.remove('show');
  showScreen('menuScreen','flex');
  updateMenuProfileDisplay(); updateMenuContinueBtn();
}

function startTutorialFromSettings(){
  hideScreen('menuScreen');
  startTutorial();
}

const TUT_HOLES_DATA=[
  {name:'TUTORIAL',yards:460,par:4,baseDiff:1,diff:1,hasWater:false},
  {name:'TUTORIAL',yards:560,par:5,baseDiff:1,diff:1,hasWater:true},
  {name:'TUTORIAL',yards:165,par:3,baseDiff:1,diff:1,hasWater:false},
];

const TUT_GRIDS = {
  h1_tee: [['fwy','fwy','fwy','fwy','rgh','fwy'],['fwy','rgh','fwy','fwy','fwy','fwy'],['fwy','fwy','fwy','fwy','fwy','rgh'],['rgh','fwy','fwy','fwy','fwy','fwy'],['fwy','fwy','rgh','fwy','fwy','fwy'],['fwy','fwy','fwy','fwy','fwy','fwy']],
  h1_fwy_far: [['fwy','fwy','chip','fwy','rgh','fwy'],['fwy','fwy','fwy','fwy','fwy','chip'],['rgh','fwy','fwy','fwy','fwy','fwy'],['fwy','fwy','fwy','fwy','rgh','fwy'],['fwy','chip','fwy','fwy','fwy','fwy'],['fwy','fwy','fwy','fwy','fwy','rgh']],
  h1_fwy_mid: [['grn','grn','grn','chip','grn','grn'],['grn','grn','grn','grn','grn','grn'],['chip','grn','grn','grn','grn','grn'],['grn','grn','grn','grn','grn','chip'],['grn','grn','grn','grn','grn','grn'],['grn','chip','grn','grn','grn','grn']],
  h1_putt: [['p1','p1','p1','p1','p2','p3'],['p1','p1','p1','p1','p1','p2'],['p1','p1','p1','p1','p1','p1'],['p1','p1','p1','p1','p1','p1'],['p1','p1','p1','p1','p1','p1'],['p1','p1','p1','p1','p1','p1']],
  h2_tee: [['fwy','fwy','h2o','fwy','fwy','fwy'],['fwy','fwy','fwy','h2o','fwy','fwy'],['h2o','fwy','fwy','fwy','fwy','h2o'],['fwy','h2o','fwy','fwy','fwy','ob'],['fwy','fwy','fwy','fwy','h2o','fwy'],['fwy','fwy','fwy','fwy','fwy','fwy']],
  h2_after: [['grn','grn','chip','grn','h2o','grn'],['grn','grn','grn','grn','grn','chip'],['h2o','grn','grn','grn','grn','grn'],['chip','grn','grn','h2o','grn','grn'],['grn','grn','grn','grn','grn','h2o'],['grn','grn','grn','grn','chip','grn']],
  h2_putt: [['p1','p1','p2','p1','p2','p3'],['p1','p1','p1','p2','p2','p3'],['p1','p1','p1','p1','p2','p2'],['p1','p1','p1','p1','p1','p2'],['p1','p1','p1','p1','p1','p1'],['p1','p1','p1','p1','p1','p1']],
  h3_tee: [['grn','grn','hole','grn','chip','grn'],['grn','grn','grn','grn','grn','grn'],['chip','grn','grn','grn','grn','grn'],['grn','grn','grn','grn','grn','grn'],['grn','grn','grn','grn','grn','chip'],['grn','grn','grn','grn','grn','grn']],
};

TUT = { active:false, step:0, blocked:true };
let _tutStep = -1;
let _tutHoleKey = 'h1';

function clearTutorialUiState(){
  TUT.active = false;
  TUT.blocked = false;
  _tutStep = -1;
  _tutHoleKey = 'h1';
  _tutWaitEvent = null;
  _tutWaitCallback = null;
  _tutPendingEvents = Object.create(null);
  _holdFinishBtn = false;
  window._disableTutScroll = false;

  const tutPrompt = document.getElementById('tutPrompt');
  if(tutPrompt) tutPrompt.classList.remove('show');

  const tutOverlay = document.getElementById('tutOverlay');
  if(tutOverlay) tutOverlay.classList.remove('show');

  const tutBackdrop = document.getElementById('tutBackdrop');
  if(tutBackdrop) tutBackdrop.classList.remove('show');

  document.querySelectorAll('.tut-pulse').forEach(el=>{
    el.classList.remove('tut-pulse','tut-elevate','tut-relative');
    el.style.zIndex = '';
    el.style.position = '';
    if(el.id === 'rollBtn') el.style.opacity = '';
  });

  const header = document.querySelector('header');
  if(header) header.style.zIndex = '100';

  const nextBtn = document.getElementById('nextShotBtn');
  if(nextBtn){
     nextBtn.textContent='NEXT SHOT';
     nextBtn.style.background='var(--c-tee)';
     nextBtn.style.pointerEvents = '';
     nextBtn.disabled=false;
     nextBtn.onclick=doNextShot;
  }
  _holdFinishBtn=false;
  hideNextShotBtn(true);
}

function startTutorial(){
  document.getElementById('tutPrompt').classList.remove('show');
  TUT.active = true;
  TUT.blocked = true;
  _tutStep = -1;
  _tutHoleKey = 'h1';
  _tutWaitEvent = null;
  _tutWaitCallback = null;
  _tutPendingEvents = Object.create(null);
  VS.active = false;
  _courseScreenFlow = 'single';
  if(VS.setup){
    VS.setup.courseSelected = false;
    VS.setup.course = null;
  }
  _holdFinishBtn = false;

  applyCourse(DEFAULT_COURSE_ID);
  applyCourseVisualTheme(DEFAULT_COURSE_ID);
  SETUP.mode = 'custom'; SETUP.rounds = 1; SETUP.holesConfig = '18';
  SETUP.course = DEFAULT_COURSE_ID; SETUP.courseSelected = true;
  GAME_DIFF = 1;
  resetGameState();
  S.courseId = DEFAULT_COURSE_ID;
  S.startIdx = 0; S.endIdx = 2; S.holeIdx = 0;
  for(let i=0;i<3;i++) HOLES[i] = {...TUT_HOLES_DATA[i]};
  S.holesConfig = '18';
  const p = getActiveProfile();
  PLAYER_NAME = p ? p.name.toUpperCase() : 'PLAYER';

  hideScreen('menuScreen');
  hideScreen('diffScreen');
  hideScreen('courseScreen');
  hideScreen('playModeScreen');
  hideScreen('customScreen');
  hideScreen('versusSetupScreen');
  hideScreen('vsOptionsScreen');
  showMainApp();
  wcReset();
  init();
  
  _tutBlockInput(true);
  setTimeout(()=>tutAdvance(), 600);
}

function _tutBlockInput(block){
  TUT.blocked = block;
  const rollBtn = document.getElementById('rollBtn');
  const nextBtn = document.getElementById('nextShotBtn');
  const wcFab = document.getElementById('wcFab');
  if(rollBtn) rollBtn.disabled = block;
  if(nextBtn) nextBtn.style.pointerEvents = block ? 'none' : '';
  if(wcFab) wcFab.style.pointerEvents = block ? 'none' : '';
}

function _tutScrollHighlightedElement(el, attempt = 0){
  if(!el) return;
  setTimeout(() => {
    if(window._disableTutScroll && attempt < 8){
      _tutScrollHighlightedElement(el, attempt + 1);
      return;
    }
    const rect = el.getBoundingClientRect();
    const y = rect.top + window.scrollY - (window.innerHeight / 2) + (rect.height / 2);
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }, attempt === 0 ? 60 : 120);
}

function _tutHighlight(sel, darken = true){
  document.querySelectorAll('.tut-pulse').forEach(e => {
     e.classList.remove('tut-pulse', 'tut-elevate', 'tut-relative');
     e.style.zIndex = '';
     e.style.position = '';
     if (e.id === 'rollBtn') e.style.opacity = ''; // Restore original opacity
  });
  let bd = document.getElementById('tutBackdrop');
  if (!bd) {
      bd = document.createElement('div');
      bd.id = 'tutBackdrop';
      bd.className = 'tut-backdrop';
      document.getElementById('mainApp').appendChild(bd);
  }

  if(!sel) {
    if(bd) bd.classList.remove('show');
    return;
  }

  // Reset header z-index safely before applying new highlights
  const header = document.querySelector('header');
  if(header) header.style.zIndex = '100';

  const els = document.querySelectorAll(sel);
  let scrolled = false;
  els.forEach(el => {
     el.classList.add('tut-pulse');
     // Force elevation inline to guarantee it pops over the backdrop
     el.style.position = window.getComputedStyle(el).position === 'static' ? 'relative' : window.getComputedStyle(el).position;
     el.style.zIndex = '745';
     if (el.id === 'rollBtn') el.style.opacity = '1'; // Prevent button from appearing dark when disabled
     
     // Elevate parent header if target is inside it to break stacking context
     const parentHeader = el.closest('header');
     if(parentHeader) parentHeader.style.zIndex = '745';
     
     // Robust scrolling calculation for iOS Safari compatibility
     if (!scrolled) {
         _tutScrollHighlightedElement(el);
         scrolled = true;
     }
  });

  if (darken) bd.classList.add('show');
  else bd.classList.remove('show');
}

function _tutEscapeHtml(text){
  return String(text||'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function _tutFormatText(text){
  const escaped = _tutEscapeHtml(text);
  return escaped
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\n/g,'<br>');
}

function _tutShowTip(title, text, btnLabel, highlight, darken = true, position = 'bottom'){
  _tutBlockInput(true);
  _tutHighlight(highlight || null, darken);
  const ov = document.getElementById('tutOverlay');
  ov.classList.remove('top', 'middle');
  
  if(position === 'top') ov.classList.add('top');
  else if(position === 'middle') ov.classList.add('middle');
  
  document.getElementById('tutOverlayTitle').textContent = title;
  document.getElementById('tutOverlayText').innerHTML = _tutFormatText(text);
  document.getElementById('tutOverlayBtn').textContent = btnLabel || 'GOT IT';
  ov.classList.add('show');
}

function _tutHideTip(){
  document.getElementById('tutOverlay').classList.remove('show');
  _tutHighlight(null);
  const bd = document.getElementById('tutBackdrop');
  if(bd) bd.classList.remove('show');
}

function tutNext(){
  _tutHideTip();
  tutAdvance();
}

function tutAdvance(){
  _tutStep++;
  const hi = S.holeIdx;
  
  if(hi === 0){
    if(_tutStep === 0){
      _tutShowTip('WELCOME TO DICEGOLF!', 'The goal of golf is simple: finish each hole in as **few strokes as possible**. Every shot counts as **1 stroke**. Each hole also has a target called **"Par"** — the number of strokes a good player is expected to need. This first hole is a **Par 4**, so the goal is to finish it in **4 strokes**. Later, you will also play Par 3 and Par 5 holes.', 'GOT IT', null);
      return;
    }
    if(_tutStep === 1){
      // Scorecard popup intentionally removed to keep the tutorial tighter.
      tutAdvance();
      return;
    }
    if(_tutStep === 2){
      _tutShowTip('TV SCOREBOARD', 'At the bottom, this TV scoreboard tracks your **shots** and your **running score** for the round.', 'GOT IT', '#tvBar', true);
      return;
    }
    if(_tutStep === 3){
      _tutShowTip('ZONE LEGEND', 'Each color represents a different area of the course: **Green = Fairway** (safe), **Brown = Rough** (harder shot), **Light Green = Chip** (short shot near the green), **Yellow = Sand** (tricky), **Blue = Water** (penalty), and **Red = Out of Bounds** (penalty). The **Putting Green** is where you finish the hole. Tap **ZONE LEGEND** to hide it, or turn it off completely in Settings.', 'GOT IT', '.legend', true, 'middle');
      return;
    }
    if(_tutStep === 4){
      _tutShowTip('THE GRID', 'The grid represents all the possible landing spots for your shot. When you roll the dice, one die selects the **Row** and the other selects the **Column**. Where they intersect is where your ball lands.', 'GOT IT', '.grid-wrap, .dice-row', true);
      return;
    }
    if(_tutStep === 5){
      _tutShowTip('ROLL THE DICE!', 'Time for your first shot. Tap the **ROLL** button to hit your tee shot. The dice determine where your ball lands.', 'SWING!', '#rollBtn', true);
      return;
    }
    if(_tutStep === 6){
      _tutHideTip();
      _tutBlockInput(false);
      _tutHighlight('#rollBtn', false);
      scrollToGrid();
      _tutWaitFor('after_shot', ()=>{ tutAdvance(); });
      return;
    }
    if(_tutStep === 7){
      _tutShowTip('SHOT LOG', 'Nice! You landed on the **Fairway**. The **Shot Log** right here tracks every shot you take.', 'GOT IT', '.log-section', true);
      return;
    }
    if(_tutStep === 8){
      S.yrdRemain = 150; updateYrd(); 
      _tutShowTip('PERFECT TEE SHOT!', 'Now that you’ve cleared the tee, check this panel. At the top, you’ll see the hole’s total length and its **Difficulty** — 1 star is easier, while 3 stars signal more hazards and trickier terrain. **Par** shows your target score, and the large readout on the right displays your **remaining distance**, mirrored by the progress bar. The closer you get to the hole, the better your grid becomes. Tap **NEXT SHOT** to continue.', 'GOT IT', '.hole-hero, #nextShotBtn', true);
      return;
    }
    if(_tutStep === 9){
      _tutHideTip();
      _tutBlockInput(false);
      _tutHighlight('#nextShotBtn', false);
      scrollToGrid();
      _tutWaitFor('next_shot_clicked', ()=>{ tutAdvance(); });
      return;
    }
    if(_tutStep === 10){
      _tutShowTip('GETTING CLOSER', 'Notice how the grid changed. Because you are closer to the hole, you now have more **Fairway** cells and a better chance of a good result. Let\'s roll your **approach shot**!', 'PROCEED', '.grid-wrap', true);
      scrollToGrid();
      return;
    }
    if(_tutStep === 11){
      _tutHideTip();
      _tutBlockInput(false);
      _tutHighlight('#rollBtn', false);
      scrollToGrid();
      _tutWaitFor('after_shot', ()=>{ tutAdvance(); });
      return;
    }
    if(_tutStep === 12){
      _tutShowTip('GREAT APPROACH!', 'You landed on the **Green** — the smooth surface around the hole where putting happens. On harder holes you will see more challenging zones like **Rough**, **Sand**, **Chip**, and sometimes **Water**, all of which can make your next shot more difficult. Tap **NEXT SHOT** to load the putting grid and finish the hole.', 'GOT IT', '#nextShotBtn', true);
      scrollToGrid();
      return;
    }
    if(_tutStep === 13){
      _tutHideTip();
      _tutBlockInput(false);
      _tutHighlight('#nextShotBtn', false);
      scrollToGrid();
      _tutWaitFor('next_shot_clicked', ()=>{ tutAdvance(); });
      return;
    }
    if(_tutStep === 14){
      _tutShowTip('PUTTING TIME!', 'Now it’s all about **putting**. The grid shows **1-Putt** (green, 1 stroke to finish), **2-Putt** (yellow, 2 strokes), and **3-Putt** (red, 3 strokes) cells. Aim always for **1-Putt**!', 'PUTT FOR BIRDIE', '.grid-wrap', true);
      scrollToGrid();
      return;
    }
    if(_tutStep === 15){
      _tutHideTip();
      _tutBlockInput(false);
      _tutHighlight('#rollBtn', false);
      scrollToGrid();
      _tutWaitFor('after_putt_shot', ()=>{ tutAdvance(); });
      return;
    }
    if(_tutStep === 16){
      _tutHideTip();
      _tutBlockInput(false);
      _tutHighlight('#nextShotBtn', false); 
      scrollToGrid();
      _tutWaitFor('hole_complete', ()=>{ tutAdvance(); });
      return;
    }
    if(_tutStep === 17){
      _tutShowTip('HOLE 1 COMPLETE!', 'Nice shot! You finished one stroke under Par — that’s called a **Birdie**. The goal is always to beat Par when you can! Let’s move to **Hole 2** to learn about hazards and special abilities.', 'NEXT HOLE', '.overlay .ov', true);
      return;
    }
    if(_tutStep === 18){
      document.getElementById('overlay').classList.remove('show');
      S.holeIdx = 1; _tutHoleKey = 'h2'; _tutStep = -1;
      loadHole();
      setTimeout(()=>tutAdvance(), 500);
      return;
    }
  }
  
  if(hi === 1){
    if(_tutStep === 0){
      _tutShowTip('HOLE 2 — PAR 5', 'This par 5 hole introduces hazards! 💧 **Water** and 🚫 **Out of Bounds (OB)** each add a **+2 penalty** to your score, and you replay from the same spot. Let\'s see how that works.', 'GOT IT', '.grid-wrap', true);
      return;
    }
    if(_tutStep === 1){
      _tutShowTip('WILDCARDS!', 'If you roll doubles, such as two 3s, you earn a **Wildcard**! Wildcards give you special abilities and can change the outcome of a hole. To see the full list, open the **Wildcard drawer** on the right, and tap the **"i"** at the top. Tap **ROLL** to continue.', 'PROCEED', '#rollBtn', true);
      return;
    }
    if(_tutStep === 2){
      _tutHideTip();
      _tutBlockInput(false);
      _tutHighlight('#rollBtn', false);
      scrollToGrid();
      _tutWaitFor('wc_revealed', ()=>{ tutAdvance(); }); 
      return;
    }
    if(_tutStep === 3){
      _tutShowTip('WILDCARD EARNED!', 'You rolled doubles and found a **Wildcard**! Tap the card to reveal it, then tap **EQUIP** to store it in your drawer.', 'GOT IT', '#wcReveal', false);
      return;
    }
    if(_tutStep === 4){
      _tutHideTip();
      _tutBlockInput(false);
      _tutHighlight('#wcReveal', false);
      _tutWaitFor('wc_equipped', ()=>{ tutAdvance(); });
      return;
    }
    if(_tutStep === 5){
      _tutShowTip('NEXT SHOT', 'Your **Phantom Stroke** is now stored in the drawer on the right. You can keep up to **3 wildcards** at the same time. When you are ready, tap **NEXT SHOT** to continue playing.', 'PROCEED', '#nextShotBtn', true);
      return;
    }
    if(_tutStep === 6){
      _tutHideTip();
      _tutBlockInput(false);
      _tutHighlight('#nextShotBtn', false);
      scrollToGrid();
      _tutWaitFor('next_shot_clicked', ()=>{ tutAdvance(); });
      return;
    }
    if(_tutStep === 7){
      _tutShowTip('WATCH OUT!', 'You avoided the first hazards. Now, roll your approach shot to try and reach the green. Keep clear of the **water**!', 'PROCEED', '#rollBtn', true);
      scrollToGrid();
      return;
    }
    if(_tutStep === 8){
      _tutHideTip();
      _tutBlockInput(false);
      _tutHighlight('#rollBtn', false);
      scrollToGrid();
      _tutWaitFor('after_shot', ()=>{ tutAdvance(); });
      return;
    }
    if(_tutStep === 9){
      _tutShowTip('💧 WATER HAZARD!', 'Oh no! That adds **+2 penalty strokes**. But wait... open the purple Wildcard drawer and tap **USE** on **Phantom Stroke** to remove **1 penalty stroke**!', 'PROCEED', null, true);
      return;
    }
    if(_tutStep === 10){
      _tutHideTip();
      _tutBlockInput(false);
      _tutHighlight('#wcFab', true);
      _tutWaitFor('wc_used', ()=>{ tutAdvance(); });
      return;
    }
    if(_tutStep === 11){
      _tutShowTip('PENALTY REMOVED!', 'Your **Wildcard** saved you a stroke! Now tap **NEXT SHOT** to continue.', 'THANKS!', '#nextShotBtn', true);
      scrollToGrid();
      return;
    }
    if(_tutStep === 12){
      _tutHideTip();
      _tutBlockInput(false);
      _tutHighlight('#nextShotBtn', false);
      scrollToGrid();
      _tutWaitFor('next_shot_clicked', ()=>{ tutAdvance(); });
      return;
    }
    if(_tutStep === 13){
      _tutShowTip('RECOVERY SHOT', 'You still have to replay the shot from the same spot, so this is your recovery chance. Roll again to try landing on the **Green**.', 'GOT IT', '#rollBtn', true);
      scrollToGrid();
      return;
    }
    if(_tutStep === 14){
      _tutHideTip();
      _tutBlockInput(false);
      _tutHighlight('#rollBtn', false);
      scrollToGrid();
      _tutWaitFor('after_shot', ()=>{ tutAdvance(); });
      return;
    }
    if(_tutStep === 15){
      _tutHideTip();
      _tutBlockInput(false);
      _tutHighlight('#nextShotBtn', false);
      scrollToGrid();
      _tutWaitFor('next_shot_clicked', ()=>{ tutAdvance(); });
      return;
    }
    if(_tutStep === 16){
      _tutShowTip('FINISH THE HOLE', 'Great, you have a chance for **Birdie** now! **ROLL** to putt.', 'PROCEED', '#rollBtn', true);
      scrollToGrid();
      return;
    }
    if(_tutStep === 17){
      _tutHideTip();
      _tutBlockInput(false);
      _tutHighlight('#rollBtn', false);
      scrollToGrid();
      _tutWaitFor('after_putt_shot', ()=>{ tutAdvance(); });
      return;
    }
    if(_tutStep === 18){
      _tutHideTip();
      _tutBlockInput(false);
      _tutHighlight('#nextShotBtn', false); // Highlight the FINISH HOLE button
      scrollToGrid();
      _tutWaitFor('hole_complete', ()=>{ tutAdvance(); });
      return;
    }
    if(_tutStep === 19){
      _tutShowTip('HOLE 2 DONE!', 'Wildcards can save your round, so use them wisely! The final hole coming up!', 'NEXT HOLE', '.overlay .ov', true);
      return;
    }
    if(_tutStep === 20){
      document.getElementById('overlay').classList.remove('show');
      S.holeIdx = 2; _tutHoleKey = 'h3'; _tutStep = -1;
      loadHole();
      setTimeout(()=>tutAdvance(), 500);
      return;
    }
  }
  
  if(hi === 2){
    if(_tutStep === 0){
      _tutShowTip('HOLE 3 — PAR 3', 'Par 3 holes are shorter and more direct. You tee off straight at the **Green**. This grid includes a special ⛳ **"Hole In!"** cell. Land on it for a chance at a **hole-in-one**! Tap **ROLL** to proceed.', 'ROLL', '#rollBtn', true);
      scrollToGrid();
      return;
    }
    if(_tutStep === 1){
      _tutHideTip();
      _tutBlockInput(false);
      _tutHighlight('#rollBtn', false);
      scrollToGrid();
      _tutWaitFor('hole_complete', ()=>{ tutAdvance(); });
      return;
    }
    if(_tutStep === 2){
      _tutShowTip('🏆 TUTORIAL COMPLETE!', 'WOW! A **hole-in-one**, what a finish! You\'ve learned the basics of **zones**, **dice**, **penalties**, **wildcards**, and **putting**. Now it\'s time to explore the full game. Enjoy! 🏌️', 'FINISH TUTORIAL', '.overlay .ov', true);
      return;
    }
    if(_tutStep === 3){
      tutComplete();
      return;
    }
  }
}

let _tutWaitCallback = null;
let _tutWaitEvent = null;
let _tutPendingEvents = Object.create(null);
const _TUT_PENDING_EVENT_MAX_AGE_MS = 1500;

function _tutWaitFor(event, cb){
  const queuedAt = _tutPendingEvents[event];
  if(queuedAt && (Date.now() - queuedAt) <= _TUT_PENDING_EVENT_MAX_AGE_MS){
    delete _tutPendingEvents[event];
    _tutWaitEvent = null;
    _tutWaitCallback = null;
    cb();
    return;
  }
  _tutWaitEvent = event;
  _tutWaitCallback = cb;
}

function _tutFire(event){
  if(!TUT.active) return;
  if(_tutWaitEvent === event && _tutWaitCallback){
    const cb = _tutWaitCallback;
    _tutWaitEvent = null;
    _tutWaitCallback = null;
    delete _tutPendingEvents[event];
    cb();
    return;
  }
  _tutPendingEvents[event] = Date.now();
}

function tutAfterShot(outcome){
  if(!TUT.active) return;
  _tutFire('after_shot');
}

function tutAfterPutt(){
  if(!TUT.active) return;
  _tutFire('after_putt');
}

function tutAfterHoleComplete(){
  if(!TUT.active) return;
  _tutFire('after_putt');
  _tutFire('hole_complete');
}

function tutAfterWcUse(){
  if(!TUT.active) return;
  _tutFire('wc_used');
}

function tutGetDice(){
  const hi = S.holeIdx;
  const sn = S.shotNum;
  if(hi === 0){
    if(sn === 1) return {r:3, c:4}; // tee -> fwy
    if(sn === 2) return {r:1, c:3}; // fwy -> grn
    if(sn === 3) return {r:2, c:4}; // grn -> p1
  }
  if(hi === 1){
    if(sn === 1) return {r:3, c:3}; // tee -> fwy (doubles)
    if(sn === 2) return {r:3, c:1}; // fwy -> h2o
    if(sn === 3) return {r:1, c:2}; // fwy -> grn (after phantom stroke)
    if(sn === 4) return {r:2, c:3}; // grn -> p1
  }
  if(hi === 2){
    if(sn === 1) return {r:1, c:3}; // tee -> hole
  }
  return {r:1, c:1}; // Fallback
}

function tutGetGrid(){
  const hi = S.holeIdx;
  if(hi === 0){
    if(S.zone === 'tee') return TUT_GRIDS.h1_tee;
    if(S.zone === 'fwy' && S.yrdRemain > 200) return TUT_GRIDS.h1_fwy_far;
    if(S.zone === 'fwy') return TUT_GRIDS.h1_fwy_mid;
    if(S.zone === 'grn') return TUT_GRIDS.h1_putt;
  }
  if(hi === 1){
    if(S.zone === 'tee') return TUT_GRIDS.h2_tee;
    if(S.zone !== 'grn') return TUT_GRIDS.h2_after;
    return TUT_GRIDS.h2_putt;
  }
  if(hi === 2){
    if(S.zone === 'tee') return TUT_GRIDS.h3_tee;
  }
  return null;
}

function tutComplete(isAbandon = false){
  _tutHideTip();
  _tutBlockInput(false);
  clearTutorialUiState();
  tutMarkDone();
  let tutorialAward = null;
  
  // ONLY award the achievement if they successfully finished it
  if (!isAbandon) {
      const profiles=loadProfiles();
      const idx=Math.min(getActiveProfileIdx(),profiles.length-1);
      let firstTutorialCompletion = true;
      if(profiles[idx]){
         firstTutorialCompletion = (profiles[idx].tutorialCompleted||0) === 0;
         profiles[idx].tutorialCompleted = (profiles[idx].tutorialCompleted||0)+1;
         saveProfiles(profiles);
         if(firstTutorialCompletion) checkAndAwardAchievements({silent:true});
      }
      if(firstTutorialCompletion){
        const tutScoreRow = S.scorecards[0] || [];
        const holesPlayed = 3;
        let roundTotal = 0;
        let roundPar = 0;
        for(let i = 0; i < 3; i++){
          const v = tutScoreRow[i];
          if(v !== null && v !== undefined){
            roundTotal += v;
            roundPar += HOLES[i].par;
          }
        }
        const roundDiff = roundTotal - roundPar;
        tutorialAward = awardRoundExperience({
          source: 'tutorial',
          title: 'GAINED XP',
          roundNumber: 1,
          roundIdx: 0,
          holesPlayed,
          roundDiff,
          roundTotal,
          roundPar,
          gameDiff: 1,
          tutorialBonus: 40,
          ensureLevel2: true
        });
      }
  }

  restoreBaseHoles();
  resetResult();
  document.getElementById('overlay').classList.remove('show');
  returnToMenu();
  if(!isAbandon && tutorialAward){
    showXpRewardModal('TUTORIAL COMPLETE', tutorialAward, 'CONTINUE');
  }
}

function tutMenuIntercept(){
  showConfirm('ABANDON TUTORIAL? You can always replay it from Settings.', ()=>{
    tutComplete(true); // Pass true because we abandoned it!
  });
}

// ═══════════════════════════════════════════════════════
