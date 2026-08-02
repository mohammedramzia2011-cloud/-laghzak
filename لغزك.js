const OWNER_EMAIL = "mohammedabudayya2011@gmail.com";
let screenHistory = ['home'], allUsers = [], dbWorlds = [], dbLevels = [], dbShopItems = [], dbCodes = [];

// Player State Enhanced with Avatars & Frames
let defaultPlayer = {
  uid: '', email: '', name: 'زائر', 
  currentLevel: 1, shards: 0, gems: 0,
  titles: ['مستكشف الألغاز'], equippedTitle: 'مستكشف الألغاز',
  avatars: ['https://api.dicebear.com/7.x/bottts/svg?seed=Lghzak'], equippedAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Lghzak',
  frames: ['بدون إطار'], equippedFrame: 'بدون إطار',
  banners: ['بدون بنر'], equippedBanner: 'بدون بنر',
  lastDaily: '', isOwner: false
};
let player = JSON.parse(JSON.stringify(defaultPlayer));
let currentLevelObj = null, currentSlots = [], availableLetters = [];

function isOwner() { return player.email === OWNER_EMAIL; }
function getDisplayGems() { return isOwner() ? "∞" : player.gems; }
function getDisplayShards() { return isOwner() ? "∞" : player.shards; }

const frameClassesMap = { 'بدون إطار': '', 'ذهبي': 'frame-gold', 'ناري': 'frame-fire', 'نيون': 'frame-neon', 'أسطوري': 'frame-mythic' };
function getFrameClass(frameName) { return frameClassesMap[frameName] || ''; }

// Navigation & UI
function navigateTo(screenId) {
  document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
  document.getElementById(`screen-${screenId}`).classList.remove('hidden');
  if (screenHistory[screenHistory.length - 1] !== screenId && screenId !== 'splash') screenHistory.push(screenId);
  updateNavStyles(screenId);
  if(screenId === 'worlds') renderWorldsGrid();
  if(screenId === 'leaderboard') renderLeaderboard();
  if(screenId === 'admin') populateAdminDropdowns();
  if(screenId === 'shop') renderShopItems();
  if(screenId === 'profile') { calculateProfileRank(); updateUI(); }
  if(screenId === 'home') checkDailyReward();
}

function goBack() {
  if (screenHistory.length > 1) { screenHistory.pop(); navigateTo(screenHistory.pop()); } 
  else { navigateTo('home'); }
}

function updateNavStyles(activeScreen) {
  document.querySelectorAll('#bottom-nav button').forEach(btn => { btn.classList.remove('text-brand-500'); btn.classList.add('text-gray-400'); });
  const activeBtn = document.getElementById(`nav-${activeScreen}`);
  if (activeBtn) { activeBtn.classList.remove('text-gray-400'); activeBtn.classList.add('text-brand-500'); }
  if (['splash', 'game', 'admin', 'public-profile'].includes(activeScreen)) { document.getElementById('bottom-nav').classList.add('hidden'); document.getElementById('top-bar').classList.add('hidden'); } 
  else { document.getElementById('bottom-nav').classList.remove('hidden'); document.getElementById('top-bar').classList.remove('hidden'); }
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function openAuthModal() { openModal('modal-auth'); }
function openRedeemModal() { openModal('modal-redeem'); }

function showToast(msg, icon = '✨', type = 'info') {
  const toast = document.getElementById('toast-msg');
  document.getElementById('toast-text').innerText = msg; document.getElementById('toast-icon').innerText = icon;
  toast.className = 'bg-gray-900/95 text-white border px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 transform transition-all duration-300 pointer-events-auto z-[100]';
  if(type === 'error') toast.classList.add('border-red-500'); else if(type === 'success') toast.classList.add('border-green-500'); else toast.classList.add('border-brand-500');
  toast.classList.remove('-translate-y-10', 'opacity-0');
  setTimeout(() => { toast.classList.add('-translate-y-10', 'opacity-0'); }, 3000);
}

// Audio SFX
let audioCtx = null;
function playSFX(type) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    if (type === 'click') { osc.type = 'sine'; osc.frequency.setValueAtTime(400, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05); gain.gain.setValueAtTime(0.1, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1); osc.start(); osc.stop(audioCtx.currentTime + 0.1); } 
    else if (type === 'win') { osc.type = 'triangle'; osc.frequency.setValueAtTime(400, audioCtx.currentTime); osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1); osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2); gain.gain.setValueAtTime(0.2, audioCtx.currentTime); gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5); osc.start(); osc.stop(audioCtx.currentTime + 0.5); }
  } catch (e) {}
}

// Auth & Init
window.onload = () => { setTimeout(() => { if(!window.currentUserId) navigateTo('home'); }, 1500); }
window.resetPlayerData = () => { player = JSON.parse(JSON.stringify(defaultPlayer)); updateUI(); };
window.loadPlayerData = async (user) => {
  try {
    const userRef = window.doc(window.firebaseDb, window.DB_PATH + 'users', user.uid);
    const snap = await window.getDoc(userRef);
    if (snap.exists()) { 
       player = { ...defaultPlayer, ...snap.data(), uid: user.uid, email: user.email || '' };
       if(!player.avatars) player.avatars = ['https://api.dicebear.com/7.x/bottts/svg?seed=Lghzak'];
       if(!player.equippedAvatar) player.equippedAvatar = 'https://api.dicebear.com/7.x/bottts/svg?seed=Lghzak';
       if(!player.frames) player.frames = ['بدون إطار'];
       if(!player.equippedFrame) player.equippedFrame = 'بدون إطار';
       if(!player.banners) player.banners = ['بدون بنر'];
       if(!player.equippedBanner) player.equippedBanner = 'بدون بنر';
    } else {
       player = { ...defaultPlayer, uid: user.uid, email: user.email || '', name: 'لاعب_' + Math.floor(Math.random()*9999) };
       await window.setDoc(userRef, player);
    }
    player.isOwner = (user.email === OWNER_EMAIL);
    updateUI(); if(screenHistory[screenHistory.length-1] === 'splash') navigateTo('home');
  } catch (error) { showToast("خطأ في جلب البيانات", "❌", "error"); }
};

