// Grid Templates, Course Definitions, and Course Theme Helpers
// GRID TEMPLATES
// ═══════════════════════════════════════
// Layout families: open | doglegs | bunkerFwy | bunkerGreen | waterCross | waterApproach
//                  cathedral | coastal | desertWash | waterTee | stadium(par3 only)
// Each template = exactly 36 cells (6×6 grid)

// ── TEE SHOTS (par 4/5) ─────────────────────────────────────
// open / bunkerGreen / waterApproach share a wide-fairway tee (hazard is elsewhere)
const T_TEE_OPEN_E  = ()=>cells(['fwy',30],['rgh',6]);
const T_TEE_OPEN_M  = ()=>cells(['fwy',24],['rgh',10],['sand',2]);
const T_TEE_OPEN_H  = ()=>cells(['fwy',18],['rgh',15],['sand',3]);

// doglegs — narrow line, OB punishes big miss
const T_TEE_DOG_E   = ()=>cells(['fwy',28],['rgh',8]);
const T_TEE_DOG_M   = ()=>cells(['fwy',23],['rgh',12],['ob',1]);
const T_TEE_DOG_H   = ()=>cells(['fwy',19],['rgh',16],['ob',1]);

// bunkerFwy — fairway bunker sits in landing zone
const T_TEE_BFWY_E  = ()=>cells(['fwy',29],['rgh',5],['sand',2]);
const T_TEE_BFWY_M  = ()=>cells(['fwy',24],['rgh',8],['sand',4]);
const T_TEE_BFWY_H  = ()=>cells(['fwy',21],['rgh',10],['sand',7]);

// waterCross — must carry water off the tee
const T_TEE_WCRS_E  = ()=>cells(['fwy',29],['rgh',4],['h2o',3]);
const T_TEE_WCRS_M  = ()=>cells(['fwy',25],['rgh',7],['h2o',4]);
const T_TEE_WCRS_H  = ()=>cells(['fwy',21],['rgh',9],['h2o',6]);

// coastal — exposed ocean-edge tee shots with cliff/water pressure
const T_TEE_COAST_E = ()=>cells(['fwy',24],['rgh',6],['h2o',4],['sand',2]);
const T_TEE_COAST_M = ()=>cells(['fwy',20],['rgh',7],['h2o',6],['sand',3]);
const T_TEE_COAST_H = ()=>cells(['fwy',16],['rgh',8],['h2o',8],['sand',4]);

// desertWash — sandy corridors and harder recovery
const T_TEE_DSRT_E  = ()=>cells(['fwy',25],['rgh',6],['sand',5]);
const T_TEE_DSRT_M  = ()=>cells(['fwy',20],['rgh',8],['sand',8]);
const T_TEE_DSRT_H  = ()=>cells(['fwy',16],['rgh',9],['sand',11]);

// waterTee — water is in play immediately from the tee
const T_TEE_WTEE_E  = ()=>cells(['fwy',24],['rgh',4],['h2o',8]);
const T_TEE_WTEE_M  = ()=>cells(['fwy',20],['rgh',5],['h2o',11]);
const T_TEE_WTEE_H  = ()=>cells(['fwy',16],['rgh',6],['h2o',14]);

// cathedral — tight trees, OB both sides
const T_TEE_CATH_E  = ()=>cells(['fwy',26],['rgh',10]);
const T_TEE_CATH_M  = ()=>cells(['fwy',21],['rgh',14],['ob',1]);
const T_TEE_CATH_H  = ()=>cells(['fwy',18],['rgh',15],['ob',1],['sand',2]);

// ── TEE SHOTS (par 3) ──────────────────────────────────────
// open par 3 — short, generous green
const T_P3_OPEN_E   = ()=>cells(['grn',31],['chip',3],['sand',1],['hole',1]);
const T_P3_OPEN_M   = ()=>cells(['grn',26],['chip',5],['sand',4],['hole',1]);
const T_P3_OPEN_H   = ()=>cells(['grn',22],['chip',7],['sand',6],['hole',1]);

// waterCross par 3 — full carry over water
const T_P3_WCRS_E   = ()=>cells(['grn',29],['chip',3],['h2o',2],['sand',1],['hole',1]);
const T_P3_WCRS_M   = ()=>cells(['grn',25],['chip',4],['h2o',4],['sand',2],['hole',1]);
const T_P3_WCRS_H   = ()=>cells(['grn',21],['chip',5],['h2o',6],['sand',3],['hole',1]);

