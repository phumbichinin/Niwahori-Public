/* Ver.0.2 balance. Times are seconds; distances are tiles/meters. */
window.DIG_CONFIG = {
  saveKey: 'niwahori-v01', // Keep the original key: v1 data is migrated in place.
  version: 2, columns: 15, tile: 40, chunkRows: 24,
  maxEnergy: 100, hitInterval: 0.36, impactTime: 0.13, swingTime: 0.30,
  walkInterval: 0.16, moveEnergy: 0.10, descentEnergy: 0.025,
  descentHold: 0.22, descentSeconds: 1.1, descentMinSpeed: 12,
  returnSeconds: 1.4, returnBase: 2, returnPerMeter: 1.1,
  stairDiscount: 0.5, ropeDiscount: 0.38, ladderDiscount: 0.16,
  rescueFee: 5, chainChance: 0.10, chainDelay: 0.085,
  bonus: {x: 7, y: 4},
  jet: {maxFuel: 60, fuelPerMeter: 6, flyInterval: 0.15,
    boostFuel: 30, boostDistance: 8, boostSeconds: 0.32},
  materials: {
    dirt: {name:'つち',hp:1,cost:0.55,color:'#a7794b',particle:'#d5aa74'},
    hard: {name:'かたい つち',hp:2,cost:0.85,color:'#906344',particle:'#bc9167'},
    rock: {name:'いわ',hp:5,cost:1.15,color:'#78817a',particle:'#b3bbb2'},
    iron: {name:'てつ',hp:4,cost:1,color:'#7b8073',particle:'#b9ced0',value:8},
    gold: {name:'きん',hp:5,cost:1.2,color:'#857954',particle:'#efc65c',value:24},
    gem: {name:'ほうせき',hp:6,cost:1.35,color:'#637f79',particle:'#84e1c0',value:65}
  },
  shop: [
    {id:'pick',icon:'⛏',name:'ツルハシ',desc:'いわを ２かいで！',price:28},
    {id:'shovelPlus',icon:'♠',name:'つよい シャベル',desc:'たいりょく ながもち',price:45},
    {id:'rope',icon:'〰',name:'なわ',desc:'うえに のぼれる',price:16},
    {id:'ladder',icon:'▤',name:'はしご',desc:'もっと らくらく のぼれる',price:38},
    {id:'house',icon:'⌂',name:'おうちを ひろく',desc:'おける かず ３ → ６',price:90}
  ],
  // Scene objects, rather than fixed click coordinates: ready for more furniture.
  furniture: [
    {id:'journal',x:.15,y:.36,label:'セーブ',icon:'📖'},
    {id:'shelf',x:.43,y:.36,label:'どうぐ',icon:'⛏'},
    {id:'shop',x:.76,y:.36,label:'かう',icon:'🛒'},
    {id:'bed',x:.17,y:.75,label:'ねる',icon:'☾'},
    {id:'sell',x:.51,y:.75,label:'うる',icon:'💎'},
    {id:'door',x:.85,y:.75,label:'にわへ',icon:'🚪'}
  ],
  distribution(depth) {return {hard:Math.min(.25,.07+depth*.003),rock:Math.min(.30,.04+depth*.004),iron:depth<2?0:.10,gold:depth<10?0:.045,gem:depth<22?0:.018};}
};