window.setupRealtimeListeners = () => {
  window.onSnapshot(window.collection(window.firebaseDb, window.DB_PATH + 'worlds'), (snap) => {
    dbWorlds = snap.docs.map(d => d.data()).sort((a,b)=>a.start - b.start);
    document.getElementById('home-worlds-count').innerText = `${dbWorlds.length} عوالم ساحرة`;
    document.getElementById('worlds-total-badge').innerText = `${dbWorlds.length} عالم`;
    if(screenHistory[screenHistory.length-1] === 'worlds') renderWorldsGrid();
    populateAdminDropdowns();
  });
  window.onSnapshot(window.collection(window.firebaseDb, window.DB_PATH + 'levels'), (snap) => {
    dbLevels = snap.docs.map(d => d.data()).sort((a,b)=>a.num - b.num);
  });
  window.onSnapshot(window.collection(window.firebaseDb, window.DB_PATH + 'shop'), (snap) => {
    dbShopItems = snap.docs.map(d => d.data());
    if(screenHistory[screenHistory.length-1] === 'shop') renderShopItems();
  });
  window.onSnapshot(window.collection(window.firebaseDb, window.DB_PATH + 'codes'), (snap) => {
    dbCodes = snap.docs.map(d => d.data());
    if(screenHistory[screenHistory.length-1] === 'admin') renderAdminCodes();
  });
  window.onSnapshot(window.collection(window.firebaseDb, window.DB_PATH + 'users'), (snap) => {
    allUsers = snap.docs.map(d => d.data());
    if(screenHistory[screenHistory.length-1] === 'leaderboard') renderLeaderboard();
    if(screenHistory[screenHistory.length-1] === 'profile') calculateProfileRank();
  });
  if (player.uid) {
     window.onSnapshot(window.doc(window.firebaseDb, window.DB_PATH + 'users', player.uid), (docSnap) => {
        if(docSnap.exists()){
           const data = docSnap.data(); player.shards = data.shards; player.gems = data.gems; player.currentLevel = data.currentLevel; player.name = data.name; 
           player.titles = data.titles || ['مستكشف الألغاز']; player.equippedTitle = data.equippedTitle || 'مستكشف الألغاز';
           player.avatars = data.avatars || ['https://api.dicebear.com/7.x/bottts/svg?seed=Lghzak']; player.equippedAvatar = data.equippedAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Lghzak';
           player.frames = data.frames || ['بدون إطار']; player.equippedFrame = data.equippedFrame || 'بدون إطار';
           player.banners = data.banners || ['بدون بنر']; player.equippedBanner = data.equippedBanner || 'بدون بنر';
           player.lastDaily = data.lastDaily || '';
           updateUI();
        }
     });
  }
};

window.updateUIForAuth = () => {
  const container = document.getElementById('auth-buttons-container');
  const emailText = document.getElementById('profile-email-text');
  const adminBtn = document.getElementById('owner-admin-btn-container');
  if (window.currentUserId && player.email !== '') {
    emailText.innerText = player.email;
    container.innerHTML = `<button onclick="handleLogout()" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2"><i class="fa-solid fa-right-from-bracket"></i> تسجيل الخروج</button>`;
  } else {
    emailText.innerText = 'زائر';
    container.innerHTML = `<button onclick="openAuthModal()" class="w-full btn-3d-orange py-2 rounded-xl text-xs font-black">تسجيل الدخول لحفظ تقدمك</button>`;
  }
  if (isOwner()) { adminBtn.classList.remove('hidden'); document.getElementById('header-owner-badge').classList.remove('hidden'); }
  else { adminBtn.classList.add('hidden'); document.getElementById('header-owner-badge').classList.add('hidden'); }
};

function updateUI() {
  document.getElementById('currency-shards').innerText = getDisplayShards(); document.getElementById('currency-gems').innerText = getDisplayGems();
  document.getElementById('header-name').innerText = player.name; document.getElementById('header-title').innerText = player.equippedTitle;
  document.getElementById('header-avatar').src = player.equippedAvatar;
  document.getElementById('header-frame-wrap').className = `relative rounded-full ${getFrameClass(player.equippedFrame)}`;
  if(player.equippedFrame === 'أسطوري') document.getElementById('header-frame-wrap').classList.add('frame-mythic-wrap');

  document.getElementById('profile-name-text').innerText = player.name; document.getElementById('profile-stat-level').innerText = player.currentLevel;
  document.getElementById('profile-title-badge').innerText = player.equippedTitle; document.getElementById('profile-avatar-img').src = player.equippedAvatar;
  document.getElementById('profile-frame-wrap').className = `relative mb-3 group rounded-full ${getFrameClass(player.equippedFrame)}`;
  if(player.equippedFrame === 'أسطوري') document.getElementById('profile-frame-wrap').classList.add('frame-mythic-wrap');
  
  const profileCard = document.getElementById('profile-card-container');
  if(player.equippedBanner && player.equippedBanner !== 'بدون بنر') {
      profileCard.style.backgroundImage = `url('${player.equippedBanner}')`;
      profileCard.style.backgroundSize = 'cover';
      profileCard.style.backgroundPosition = 'center';
  } else {
      profileCard.style.backgroundImage = 'none';
  }
  
  const titleSelect = document.getElementById('equip-title-select'); titleSelect.innerHTML = '';
  player.titles.forEach(t => { titleSelect.innerHTML += `<option value="${t}" ${player.equippedTitle === t ? 'selected' : ''}>${t}</option>`; });
  
  const avatarSelect = document.getElementById('equip-avatar-select'); avatarSelect.innerHTML = '';
  player.avatars.forEach((a, i) => { avatarSelect.innerHTML += `<option value="${a}" ${player.equippedAvatar === a ? 'selected' : ''}>صورة ${i+1}</option>`; });

  const frameSelect = document.getElementById('equip-frame-select'); frameSelect.innerHTML = '';
  player.frames.forEach((f) => { frameSelect.innerHTML += `<option value="${f}" ${player.equippedFrame === f ? 'selected' : ''}>${f}</option>`; });
  
  const bannerSelect = document.getElementById('equip-banner-select'); bannerSelect.innerHTML = '';
  player.banners.forEach((b, i) => { bannerSelect.innerHTML += `<option value="${b}" ${player.equippedBanner === b ? 'selected' : ''}>${b === 'بدون بنر' ? 'بدون بنر' : 'بنر ' + i}</option>`; });

  checkDailyReward();
}