// waterTee par 3 — Augusta-style forced tee carry over water
const T_P3_WTEE_E   = ()=>cells(['grn',24],['chip',3],['h2o',7],['sand',1],['hole',1]);
const T_P3_WTEE_M   = ()=>cells(['grn',20],['chip',4],['h2o',9],['sand',2],['hole',1]);
const T_P3_WTEE_H   = ()=>cells(['grn',17],['chip',4],['h2o',11],['sand',3],['hole',1]);

// bunkerGreen par 3 — bunkers all around green
const T_P3_BGRN_E   = ()=>cells(['grn',27],['chip',3],['sand',5],['hole',1]);
const T_P3_BGRN_M   = ()=>cells(['grn',23],['chip',4],['sand',8],['hole',1]);
const T_P3_BGRN_H   = ()=>cells(['grn',20],['chip',5],['sand',10],['hole',1]);

// stadium par 3 — larger target but deep bunker punishment
const T_P3_STAD_E   = ()=>cells(['grn',28],['chip',3],['sand',4],['hole',1]);
const T_P3_STAD_M   = ()=>cells(['grn',24],['chip',4],['sand',7],['hole',1]);
const T_P3_STAD_H   = ()=>cells(['grn',20],['chip',5],['sand',10],['hole',1]);

// ── FAIRWAY FAR (>200 yds) ─────────────────────────────────
const T_FAR_OPEN_E  = ()=>cells(['fwy',30],['rgh',6]);
const T_FAR_OPEN_M  = ()=>cells(['fwy',24],['rgh',12]);
const T_FAR_OPEN_H  = ()=>cells(['fwy',20],['rgh',16]);

// tight (doglegs/cathedral) — narrower corridor
const T_FAR_TGHT_E  = ()=>cells(['fwy',26],['rgh',10]);
const T_FAR_TGHT_M  = ()=>cells(['fwy',22],['rgh',12],['sand',2]);
const T_FAR_TGHT_H  = ()=>cells(['fwy',18],['rgh',16],['sand',2]);

// bunkerFwy — sand in the fairway landing corridor
const T_FAR_BFWY_E  = ()=>cells(['fwy',26],['rgh',6],['sand',4]);
const T_FAR_BFWY_M  = ()=>cells(['fwy',22],['rgh',8],['sand',6]);
const T_FAR_BFWY_H  = ()=>cells(['fwy',18],['rgh',10],['sand',8]);

// waterCross — water hazard to carry in the fairway
const T_FAR_WCRS_E  = ()=>cells(['fwy',28],['rgh',6],['h2o',2]);
const T_FAR_WCRS_M  = ()=>cells(['fwy',23],['rgh',8],['h2o',4],['sand',1]);
const T_FAR_WCRS_H  = ()=>cells(['fwy',18],['rgh',10],['h2o',6],['sand',2]);

// coastal fairway — ocean/OB pressure with narrow safe lanes
const T_FAR_COAST_E = ()=>cells(['fwy',22],['rgh',6],['h2o',4],['ob',2],['sand',2]);
const T_FAR_COAST_M = ()=>cells(['fwy',18],['rgh',7],['h2o',6],['ob',2],['sand',3]);
const T_FAR_COAST_H = ()=>cells(['fwy',14],['rgh',8],['h2o',8],['ob',3],['sand',3]);

// desert fairway — sand and rough dominate misses
const T_FAR_DSRT_E  = ()=>cells(['fwy',22],['rgh',8],['sand',6]);
const T_FAR_DSRT_M  = ()=>cells(['fwy',18],['rgh',9],['sand',9]);
const T_FAR_DSRT_H  = ()=>cells(['fwy',14],['rgh',10],['sand',12]);

// ── APPROACH (80-200 yds from green) ──────────────────────
const T_APP_OPEN_E  = ()=>cells(['grn',32],['chip',2],['rgh',2]);
const T_APP_OPEN_M  = ()=>cells(['grn',27],['chip',3],['rgh',4],['sand',2]);
const T_APP_OPEN_H  = ()=>cells(['grn',23],['chip',4],['rgh',6],['sand',3]);