async function savePlayer() {
  if(!player.uid) return;
  try { await window.updateDoc(window.doc(window.firebaseDb, window.DB_PATH + 'users', player.uid), { name: player.name, currentLevel: player.currentLevel, shards: isOwner() ? 0 : player.shards, gems: isOwner() ? 0 : player.gems, equippedTitle: player.equippedTitle, titles: player.titles, avatars: player.avatars, equippedAvatar: player.equippedAvatar, frames: player.frames, equippedFrame: player.equippedFrame, banners: player.banners, equippedBanner: player.equippedBanner, lastDaily: player.lastDaily }); } catch(e) {}
}

// Login logic
async function handleEmailLogin() {
  const email = document.getElementById('auth-email-input').value, pass = document.getElementById('auth-pass-input').value;
  if(!email || !pass) return showToast("أدخل البيانات", "⚠️", "error");
  try { await window.signInWithEmailAndPassword(window.firebaseAuth, email, pass); closeModal('modal-auth'); showToast("مرحباً بك", "✅", "success"); } 
  catch (e) {
     if(e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
         try { await window.createUserWithEmailAndPassword(window.firebaseAuth, email, pass); closeModal('modal-auth'); showToast("تم إنشاء الحساب", "✅", "success"); } catch(err) { showToast("خطأ", "❌", "error"); }
     } else showToast("خطأ بالبيانات", "❌", "error");
  }
}
async function handleGoogleLogin() {
   try { const provider = new window.GoogleAuthProvider(); await window.signInWithPopup(window.firebaseAuth, provider); closeModal('modal-auth'); showToast("مرحباً بك", "✅", "success"); } catch(e) { showToast("فشل", "❌", "error"); }
}
async function handleAnonymousLogin() { try { await window.signInAnonymously(window.firebaseAuth); closeModal('modal-auth'); showToast("دخلت كزائر", "✅", "success"); } catch(e) { showToast("خطأ", "❌", "error"); } }
async function handleLogout() { try { await window.signOut(window.firebaseAuth); showToast("وداعاً", "👋", "success"); } catch(e) {} }

// Daily Reward
function checkDailyReward() {
   if(screenHistory[screenHistory.length-1] !== 'home') return;
   const today = new Date().toDateString();
   const banner = document.getElementById('daily-reward-banner');
   if(player.uid && player.lastDaily !== today) banner.classList.remove('hidden');
   else banner.classList.add('hidden');
}
async function claimDailyReward() {
   if(!player.uid) return showToast("سجل دخولك أولاً", "🔒", "error");
   const today = new Date().toDateString();
   if(player.lastDaily === today) return;
   const isGem = Math.random() > 0.8; 
   const amount = isGem ? (Math.floor(Math.random() * 6) + 5) : (Math.floor(Math.random() * 21) + 10);
   if(isGem) player.gems += amount; else player.shards += amount;
   player.lastDaily = today; await savePlayer();
   document.getElementById('daily-reward-banner').classList.add('hidden');
   showToast(`استلمت مكافأة يومية: ${amount} ${isGem ? '💎' : '🧩'}`, "🎉", "success");
   confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
}

function playCurrentLevel() {
  const lvl = dbLevels.find(l => l.num == player.currentLevel);
  if(!lvl) return showToast("أنت أسطورة! أنهيت كل المراحل الحالية.", "🚀", "info");
  loadLevel(lvl); navigateTo('game');
}

function renderWorldsGrid() {
   const grid = document.getElementById('worlds-grid'); grid.innerHTML = '';
   dbWorlds.forEach(w => {
      const isUnlocked = player.currentLevel >= w.start;
      const bg = isUnlocked ? 'glass-card border-brand-500/30' : 'bg-black/60 border-gray-800 opacity-70 grayscale';
      grid.innerHTML += `<div onclick="openWorldLevels('${w.id}')" class="${bg} p-4 rounded-2xl flex items-center justify-between cursor-pointer active:scale-95 transition"><div class="flex items-center gap-3"><div class="w-12 h-12 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center text-2xl">${w.icon}</div><div><h3 class="text-sm font-black text-white font-messiri">${w.name}</h3><span class="text-[10px] text-gray-400">مراحل ${w.start} - ${w.end}</span></div></div>${!isUnlocked ? '<i class="fa-solid fa-lock text-gray-500"></i>' : '<i class="fa-solid fa-chevron-left text-brand-400"></i>'}</div>`;
   });
}

function openWorldLevels(worldId) {
   const w = dbWorlds.find(x => x.id === worldId); if(!w) return;
   if(player.currentLevel < w.start) return showToast("هذا العالم مغلق بعد!", "🔒", "error");
   document.getElementById('levels-world-title').innerHTML = `${w.name} ${w.icon}`;
   const grid = document.getElementById('levels-grid'); grid.innerHTML = '';
   const wLevels = dbLevels.filter(l => l.world === worldId).sort((a,b)=>a.num - b.num);
   wLevels.forEach(l => {
      const isUnlocked = player.currentLevel >= l.num; const isPassed = player.currentLevel > l.num;
      let btnClass = "bg-black/60 border-gray-800 text-gray-500 cursor-not-allowed";
      if(isPassed) btnClass = "bg-green-900/30 border-green-500/40 text-green-400"; else if(isUnlocked) btnClass = "btn-3d-orange text-white";
      grid.innerHTML += `<button ${isUnlocked ? `onclick="playSpecificLevel(${l.num})"` : ''} class="${btnClass} h-12 rounded-2xl font-black flex items-center justify-center border text-sm transition">${isUnlocked ? l.num : '<i class="fa-solid fa-lock text-xs"></i>'}</button>`;
   }); navigateTo('levels');
}

function playSpecificLevel(num) { const lvl = dbLevels.find(l => l.num == num); if(lvl) { loadLevel(lvl); navigateTo('game'); } }

function loadLevel(lvl) {
  currentLevelObj = lvl; document.getElementById('game-level-num').innerText = `مرحلة ${lvl.num}`; document.getElementById('game-question-text').innerText = lvl.q;
  const w = dbWorlds.find(x => x.id === lvl.world); if(w) document.getElementById('game-world-bg-icon').innerText = w.icon;
  currentSlots = Array(lvl.a.length).fill(null);
  const arabicLetters = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'; availableLetters = lvl.a.split('');
  while(availableLetters.length < 14) availableLetters.push(arabicLetters[Math.floor(Math.random() * arabicLetters.length)]);
  availableLetters = availableLetters.sort(() => Math.random() - 0.5).map((char, index) => ({ id: index, char: char, used: false }));
  renderGameUI();
}

function useHintReveal() {
  if(player.shards < 15 && !isOwner()) return showToast("رصيد الشظايا غير كافِ", "⚠️", "error");
  const emptyIndex = currentSlots.findIndex(s => s === null);
  if(emptyIndex === -1) return;
  const correctChar = currentLevelObj.a[emptyIndex];
  const targetLetter = availableLetters.find(l => !l.used && l.char === correctChar);
  if(targetLetter) {
     if(!isOwner()) player.shards -= 15; savePlayer(); updateUI();
     targetLetter.used = true; currentSlots[emptyIndex] = targetLetter; renderGameUI();
  }
}
function useHintRemoveWrong() {
   if(player.shards < 10 && !isOwner()) return showToast("رصيد الشظايا غير كافِ", "⚠️", "error");
   const wrongLetters = availableLetters.filter(l => !l.used && !currentLevelObj.a.includes(l.char));
   if(wrongLetters.length > 0) {
      if(!isOwner()) player.shards -= 10; savePlayer(); updateUI();
      wrongLetters[0].used = true; renderGameUI();
   } else showToast("لا يوجد حروف خاطئة زائدة!", "💡", "info");
}
function useHintSkip() {
   if(player.shards < 30 && !isOwner()) return showToast("رصيد الشظايا غير كافِ", "⚠️", "error");
   if(!isOwner()) player.shards -= 30; savePlayer(); updateUI();
   document.getElementById('win-reward-text').innerText = `تم تخطي المرحلة!`;
   openModal('modal-win');
}

function renderGameUI() {
  const slotsContainer = document.getElementById('answer-slots-container'); slotsContainer.innerHTML = '';
  currentSlots.forEach((slot, index) => { slotsContainer.innerHTML += `<div onclick="removeLetterFromSlot(${index})" class="letter-slot shadow-inner">${slot ? slot.char : ''}</div>`; });
  const poolContainer = document.getElementById('letters-pool-container'); poolContainer.innerHTML = '';
  availableLetters.forEach(l => { poolContainer.innerHTML += `<button onclick="addLetterToSlot(${l.id})" class="letter-btn ${l.used ? 'hidden-letter' : ''}">${l.char}</button>`; });
  checkWin();
}

function addLetterToSlot(letterId) {
  playSFX('click'); const emptyIndex = currentSlots.findIndex(s => s === null);
  if (emptyIndex !== -1) { const l = availableLetters.find(x => x.id === letterId); if(l && !l.used) { l.used = true; currentSlots[emptyIndex] = l; renderGameUI(); } }
}
function removeLetterFromSlot(slotIndex) { const slot = currentSlots[slotIndex]; if (slot) { playSFX('click'); const l = availableLetters.find(x => x.id === slot.id); if(l) l.used = false; currentSlots[slotIndex] = null; renderGameUI(); } }
function removeLastLetter() { for(let i=currentSlots.length-1; i>=0; i--){ if(currentSlots[i] !== null) { removeLetterFromSlot(i); break; } } }
function shuffleLetters() { playSFX('click'); availableLetters.sort(() => Math.random() - 0.5); renderGameUI(); }

function checkWin() {
  const currentWord = currentSlots.map(s => s ? s.char : '').join('');
  if (currentWord === currentLevelObj.a) {
    playSFX('win'); confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    document.getElementById('win-reward-text').innerText = `حصلت على +${currentLevelObj.shards} شظية 🧩`;
    setTimeout(() => { openModal('modal-win'); }, 500);
  }
}

async function nextLevelFromWinModal() {
  closeModal('modal-win');
  if (player.currentLevel === currentLevelObj.num) {
     if(!isOwner()) player.shards += currentLevelObj.shards;
     player.currentLevel += 1; await savePlayer();
     
     const currentWorld = dbWorlds.find(w => w.id === currentLevelObj.world);
     if(currentWorld && currentWorld.end == currentLevelObj.num) {
        let gotTop10 = false;
        if(!isOwner()) { 
           player.gems += 100; player.shards += 500;
           if(currentWorld.rewardTitle && !player.titles.includes(currentWorld.rewardTitle)) player.titles.push(currentWorld.rewardTitle);
           
           let finishers = currentWorld.finishersCount || 0;
           if(finishers < 10) {
              gotTop10 = true;
              if(currentWorld.top10Reward && !player.titles.includes(currentWorld.top10Reward)) player.titles.push(currentWorld.top10Reward);
              await window.updateDoc(window.doc(window.firebaseDb, window.DB_PATH + 'worlds', currentWorld.id), { finishersCount: finishers + 1 });
           }
        }
        await savePlayer();
        document.getElementById('world-complete-title-reward').innerText = currentWorld.rewardTitle ? `+ لقب الإتمام: ${currentWorld.rewardTitle}` : '';
        document.getElementById('world-complete-top10').innerText = gotTop10 ? `🎉 مبروك! أنت من أول 10 أساطير أنهوا العالم! جائزتك: ${currentWorld.top10Reward}` : '';
        openModal('modal-world-complete'); return;
     }
  }
  playCurrentLevel();
}
function closeWorldCompleteAndGoNext() { closeModal('modal-world-complete'); playCurrentLevel(); }

function renderShopItems() {
   const grid = document.getElementById('shop-items-grid'); if(!grid) return; grid.innerHTML = '';
   if(!dbShopItems || dbShopItems.length === 0) return grid.innerHTML = '<div class="col-span-2 text-center text-gray-400 text-xs py-8">المتجر فارغ حالياً.</div>';
   dbShopItems.forEach(item => {
      let isOwned = false;
      if(item.type === 'title') isOwned = player.titles.includes(item.name);
      else if(item.type === 'avatar') isOwned = player.avatars.includes(item.name);
      else if(item.type === 'frame') isOwned = player.frames.includes(item.name);
      else if(item.type === 'banner') isOwned = player.banners.includes(item.name);

      let visual = '';
      if(item.type === 'avatar') visual = `<img src="${item.name}" class="w-12 h-12 rounded-full mb-2 bg-black/50 border border-cyan-500 object-cover"/>`;
      else if(item.type === 'banner') visual = `<div class="w-full h-12 rounded-xl mb-2 bg-black/50 border border-pink-500 object-cover" style="background-image:url('${item.name}'); background-size:cover; background-position:center;"></div>`;
      else if(item.type === 'frame') {
         const cls = getFrameClass(item.name);
         visual = `<div class="w-12 h-12 rounded-full mb-2 bg-black/50 flex items-center justify-center text-xs ${cls} ${cls===''?'border border-white/20':''} ${item.name==='أسطوري'?'frame-mythic-wrap':''}">🖼️</div><span class="text-xs font-black text-purple-300 mb-2">إطار: ${item.name}</span>`;
      }
      else visual = `<span class="text-xs font-black text-brand-300 mb-2">لقب: ${item.name}</span>`;

      grid.innerHTML += `
         <div class="glass-card p-3 rounded-2xl border ${isOwned ? 'border-green-500/50' : 'border-white/10'} text-center flex flex-col items-center justify-between">
            ${visual}
            ${isOwned ? `<span class="text-[10px] text-green-400 font-bold bg-green-500/20 px-2 py-1 rounded-full w-full">مملوك</span>` : 
            `<div class="flex gap-1 w-full mt-2">
               ${item.gems > 0 ? `<button onclick="buyShopItem('${item.id}', 'gems', ${item.gems})" class="flex-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-[10px] font-bold py-1.5 rounded-lg border border-purple-500/40 transition">${item.gems} 💎</button>` : ''}
               ${item.shards > 0 ? `<button onclick="buyShopItem('${item.id}', 'shards', ${item.shards})" class="flex-1 bg-brand-600/30 hover:bg-brand-600/50 text-brand-300 text-[10px] font-bold py-1.5 rounded-lg border border-brand-500/40 transition">${item.shards} 🧩</button>` : ''}
            </div>`}
         </div>
      `;
   });
}