const T_APP_DOG_E   = ()=>cells(['grn',30],['chip',2],['rgh',4]);
const T_APP_DOG_M   = ()=>cells(['grn',25],['chip',3],['rgh',6],['sand',2]);
const T_APP_DOG_H   = ()=>cells(['grn',20],['chip',4],['rgh',8],['sand',4]);

const T_APP_BFWY_E  = ()=>cells(['grn',30],['chip',2],['sand',2],['rgh',2]);
const T_APP_BFWY_M  = ()=>cells(['grn',26],['chip',3],['sand',4],['rgh',3]);
const T_APP_BFWY_H  = ()=>cells(['grn',22],['chip',4],['sand',6],['rgh',4]);

const T_APP_BGRN_E  = ()=>cells(['grn',29],['chip',2],['sand',5]);
const T_APP_BGRN_M  = ()=>cells(['grn',26],['chip',3],['sand',7],);
const T_APP_BGRN_H  = ()=>cells(['grn',22],['chip',4],['sand',10]);

// waterCross approach — past the water, green is clear
const T_APP_WCRS_E  = ()=>cells(['grn',33],['chip',2],['rgh',1]);
const T_APP_WCRS_M  = ()=>cells(['grn',29],['chip',3],['rgh',2],['sand',2]);
const T_APP_WCRS_H  = ()=>cells(['grn',25],['chip',4],['rgh',3],['sand',4]);

// waterApproach — water guards the green on this side
const T_APP_WAPR_E  = ()=>cells(['grn',32],['chip',2],['h2o',2]);
const T_APP_WAPR_M  = ()=>cells(['grn',27],['chip',3],['h2o',4],['sand',2]);
const T_APP_WAPR_H  = ()=>cells(['grn',22],['chip',4],['h2o',6],['sand',4]);

// coastal approach — ocean edge and bunker pressure near the green
const T_APP_COAST_E = ()=>cells(['grn',24],['chip',3],['h2o',5],['sand',4]);
const T_APP_COAST_M = ()=>cells(['grn',20],['chip',4],['h2o',6],['sand',6]);
const T_APP_COAST_H = ()=>cells(['grn',16],['chip',5],['h2o',8],['sand',7]);

// desert approach — fewer water penalties, more sand and rough
const T_APP_DSRT_E  = ()=>cells(['grn',24],['chip',3],['rgh',4],['sand',5]);
const T_APP_DSRT_M  = ()=>cells(['grn',20],['chip',4],['rgh',5],['sand',7]);
const T_APP_DSRT_H  = ()=>cells(['grn',16],['chip',5],['rgh',6],['sand',9]);

const T_APP_CATH_E  = ()=>cells(['grn',28],['chip',2],['rgh',4],['sand',2]);
const T_APP_CATH_M  = ()=>cells(['grn',23],['chip',3],['rgh',6],['sand',4]);
const T_APP_CATH_H  = ()=>cells(['grn',18],['chip',4],['rgh',8],['sand',6]);

// Pacific tee — course-specific hard-mode tuning without changing shared templates
const T_PAC_TEE_OPEN_SOFT_E = ()=>cells(['fwy',31],['rgh',4],['sand',1]);
const T_PAC_TEE_OPEN_SOFT_M = ()=>cells(['fwy',29],['rgh',5],['sand',2]);
const T_PAC_TEE_OPEN_SOFT_H = ()=>cells(['fwy',27],['rgh',6],['sand',3]);
const T_PAC_TEE_H2_E        = ()=>cells(['fwy',28],['rgh',6],['sand',2]);
const T_PAC_TEE_H2_M        = ()=>cells(['fwy',25],['rgh',8],['sand',3]);
const T_PAC_TEE_H2_H        = ()=>cells(['fwy',22],['rgh',10],['sand',4]);
const T_PAC_TEE_H4_E        = ()=>cells(['fwy',30],['rgh',4],['sand',2]);
const T_PAC_TEE_H4_M        = ()=>cells(['fwy',28],['rgh',5],['sand',3]);
const T_PAC_TEE_H4_H        = ()=>cells(['fwy',26],['rgh',6],['sand',4]);
const T_PAC_TEE_H6_E        = ()=>cells(['fwy',34],['rgh',2]);
const T_PAC_TEE_H6_M        = ()=>cells(['fwy',32],['rgh',3],['sand',1]);
const T_PAC_TEE_H6_H        = ()=>cells(['fwy',30],['rgh',4],['sand',2]);
const T_PAC_TEE_H8_E        = ()=>cells(['fwy',34],['rgh',2]);
const T_PAC_TEE_H8_M        = ()=>cells(['fwy',32],['rgh',4]);
const T_PAC_TEE_H8_H        = ()=>cells(['fwy',30],['rgh',6]);
const T_PAC_TEE_OPEN_EASY   = ()=>T_TEE_OPEN_E();
const T_PAC_TEE_BFWY_MED   = ()=>T_TEE_BFWY_M();