async function buyShopItem(id, currency, cost) {
   const item = dbShopItems.find(x => x.id === id); if(!item) return;
   if(player[currency] < cost) return showToast(`الرصيد غير كافِ`, "⚠️", "error");
   player[currency] -= cost; 
   if(item.type === 'title') player.titles.push(item.name);
   else if(item.type === 'avatar') player.avatars.push(item.name);
   else if(item.type === 'frame') player.frames.push(item.name);
   else if(item.type === 'banner') player.banners.push(item.name);
   await savePlayer(); renderShopItems(); showToast(`تم الشراء بنجاح`, "🎉", "success");
}

function calculateProfileRank() {
    if(!player.uid) return;
    const sorted = [...allUsers].sort((a,b) => { if(b.currentLevel === a.currentLevel) return b.shards - a.shards; return b.currentLevel - a.currentLevel; });
    const rankIndex = sorted.findIndex(u => u.uid === player.uid);
    const rankSpan = document.getElementById('profile-stat-rank');
    if(rankIndex !== -1) { rankSpan.innerText = `#${rankIndex + 1}`; rankSpan.classList.add(rankIndex < 3 ? 'text-yellow-400' : 'text-amber-400'); } else { rankSpan.innerText = '-'; }
}

function renderLeaderboard() {
   const sorted = [...allUsers].sort((a,b) => { if(b.currentLevel === a.currentLevel) return b.shards - a.shards; return b.currentLevel - a.currentLevel; }).slice(0, 50);
   const top3 = document.getElementById('leaderboard-top-3'); top3.innerHTML = '';
   if(sorted.length >= 2) top3.innerHTML += buildTopCard(sorted[1], '🥈', 'cyan');
   if(sorted.length >= 1) top3.innerHTML += buildTopCard(sorted[0], '👑', 'yellow', true);
   if(sorted.length >= 3) top3.innerHTML += buildTopCard(sorted[2], '🥉', 'amber');

   const list = document.getElementById('leaderboard-list'); list.innerHTML = '';
   sorted.slice(3).forEach((u, i) => {
      const frameCls = getFrameClass(u.equippedFrame);
      list.innerHTML += `<div onclick="openPublicProfile('${u.uid}')" class="glass-card p-3 rounded-2xl flex items-center justify-between border border-white/5 cursor-pointer hover:bg-white/5"><div class="flex items-center gap-3"><span class="text-xs font-black text-gray-500 w-4">${i+4}</span><div class="relative rounded-full ${frameCls} ${u.equippedFrame==='أسطوري'?'frame-mythic-wrap':''}"><img src="${u.equippedAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.name}`}" class="w-10 h-10 rounded-full border border-gray-600 bg-game-darkBg object-cover relative z-10" />${u.email === OWNER_EMAIL ? `<span class="absolute -bottom-1 -right-1 text-[10px] z-20">👑</span>` : ''}</div><div><h4 class="text-xs font-black text-white ${u.email === OWNER_EMAIL ? 'text-amber-400' : ''}">${u.name}</h4><span class="text-[10px] text-brand-400 font-bold">مرحلة ${u.currentLevel}</span></div></div><button class="bg-black/50 text-gray-400 px-2 py-1 rounded-lg text-[10px] border border-white/10 flex gap-1 items-center"><i class="fa-solid fa-eye"></i> زيارة</button></div>`;
   });
}

function buildTopCard(u, icon, color, isFirst=false) {
   const frameCls = getFrameClass(u.equippedFrame);
   return `<div onclick="openPublicProfile('${u.uid}')" class="glass-card${isFirst?'-orange scale-105 shadow-glow-orange border-amber-400 border-2' : ` border border-${color}-500/30`} p-3 rounded-2xl text-center flex flex-col items-center cursor-pointer"><span class="text-${isFirst?'2xl':'lg'} mb-1">${icon}</span><div class="relative mb-1 rounded-full ${frameCls} ${u.equippedFrame==='أسطوري'?'frame-mythic-wrap':''}"><img src="${u.equippedAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.name}`}" class="w-${isFirst?'12':'10'} h-${isFirst?'12':'10'} rounded-full border border-${color}-400 object-cover relative z-10" />${u.email === OWNER_EMAIL ? `<span class="absolute -bottom-1 -right-1 text-xs z-20">👑</span>` : ''}</div><span class="text-[11px] font-black text-${isFirst?'yellow-300':'white'} truncate w-full mt-1">${u.name}</span><span class="text-[10px] text-${color}-400 font-bold">مرحلة ${u.currentLevel}</span></div>`;
}