// Pacific first fairway — only the first grid after a tee-shot fairway landing
const T_PAC_FIRST_H2_E      = ()=>cells(['grn',24],['rgh',6],['sand',2],['chip',4]);
const T_PAC_FIRST_H2_M      = ()=>cells(['grn',21],['rgh',8],['sand',3],['chip',4]);
const T_PAC_FIRST_H2_H      = ()=>cells(['grn',18],['rgh',10],['sand',4],['chip',4]);
const T_PAC_FIRST_NOFWY_E   = ()=>cells(['grn',24],['chip',5],['sand',3],['rgh',4]);
const T_PAC_FIRST_NOFWY_M   = ()=>cells(['grn',21],['chip',5],['sand',5],['rgh',5]);
const T_PAC_FIRST_NOFWY_H   = ()=>cells(['grn',18],['chip',6],['sand',6],['rgh',6]);
const T_PAC_FIRST_H8_E      = ()=>cells(['grn',26],['rgh',3],['chip',2],['h2o',1],['sand',2],['fwy',2]);
const T_PAC_FIRST_H8_M      = ()=>cells(['grn',23],['rgh',4],['chip',3],['h2o',1],['sand',3],['fwy',2]);
const T_PAC_FIRST_H8_H      = ()=>cells(['grn',20],['rgh',6],['chip',3],['h2o',1],['sand',4],['fwy',2]);

// Pacific coastal fairway — ocean pressure without OB for the closing hole
const T_PAC_FAR_COAST_E     = ()=>cells(['fwy',20],['rgh',4],['h2o',2],['sand',4],['grn',6]);
const T_PAC_FAR_COAST_M     = ()=>cells(['fwy',18],['rgh',5],['h2o',3],['sand',5],['grn',5]);
const T_PAC_FAR_COAST_H     = ()=>cells(['fwy',16],['rgh',6],['h2o',4],['sand',6],['grn',4]);

// ── ROUGH ──────────────────────────────────────────────────
const T_RGH_FAR_E   = ()=>cells(['fwy',28],['rgh',8]);
const T_RGH_FAR_M   = ()=>cells(['fwy',24],['rgh',12]);
const T_RGH_FAR_H   = ()=>cells(['fwy',22],['rgh',14]);

const T_RGH_MID_E   = ()=>cells(['grn',24],['chip',4],['rgh',6],['sand',2]);
const T_RGH_MID_M   = ()=>cells(['grn',20],['chip',5],['rgh',8],['sand',3]);
const T_RGH_MID_H   = ()=>cells(['grn',16],['chip',6],['rgh',10],['sand',4]);

// Rough near pin: NO chip cells — breaks chip→rgh-short→chip loop
const T_RGH_SHORT_E = ()=>cells(['grn',32],['sand',4]);
const T_RGH_SHORT_M = ()=>cells(['grn',30],['sand',6]);
const T_RGH_SHORT_H = ()=>cells(['grn',28],['sand',8]);

// ── CHIP SHOT — green + hole only; NO chip/rgh/fwy/snd ───────────────────
const T_CHIP_E      = ()=>cells(['grn',33],['hole',3]);
const T_CHIP_M      = ()=>cells(['grn',32],['hole',2],['sand',2]);
const T_CHIP_H      = ()=>cells(['grn',32],['hole',1],['sand',3]);

// ── SAND ESCAPE (near green ≤80m) — green+chip+hole; NO rgh/h2o/ob ────────────────
const T_SAND_E      = ()=>cells(['grn',32],['chip',3],['hole',1]);
const T_SAND_M      = ()=>cells(['grn',30],['chip',4],['hole',1],['sand',1]);
const T_SAND_H      = ()=>cells(['grn',27],['chip',5],['hole',1],['sand',3]);
// ── SAND ESCAPE (far bunker >87yds) — fwy exit only; NO rgh/h2o/ob ─────────────────
const T_SAND_FAR_E  = ()=>cells(['fwy',33],['rgh',3]);
const T_SAND_FAR_M  = ()=>cells(['fwy',32],['rgh',3],['sand',1]);
const T_SAND_FAR_H  = ()=>cells(['fwy',31],['rgh',4],['sand',1]);

// ── PUTTING — per hole star × game difficulty ──────────────
// Easy game: no 3-putts ever, 1-putts dominate
// Normal: 3-putts only on hard holes (≤3 cells)
// Hard: 3-putts available, proportional to hole difficulty
const T_PUTT_1E = ()=>cells(['p1',34],['p2',2]);           // ★ hole, easy game
const T_PUTT_1N = ()=>cells(['p1',30],['p2',6]);           // ★ hole, normal
const T_PUTT_1H = ()=>cells(['p1',26],['p2',9],['p3',1]);// ★ hole, hard
const T_PUTT_2E = ()=>cells(['p1',30],['p2',6]);           // ★★ hole, easy
const T_PUTT_2N = ()=>cells(['p1',26],['p2',8],['p3',2]);// ★★ hole, normal 
const T_PUTT_2H = ()=>cells(['p1',20],['p2',13],['p3',3]);// ★★ hole, hard
const T_PUTT_3E = ()=>cells(['p1',26],['p2',10]);          // ★★★ hole, easy 
const T_PUTT_3N = ()=>cells(['p1',20],['p2',13],['p3',3]);// ★★★ hole, normal 
const T_PUTT_3H = ()=>cells(['p1',16], ['p2',14],['p3',6]);// ★★★ hole, hard