let viewedUser = null;
function openPublicProfile(uid) {
   viewedUser = allUsers.find(u => u.uid === uid); if(!viewedUser) return;
   document.getElementById('pub-avatar-img').src = viewedUser.equippedAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${viewedUser.name}`;
   document.getElementById('pub-name-text').innerText = viewedUser.name;
   document.getElementById('pub-title-badge').innerText = viewedUser.equippedTitle || 'مستكشف الألغاز';
   document.getElementById('pub-stat-level').innerText = viewedUser.currentLevel;
   document.getElementById('pub-stat-score').innerText = (viewedUser.currentLevel * 100) + viewedUser.shards;
   
   const fWrap = document.getElementById('pub-frame-wrap');
   fWrap.className = `relative mb-3 rounded-full ${getFrameClass(viewedUser.equippedFrame)}`;
   if(viewedUser.equippedFrame === 'أسطوري') fWrap.classList.add('frame-mythic-wrap');

   if(viewedUser.email === OWNER_EMAIL) { document.getElementById('pub-owner-badge').classList.remove('hidden'); document.getElementById('pub-name-text').classList.add('text-amber-400'); } else { document.getElementById('pub-owner-badge').classList.add('hidden'); document.getElementById('pub-name-text').classList.remove('text-amber-400'); }
   if(isOwner() && viewedUser.email !== OWNER_EMAIL) document.getElementById('pub-admin-actions').classList.remove('hidden'); else document.getElementById('pub-admin-actions').classList.add('hidden');
   navigateTo('public-profile');
}

async function changeEquippedTitle(title) { player.equippedTitle = title; await savePlayer(); updateUI(); showToast("تم تغيير اللقب", "✅", "success"); }
async function changeEquippedAvatar(avatarUrl) { player.equippedAvatar = avatarUrl; await savePlayer(); updateUI(); showToast("تم تغيير الصورة", "✅", "success"); }
async function changeEquippedFrame(frame) { player.equippedFrame = frame; await savePlayer(); updateUI(); showToast("تم تغيير الإطار", "✅", "success"); }
async function changeEquippedBanner(banner) { player.equippedBanner = banner; await savePlayer(); updateUI(); showToast("تم تغيير البنر", "✅", "success"); }
async function editProfileName() { const newName = prompt("أدخل اسمك الجديد:", player.name); if(newName && newName.trim().length > 2) { player.name = newName.trim(); await savePlayer(); updateUI(); showToast("تم التحديث", "✅", "success"); } }

async function editProfileAvatarCustom() {
   const newUrl = prompt("أدخل رابط الصورة (URL) من الإنترنت لتكون صورتك الشخصية:", player.equippedAvatar);
   if(newUrl && newUrl.trim().length > 5) {
      player.equippedAvatar = newUrl.trim();
      if(!player.avatars.includes(newUrl.trim())) player.avatars.push(newUrl.trim());
      await savePlayer(); updateUI(); showToast("تم تحديث صورتك الشخصية!", "📸", "success");
   }
}

function searchPlayersGlobal() {
   const q = document.getElementById('global-search-input').value.trim().toLowerCase();
   const resDiv = document.getElementById('global-search-results');
   const list = document.getElementById('leaderboard-list');
   const top3 = document.getElementById('leaderboard-top-3');
   
   if(!q) { resDiv.classList.add('hidden'); list.classList.remove('hidden'); top3.classList.remove('hidden'); return; }
   
   resDiv.classList.remove('hidden'); list.classList.add('hidden'); top3.classList.add('hidden'); resDiv.innerHTML = '';
   const filtered = allUsers.filter(u => u.name.toLowerCase().includes(q));
   
   if(filtered.length === 0) return resDiv.innerHTML = '<div class="glass-card p-4 text-center text-gray-400 text-xs rounded-2xl">لم يتم العثور على اللاعب.</div>';
   
   filtered.forEach((u, i) => {
      const frameCls = getFrameClass(u.equippedFrame);
      resDiv.innerHTML += `<div onclick="openPublicProfile('${u.uid}')" class="glass-card p-3 rounded-2xl flex items-center justify-between border border-brand-500/30 cursor-pointer hover:bg-white/5 transition"><div class="flex items-center gap-3"><div class="relative rounded-full ${frameCls} ${u.equippedFrame==='أسطوري'?'frame-mythic-wrap':''}"><img src="${u.equippedAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.name}`}" class="w-10 h-10 rounded-full border border-gray-600 bg-game-darkBg object-cover relative z-10" />${u.email === OWNER_EMAIL ? `<span class="absolute -bottom-1 -right-1 text-[10px] z-20">👑</span>` : ''}</div><div><h4 class="text-xs font-black text-white ${u.email === OWNER_EMAIL ? 'text-amber-400' : ''}">${u.name}</h4><span class="text-[10px] text-brand-400 font-bold">مرحلة ${u.currentLevel}</span></div></div><button class="bg-brand-500/20 text-brand-400 px-3 py-1.5 rounded-xl text-[10px] font-bold flex gap-1 items-center"><i class="fa-solid fa-eye"></i> زيارة</button></div>`;
   });
}

async function claimPromoCode() {
   const codeInput = document.getElementById('redeem-code-input').value.trim().toUpperCase();
   if(!codeInput) return showToast("أدخل الكود", "⚠️", "error"); if(!player.uid) return showToast("يجب تسجيل الدخول", "🔒", "error");
   try {
      const codeRef = window.doc(window.firebaseDb, window.DB_PATH + 'codes', codeInput); const snap = await window.getDoc(codeRef);
      if(!snap.exists() || !snap.data().active) return showToast("كود غير صالح أو منتهي", "❌", "error");
      const claimedRef = window.doc(window.firebaseDb, window.DB_PATH + `users/${player.uid}/claimedCodes`, codeInput);
      if((await window.getDoc(claimedRef)).exists()) return showToast("استخدمت الكود مسبقاً", "⚠️", "error");
      
      const data = snap.data(); let msg = "حصلت على: ";
      if(data.gems > 0) { player.gems += data.gems; msg += `${data.gems}💎 `; }
      if(data.shards > 0) { player.shards += data.shards; msg += `${data.shards}🧩 `; }
      
      if(data.itemType && data.itemValue && data.itemType !== 'none') { 
         if(data.itemType === 'title' && !player.titles.includes(data.itemValue)) { player.titles.push(data.itemValue); msg += `لقب (${data.itemValue}) `; }
         if(data.itemType === 'avatar' && !player.avatars.includes(data.itemValue)) { player.avatars.push(data.itemValue); msg += `صورة شخصية جديدة `; }
         if(data.itemType === 'frame' && !player.frames.includes(data.itemValue)) { player.frames.push(data.itemValue); msg += `إطار (${data.itemValue}) `; }
         if(data.itemType === 'banner' && !player.banners.includes(data.itemValue)) { player.banners.push(data.itemValue); msg += `بنر خلفية جديد `; }
      }
      
      await savePlayer(); await window.setDoc(claimedRef, { claimedAt: new Date().toISOString() });
      closeModal('modal-redeem'); showToast(msg, "🎉", "success"); document.getElementById('redeem-code-input').value = '';
      confetti();
   } catch(e) { showToast("خطأ", "❌", "error"); }
}

function switchAdminTab(tab) {
   document.querySelectorAll('[id^="admin-sec-"]').forEach(el => el.classList.add('hidden'));
   document.querySelectorAll('[id^="admintab-"]').forEach(el => el.className = el.id.includes('danger') ? "flex-1 py-2 px-1 rounded-xl text-red-400" : "flex-1 py-2 px-1 rounded-xl text-gray-400");
   document.getElementById(`admin-sec-${tab}`).classList.remove('hidden');
   const btn = document.getElementById(`admintab-${tab}`);
   if(tab === 'danger') btn.className = "flex-1 py-2 px-1 rounded-xl bg-red-600 text-white font-black"; else btn.className = "flex-1 py-2 px-1 rounded-xl bg-brand-500 text-white font-black";
   if(tab === 'gift') renderAdminCodes();
}

function populateAdminDropdowns() {
   const sel = document.getElementById('adm-lvl-world'); sel.innerHTML = '';
   const autoSel = document.getElementById('adm-auto-lvl-world'); autoSel.innerHTML = '';
   dbWorlds.forEach(w => { 
      sel.innerHTML += `<option value="${w.id}">${w.name} ${w.icon}</option>`; 
      autoSel.innerHTML += `<option value="${w.id}">${w.name}</option>`; 
   });
}

function updateShopInputPlaceholder() {
   const type = document.getElementById('adm-shop-type').value;
   const input = document.getElementById('adm-shop-title');
   if(type === 'avatar') input.placeholder = "رابط الصورة (URL) من الإنترنت";
   else if(type === 'frame') input.placeholder = "اسم الإطار (ذهبي, ناري, نيون, أسطوري)";
   else if(type === 'banner') input.placeholder = "رابط البنر للخلفية (URL)";
   else input.placeholder = "اسم اللقب (مثال: قاهر الألغاز)";
}

function updateCodeItemPlaceholder() {
   const type = document.getElementById('adm-code-type').value;
   const input = document.getElementById('adm-code-item');
   if(type === 'none') { input.classList.add('hidden'); }
   else { 
      input.classList.remove('hidden'); 
      if(type === 'avatar') input.placeholder = "رابط الصورة كهدية";
      else if(type === 'banner') input.placeholder = "رابط البنر كهدية";
      else input.placeholder = `اسم الـ ${type === 'title' ? 'اللقب' : 'الإطار'} الهدية`;
   }
}

async function adminGenerate10Worlds() {
   if(!confirm("هل أنت متأكد من توليد العوالم العشرة الأسطورية؟")) return;
   showToast("جاري التوليد... الرجاء الانتظار", "⏳", "info");
   const worlds = [
        { id: 'w1', name: 'غابة البداية', icon: '🌲', start: 1, end: 100, rewardTitle: 'حارس الغابة', top10Reward: 'أسطورة الطبيعة' },
        { id: 'w2', name: 'صحراء الغموض', icon: '🏜️', start: 101, end: 200, rewardTitle: 'فارس الصحراء', top10Reward: 'عقرب الرمال' },
        { id: 'w3', name: 'جبل الجليد', icon: '🏔️', start: 201, end: 300, rewardTitle: 'قاهر الصقيع', top10Reward: 'التنين الثلجي' },
        { id: 'w4', name: 'بركان الغضب', icon: '🌋', start: 301, end: 400, rewardTitle: 'سيد النار', top10Reward: 'العنقاء' },
        { id: 'w5', name: 'أعماق المحيط', icon: '🌊', start: 401, end: 500, rewardTitle: 'حاكم البحار', top10Reward: 'لڤياثان الأعماق' },
        { id: 'w6', name: 'مدينة السحاب', icon: '☁️', start: 501, end: 600, rewardTitle: 'صقر السماء', top10Reward: 'سيد الرياح' },
        { id: 'w7', name: 'بوابة المجرة', icon: '🌌', start: 601, end: 700, rewardTitle: 'رائد الفضاء', top10Reward: 'نجم المجرة' },
        { id: 'w8', name: 'عالم النيون', icon: '🏙️', start: 701, end: 800, rewardTitle: 'المخترق', top10Reward: 'سيد السايبر' },
        { id: 'w9', name: 'متاهة الزمن', icon: '⏳', start: 801, end: 900, rewardTitle: 'حارس الزمن', top10Reward: 'المسافر عبر الزمن' },
        { id: 'w10', name: 'قلعة الأساطير', icon: '🏰', start: 901, end: 1000, rewardTitle: 'الأسطورة الخالدة', top10Reward: 'حاكم العوالم المئة' }
   ];
   try {
     for (let w of worlds) { await window.setDoc(window.doc(window.firebaseDb, window.DB_PATH + 'worlds', w.id), { ...w, finishersCount: 0 }); }
     showToast("تم توليد الـ 10 عوالم بنجاح!", "✅", "success");
   } catch(e) { showToast("خطأ", "❌", "error"); }
}

async function adminAutoGenerateLevels() {
   const worldId = document.getElementById('adm-auto-lvl-world').value;
   const w = dbWorlds.find(x => x.id === worldId);
   if(!w) return showToast("اختر عالم", "⚠️", "error");
   if(confirm(`سيتم توليد 100 مرحلة متدرجة الصعوبة للعالم (${w.name})، متأكد؟`)) {
      showToast("جاري توليد 100 مرحلة... قد يستغرق ثواني", "⏳", "info");
      let proms = [];
      for(let i=w.start; i<=w.end; i++){
         proms.push(window.setDoc(window.doc(window.firebaseDb, window.DB_PATH + 'levels', 'lvl_'+i), { num: i, world: w.id, q: `لغز المرحلة ${i} المتصاعد في الصعوبة؟ (تحتاج للتعديل لاحقاً)`, a: 'حل', shards: 20 + Math.floor(i/10) }));
      }
      try { await Promise.all(proms); showToast("تم التوليد بنجاح!", "✅", "success"); } catch(e) { showToast("حدث خطأ", "❌", "error"); }
   }
}

async function adminSaveWorld() {
   const id = document.getElementById('adm-world-id').value.trim(), name = document.getElementById('adm-world-name').value.trim(), icon = document.getElementById('adm-world-icon').value.trim(), start = parseInt(document.getElementById('adm-world-start').value), end = parseInt(document.getElementById('adm-world-end').value);
   const rewardTitle = document.getElementById('adm-world-reward-title').value.trim(), top10Reward = document.getElementById('adm-world-top10-reward').value.trim();
   if(!id || !name || !icon || !start || !end) return showToast("أكمل البيانات الأساسية", "⚠️", "error");
   try { await window.setDoc(window.doc(window.firebaseDb, window.DB_PATH + 'worlds', id), { id, name, icon, start, end, rewardTitle, top10Reward, finishersCount: 0 }); showToast("تم حفظ العالم", "🌍", "success"); } catch(e) { showToast("خطأ", "❌", "error"); }
}

async function adminSaveLevel() {
   const num = parseInt(document.getElementById('adm-lvl-num').value), world = document.getElementById('adm-lvl-world').value, q = document.getElementById('adm-lvl-question').value.trim(), a = document.getElementById('adm-lvl-answer').value.trim(), shards = parseInt(document.getElementById('adm-lvl-shards').value);
   if(!num || !world || !q || !a) return showToast("أكمل البيانات", "⚠️", "error");
   try { await window.setDoc(window.doc(window.firebaseDb, window.DB_PATH + 'levels', 'lvl_'+num), { num, world, q, a, shards }); showToast("تم الإضافة", "➕", "success"); } catch(e) { showToast("خطأ", "❌", "error"); }
}

async function adminSaveShopItem() {
   const type = document.getElementById('adm-shop-type').value, name = document.getElementById('adm-shop-title').value.trim(), gems = parseInt(document.getElementById('adm-shop-price-gems').value) || 0, shards = parseInt(document.getElementById('adm-shop-price-shards').value) || 0;
   if(!name) return showToast("أدخل الاسم أو الرابط", "⚠️", "error");
   const id = type + '_' + Date.now();
   try { await window.setDoc(window.doc(window.firebaseDb, window.DB_PATH + 'shop', id), { id, type, name, gems, shards }); showToast("أضيف للمتجر", "✅", "success"); document.getElementById('adm-shop-title').value = ''; } catch(e) { showToast("خطأ", "❌", "error"); }
}

function adminSearchUsers() {
   const q = document.getElementById('adm-search-input').value.trim().toLowerCase(), resDiv = document.getElementById('adm-search-results'); resDiv.innerHTML = '';
   if(!q) return; const filtered = allUsers.filter(u => u.name.toLowerCase().includes(q));
   if(filtered.length === 0) return resDiv.innerHTML = '<p class="text-xs text-center text-gray-500 py-4">لم يتم العثور</p>';
   filtered.forEach(u => resDiv.innerHTML += `<div class="bg-black/40 border border-white/10 p-3 rounded-xl flex items-center justify-between"><div><h4 class="text-xs font-black text-white">${u.name}</h4><span class="text-[10px] text-gray-400">مرحلة: ${u.currentLevel} | 🧩 ${u.shards}</span></div><button onclick="openPublicProfile('${u.uid}')" class="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold">ملف/إهداء</button></div>`);
}

async function adminCreateCode() {
   const code = document.getElementById('adm-code-name').value.trim().toUpperCase(), gems = parseInt(document.getElementById('adm-code-gems').value) || 0, shards = parseInt(document.getElementById('adm-code-shards').value) || 0;
   const itemType = document.getElementById('adm-code-type').value;
   const itemValue = document.getElementById('adm-code-item').value.trim();
   if(!code) return showToast("أدخل الرمز", "⚠️", "error");
   if(itemType !== 'none' && !itemValue) return showToast("أدخل اسم الهدية أو الرابط", "⚠️", "error");
   try { await window.setDoc(window.doc(window.firebaseDb, window.DB_PATH + 'codes', code), { code, gems, shards, itemType, itemValue, active: true }); showToast("تم إنشاء الكود", "🎁", "success"); document.getElementById('adm-code-name').value = '';} catch(e) { showToast("خطأ", "❌", "error"); }
}

function renderAdminCodes() {
   const list = document.getElementById('adm-codes-list'); if(!list) return; list.innerHTML = '';
   if(dbCodes.length === 0) return list.innerHTML = '<p class="text-xs text-center text-gray-500 py-2">لا يوجد أكواد</p>';
   dbCodes.forEach(c => {
      list.innerHTML += `<div class="bg-black/40 border ${c.active ? 'border-green-500/30' : 'border-red-500/30'} p-2.5 rounded-xl flex items-center justify-between"><div class="flex-1"><h4 class="text-xs font-black text-white">${c.code} ${c.active ? '✅' : '❌'}</h4><span class="text-[10px] text-gray-400 block mt-0.5">💎 ${c.gems} | 🧩 ${c.shards} ${c.itemType !== 'none' ? '| 🎁 '+c.itemValue : ''}</span></div><button onclick="adminToggleCode('${c.code}', ${!c.active})" class="${c.active ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'} border px-3 py-1.5 rounded-lg text-[10px] font-bold">${c.active ? 'إيقاف' : 'تفعيل'}</button></div>`;
   });
}

async function adminToggleCode(code, state) {
    try { await window.updateDoc(window.doc(window.firebaseDb, window.DB_PATH + 'codes', code), { active: state }); showToast("تم التحديث", "✅", "success"); } catch(e) { showToast("خطأ", "❌", "error"); }
}

async function adminSendGiftToUser(shards, gems) {
   if(!viewedUser) return;
   try { await window.updateDoc(window.doc(window.firebaseDb, window.DB_PATH + 'users', viewedUser.uid), { shards: viewedUser.shards + shards, gems: viewedUser.gems + gems }); showToast(`تم الإرسال`, "🎁", "success"); } catch(e) { showToast("فشل", "❌", "error"); }
}

async function adminResetLeaderboard() {
   if(confirm("تحذير خطير: هل أنت متأكد من تصفير حسابات جميع اللاعبين إلى المرحلة 1 وصفر نقاط؟")) {
      showToast("جاري التصفير...", "⏳", "info");
      try {
         const proms = allUsers.map(u => { if(u.email !== OWNER_EMAIL) return window.updateDoc(window.doc(window.firebaseDb, window.DB_PATH + 'users', u.uid), { currentLevel: 1, shards: 0, gems: 0 }); });
         await Promise.all(proms); showToast("تم التصفير بنجاح", "✅", "success");
      } catch(e) { showToast("خطأ", "❌", "error"); }
   }
}