// ═══════════════════════════════════════
// COURSES & HOLES
// ═══════════════════════════════════════
const DEFAULT_COURSE_ID='little-pines';
const COURSE_ORDER=['little-pines','pacific-beach','desert-golf-links','septembra-national'];
const COURSES={
  'little-pines':{
    id:'little-pines', name:'LITTLE PINES', shortName:'LITTLE PINES',
    holes:[
      // layout: open|doglegs|bunkerFwy|bunkerGreen|waterCross|waterApproach|cathedral
      {name:'HOLE 1', yards:387,par:4,baseDiff:1,diff:1,layout:'open'},          // Wide opener, gentle introduction
      {name:'HOLE 2', yards:512,par:5,baseDiff:3,diff:3,layout:'waterApproach'}, // Water guards the green on this long par 5
      {name:'HOLE 3', yards:178,par:3,baseDiff:1,diff:1,layout:'open'},          // Short open par 3, birdie opportunity
      {name:'HOLE 4', yards:432,par:4,baseDiff:2,diff:2,layout:'bunkerFwy'},     // Fairway bunker at 200 yds forces decision
      {name:'HOLE 5', yards:603,par:5,baseDiff:2,diff:2,layout:'waterCross'},    // Must carry water in the fairway corridor
      {name:'HOLE 6', yards:405,par:4,baseDiff:2,diff:2,layout:'doglegs'},       // Dogleg right, OB punishes big drives
      {name:'HOLE 7', yards:195,par:3,baseDiff:2,diff:2,layout:'bunkerGreen'},   // Bunkers wrap the green on all sides
      {name:'HOLE 8', yards:545,par:5,baseDiff:2,diff:2,layout:'waterApproach'}, // Long par 5, water right of the green
      {name:'HOLE 9', yards:418,par:4,baseDiff:2,diff:2,layout:'cathedral'},     // Tree-lined finish to the front 9
      {name:'HOLE 10',yards:380,par:4,baseDiff:1,diff:1,layout:'open'},          // Gentle re-entry after the turn
      {name:'HOLE 11',yards:410,par:4,baseDiff:2,diff:2,layout:'doglegs'},       // Dogleg left, OB left side
      {name:'HOLE 12',yards:175,par:3,baseDiff:2,diff:2,layout:'waterCross'},    // Full carry over water — no bail out
      {name:'HOLE 13',yards:520,par:5,baseDiff:2,diff:2,layout:'bunkerFwy'},     // Two fairway bunkers test placement
      {name:'HOLE 14',yards:430,par:4,baseDiff:2,diff:3,layout:'cathedral'},     // Tightest hole on the course
      {name:'HOLE 15',yards:395,par:4,baseDiff:2,diff:2,layout:'bunkerGreen'},   // Greenside bunkers make the approach hard
      {name:'HOLE 16',yards:155,par:3,baseDiff:1,diff:1,layout:'open'},          // Shortest hole, easy scoring opportunity
      {name:'HOLE 17',yards:405,par:4,baseDiff:2,diff:2,layout:'waterApproach'}, // Water right of green, risk/reward approach
      {name:'HOLE 18',yards:460,par:4,baseDiff:3,diff:3,layout:'waterCross'},    // Dramatic finale, carry water off the tee
    ]
  },
  'pacific-beach':{
    id:'pacific-beach', name:'PACIFIC BEACH', shortName:'PACIFIC BEACH',
    holes:[
      {name:'HOLE 1', yards:378,par:4,baseDiff:1,diff:1,layout:'open',teeLayout:'pacOpenSoft'},
      {name:'HOLE 2', yards:509,par:5,baseDiff:2,diff:2,layout:'open',teeLayout:'pacHole2',firstFwyLayout:'pacHole2'},
      {name:'HOLE 3', yards:397,par:4,baseDiff:2,diff:2,layout:'bunkerFwy',firstFwyLayout:'pacNoFairway'},
      {name:'HOLE 4', yards:333,par:4,baseDiff:2,diff:2,layout:'bunkerGreen',teeLayout:'pacHole4',appLayout:'bunkerGreen'},
      {name:'HOLE 5', yards:189,par:3,baseDiff:2,diff:1,layout:'open',par3Layout:'open'},
      {name:'HOLE 6', yards:498,par:5,baseDiff:2,diff:1,layout:'open',teeLayout:'pacHole6',farLayout:'bunkerFwy',appLayout:'bunkerFwy'},
      {name:'HOLE 7', yards:107,par:3,baseDiff:2,diff:1,layout:'open'},
      {name:'HOLE 8', yards:416,par:4,baseDiff:3,diff:3,layout:'open',teeLayout:'pacHole8',firstFwyLayout:'pacHole8'},
      {name:'HOLE 9', yards:483,par:4,baseDiff:2,diff:2,layout:'bunkerFwy',firstFwyLayout:'bunkerFwy',farLayout:'bunkerFwy'},
      {name:'HOLE 10',yards:444,par:4,baseDiff:3,diff:3,layout:'bunkerFwy',teeLayout:'pacHole4',appLayout:'bunkerGreen'},
      {name:'HOLE 11',yards:370,par:4,baseDiff:1,diff:1,layout:'open',teeLayout:'pacOpenEasy',appLayout:'bunkerGreen'},
      {name:'HOLE 12',yards:202,par:3,baseDiff:3,diff:3,layout:'bunkerGreen',par3Layout:'bunkerGreen'},
      {name:'HOLE 13',yards:401,par:4,baseDiff:3,diff:2,layout:'bunkerFwy',teeLayout:'bunkerFwy',appLayout:'bunkerGreen'},
      {name:'HOLE 14',yards:559,par:5,baseDiff:2,diff:1,layout:'bunkerFwy',teeLayout:'bunkerFwy',firstFwyLayout:'bunkerFwy',farLayout:'bunkerFwy'},
      {name:'HOLE 15',yards:393,par:4,baseDiff:2,diff:2,layout:'bunkerGreen',teeLayout:'pacBfwyMed'},
      {name:'HOLE 16',yards:400,par:4,baseDiff:2,diff:2,layout:'bunkerFwy',teeLayout:'bunkerFwy',appLayout:'doglegs'},
      {name:'HOLE 17',yards:182,par:3,baseDiff:3,diff:3,layout:'bunkerGreen',par3Layout:'bunkerGreen'},
      {name:'HOLE 18',yards:541,par:5,baseDiff:3,diff:3,layout:'bunkerFwy',teeLayout:'bunkerFwy',firstFwyLayout:'bunkerFwy',farLayout:'coastalPacific',appLayout:'bunkerGreen'},
    ]
  },
  'desert-golf-links':{
    id:'desert-golf-links', name:'DESERT GOLF LINKS', shortName:'DESERT LINKS',
    holes:[
      {name:'HOLE 1', yards:403,par:4,baseDiff:1,diff:1,layout:'desertWash'},
      {name:'HOLE 2', yards:442,par:4,baseDiff:2,diff:2,layout:'desertWash'},
      {name:'HOLE 3', yards:558,par:5,baseDiff:2,diff:2,layout:'desertWash'},
      {name:'HOLE 4', yards:183,par:3,baseDiff:2,diff:2,layout:'bunkerGreen'},
      {name:'HOLE 5', yards:470,par:4,baseDiff:2,diff:2,layout:'desertWash'},
      {name:'HOLE 6', yards:432,par:4,baseDiff:2,diff:2,layout:'desertWash'},
      {name:'HOLE 7', yards:215,par:3,baseDiff:3,diff:3,layout:'bunkerGreen'},
      {name:'HOLE 8', yards:475,par:4,baseDiff:3,diff:3,layout:'desertWash'},
      {name:'HOLE 9', yards:453,par:4,baseDiff:3,diff:3,layout:'desertWash'},
      {name:'HOLE 10',yards:428,par:4,baseDiff:1,diff:1,layout:'desertWash'},
      {name:'HOLE 11',yards:472,par:4,baseDiff:3,diff:3,layout:'waterApproach'},
      {name:'HOLE 12',yards:192,par:3,baseDiff:3,diff:3,layout:'waterCross'},
      {name:'HOLE 13',yards:558,par:5,baseDiff:2,diff:2,layout:'waterApproach'},
      {name:'HOLE 14',yards:490,par:4,baseDiff:3,diff:3,layout:'desertWash'},
      {name:'HOLE 15',yards:553,par:5,baseDiff:3,diff:3,layout:'waterCross'},
      {name:'HOLE 16',yards:163,par:3,baseDiff:2,diff:2,layout:'bunkerGreen',par3Layout:'stadium'},
      {name:'HOLE 17',yards:332,par:4,baseDiff:2,diff:2,layout:'waterCross'},
      {name:'HOLE 18',yards:442,par:4,baseDiff:3,diff:3,layout:'waterApproach'},
    ]
  },
  'septembra-national':{
    id:'septembra-national', name:'SEPTEMBRA NATIONAL', shortName:'SEPTEMBRA',
    holes:[
      {name:'HOLE 1', yards:445,par:4,baseDiff:2,diff:2,layout:'cathedral'},
      {name:'HOLE 2', yards:585,par:5,baseDiff:2,diff:2,layout:'doglegs'},
      {name:'HOLE 3', yards:350,par:4,baseDiff:1,diff:1,layout:'bunkerFwy'},
      {name:'HOLE 4', yards:240,par:3,baseDiff:3,diff:3,layout:'bunkerGreen'},
      {name:'HOLE 5', yards:495,par:4,baseDiff:3,diff:3,layout:'cathedral'},
      {name:'HOLE 6', yards:180,par:3,baseDiff:2,diff:2,layout:'open'},
      {name:'HOLE 7', yards:450,par:4,baseDiff:2,diff:2,layout:'cathedral'},
      {name:'HOLE 8', yards:570,par:5,baseDiff:2,diff:2,layout:'doglegs'},
      {name:'HOLE 9', yards:460,par:4,baseDiff:2,diff:2,layout:'doglegs'},
      {name:'HOLE 10',yards:495,par:4,baseDiff:3,diff:3,layout:'cathedral'},
      {name:'HOLE 11',yards:520,par:4,baseDiff:3,diff:3,layout:'waterApproach',teeLayout:'cathedral',farLayout:'cathedral'},
      {name:'HOLE 12',yards:155,par:3,baseDiff:3,diff:3,layout:'waterTee',par3Layout:'waterTee'},
      {name:'HOLE 13',yards:545,par:5,baseDiff:3,diff:3,layout:'doglegs',appLayout:'waterApproach'},
      {name:'HOLE 14',yards:440,par:4,baseDiff:2,diff:2,layout:'bunkerGreen'},
      {name:'HOLE 15',yards:550,par:5,baseDiff:3,diff:3,layout:'doglegs',appLayout:'waterApproach'},
      {name:'HOLE 16',yards:170,par:3,baseDiff:3,diff:3,layout:'waterTee',par3Layout:'waterTee'},
      {name:'HOLE 17',yards:440,par:4,baseDiff:2,diff:2,layout:'cathedral'},
      {name:'HOLE 18',yards:465,par:4,baseDiff:3,diff:3,layout:'cathedral'},
    ]
  }
};

function normalizeCourseId(courseId){
  return COURSE_ORDER.includes(courseId) ? courseId : DEFAULT_COURSE_ID;
}
function getCourseConfig(courseId){
  return COURSES[normalizeCourseId(courseId)];
}
function getCourseHoles(courseId){
  return getCourseConfig(courseId).holes;
}
function getCourseName(courseId){
  return getCourseConfig(courseId).name;
}

const HOLES=[];
let BASE_HOLES=[];
let ACTIVE_COURSE_ID=DEFAULT_COURSE_ID;
let _gameBrandTimer = null;
let _gameBrandShowCourse = false;
function applyCourse(courseId){
  const cfg=getCourseConfig(courseId);
  ACTIVE_COURSE_ID=cfg.id;
  BASE_HOLES=cfg.holes.map(h=>({...h}));
  HOLES.length=0;
  BASE_HOLES.forEach(h=>HOLES.push({...h}));
  return cfg;
}
applyCourse(DEFAULT_COURSE_ID);
function clearGameBrandRotator(){
  if(_gameBrandTimer){
    clearInterval(_gameBrandTimer);
    _gameBrandTimer = null;
  }
}
function refreshGameBrand(courseId){
  const brand = document.getElementById('gameBrand');
  const courseText = document.getElementById('gameBrandCourse');
  if(!brand || !courseText) return;
  const cfg = getCourseConfig(courseId || ACTIVE_COURSE_ID);
  courseText.textContent = cfg.name;
  courseText.title = cfg.name;
}
function startGameBrandRotator(){
  const brand = document.getElementById('gameBrand');
  if(!brand) return;
  clearGameBrandRotator();
  _gameBrandShowCourse = false;
  brand.classList.remove('show-course');
  _gameBrandTimer = setInterval(()=>{
    _gameBrandShowCourse = !_gameBrandShowCourse;
    brand.classList.toggle('show-course', _gameBrandShowCourse);
  }, 3600);
}
function applyCourseVisualTheme(courseId){
  const resolved = normalizeCourseId(courseId || ACTIVE_COURSE_ID);
  const body = document.body;
  const root = document.documentElement;
  const themeColorMap = {
    'little-pines':'#102116',
    'pacific-beach':'#0e1c2f',
    'desert-golf-links':'#3f2710',
    'septembra-national':'#162319'
  };
  const currentTheme = body ? body.getAttribute('data-course-theme') : null;
  if(body) body.setAttribute('data-course-theme', resolved);
  if(root) root.setAttribute('data-course-theme', resolved);
  if(root) root.style.background = themeColorMap[resolved] || '#0d1117';
  const themeMeta = document.querySelector("meta[name='theme-color']");
  if(themeMeta) themeMeta.setAttribute('content', themeColorMap[resolved] || '#0d1117');
  refreshGameBrand(resolved);
  if(currentTheme !== resolved || !_gameBrandTimer){
    startGameBrandRotator();
  }
}
function clearCourseVisualTheme(){
  const body = document.body;
  const root = document.documentElement;
  if(body) body.removeAttribute('data-course-theme');
  if(root) root.removeAttribute('data-course-theme');
  if(root) root.style.background = '#0d1117';
  const themeMeta = document.querySelector("meta[name='theme-color']");
  if(themeMeta) themeMeta.setAttribute('content', '#0d1117');
  clearGameBrandRotator();
  const brand = document.getElementById('gameBrand');
  if(brand) brand.classList.remove('show-course');
}
function restoreBaseHoles(){
  HOLES.length=BASE_HOLES.length;
  BASE_HOLES.forEach((h,i)=>{ HOLES[i]={...h}; });
}
