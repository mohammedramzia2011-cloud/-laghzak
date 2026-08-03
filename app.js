let screenHistory = ['home'];
let player = { uid: 'user123', email: 'test@test.com', name: 'اللاعب', shards: 100, gems: 10, lastDaily: '' };
let currentLevelObj = null, currentSlots = [], availableLetters = [];

// 1. نظام التنقل
function navigateTo(screenId) {
  document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
  document.getElementById(`screen-${screenId}`).classList.remove('hidden');
  if (screenHistory[screenHistory.length - 1] !== screenId && screenId !== 'splash') screenHistory.push(screenId);
  
  if(screenId === 'home') checkDailyReward();
}
function goBack() {
  if (screenHistory.length > 1) { screenHistory.pop(); navigateTo(screenHistory.pop()); } 
  else { navigateTo('home'); }
}

function showToast(msg, icon = '✨', type = 'info') {
  const toast = document.getElementById('toast-msg');
  document.getElementById('toast-text').innerText = msg; document.getElementById('toast-icon').innerText = icon;
  toast.className = 'bg-gray-900/95 text-white border px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 transform transition-all duration-300 pointer-events-auto z-[100] border-brand-500';
  toast.classList.remove('-translate-y-10', 'opacity-0');
  setTimeout(() => { toast.classList.add('-translate-y-10', 'opacity-0'); }, 3000);
}

// 2. إصلاح تعليق تسجيل الدخول بوضع Try/Catch/Finally
async function loginUserSafe() {
    const btn = document.getElementById('login-btn');
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    
    if(!email || !pass) return showToast("أدخل الإيميل وكلمة المرور", "⚠️");

    btn.disabled = true;
    btn.innerText = "جاري التحميل...";

    try {
        // افترض أن هذا هو كود الفايربيس الخاص بك
        // await window.signInWithEmailAndPassword(window.auth, email, pass);
        
        // محاكاة انتظار السيرفر
        await new Promise(r => setTimeout(r, 1000));
        
        showToast("تم تسجيل الدخول بنجاح!", "✅", "success");
        navigateTo('home');
        
    } catch (error) {
        console.error("Login Error:", error);
        showToast("حدث خطأ في السيرفر أو الإنترنت ضعيف", "❌", "error");
    } finally {
        // إرجاع الزر لوضعه الطبيعي دائماً حتى لو فشل الاتصال كي لا يعلق
        btn.disabled = false;
        btn.innerText = "تسجيل الدخول / حساب جديد";
    }
}

// 3. إصلاح وتأمين الصندوق اليومي
function checkDailyReward() {
   const today = new Date().toDateString();
   const banner = document.getElementById('daily-reward-banner');
   if(player.lastDaily !== today) { banner.classList.remove('hidden'); } 
   else { banner.classList.add('hidden'); }
}

async function claimDailyReward() {
   const btn = document.getElementById('daily-reward-btn');
   btn.disabled = true;

   try {
       player.lastDaily = new Date().toDateString(); 
       player.shards += 50;
       // await savePlayer(); (حفظ في قاعدة البيانات)
       
       document.getElementById('daily-reward-banner').classList.add('hidden');
       showToast("استلمت مكافأة يومية: 50 🧩", "🎉", "success");
       if(typeof confetti !== 'undefined') confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
       
   } catch (e) {
       showToast("خطأ بالاتصال، حاول مجدداً", "❌", "error");
   } finally {
       btn.disabled = false;
   }
}

// 4. نظام الهدايا الأكيد (إنشاء الكود كمالك + استخدامه كلاعب)
async function adminCreatePromoCodeUI() {
    const codeName = document.getElementById('admin-promo-name').value.trim();
    const amount = parseInt(document.getElementById('admin-promo-amount').value);
    
    if(!codeName || isNaN(amount)) return showToast("أدخل بيانات الكود صحيحة", "⚠️");

    try {
        // كود الفايربيس (محاكاة هنا)
        // await setDoc(doc(db, "codes", codeName), { isValid: true, reward: amount });
        
        // للاختبار محلياً:
        window.tempCodes = window.tempCodes || {};
        window.tempCodes[codeName] = amount;
        
        showToast("تم إنشاء كود الهدية بنجاح!", "👑", "success");
    } catch (error) {
        showToast("خطأ في رفع الكود", "❌", "error");
    }
}

async function redeemCode() {
    const inputCode = document.getElementById('redeem-input').value.trim();
    if(!inputCode) return showToast("أدخل الكود أولاً", "⚠️");
    
    try {
        // فحص الفايربيس
        // const codeSnap = await getDoc(doc(db, "codes", inputCode));
        
        if (window.tempCodes && window.tempCodes[inputCode]) {
            let reward = window.tempCodes[inputCode];
            player.shards += reward;
            delete window.tempCodes[inputCode]; // إبطال الكود
            
            showToast(`مبروك! حصلت على ${reward} شظية 🧩`, "🎁", "success");
            document.getElementById('redeem-input').value = '';
        } else {
            showToast("الكود غير صحيح أو تم استخدامه مسبقاً", "❌", "error");
        }
    } catch (error) {
        showToast("حدث خطأ في السيرفر", "❌", "error");
    }
}

// 5. توليد 10 عوالم وأسئلة الصور وترتيب الأحرف
async function adminGenerateMassiveGame() {
   if(!confirm("سيتم إضافة 10 عوالم و 1000 مرحلة، هل أنت متأكد؟")) return;
   showToast("جاري التوليد... يرجى الانتظار", "⏳");
   
   const words = ['قمر','شمس','تفاحة','شجرة'];
   const imgQuestions = [
       { q: 'ما هذا الشيء؟', a: 'تفاحة', img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6f46d?w=200&q=80' },
       { q: 'ما هو هذا الحيوان؟', a: 'قطة', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&q=80' }
   ];

   try {
       // حلقة لـ 10 عوالم
       for (let wId = 1; wId <= 10; wId++) {
           let startLvl = (wId - 1) * 100 + 1;
           let endLvl = wId * 100;
           
           // إنشاء العالم
           // await setDoc(doc(db, "worlds", "w"+wId), { name: "عالم "+wId, start: startLvl, end: endLvl });
           
           // إنشاء 100 مرحلة لهذا العالم
           for(let lvl = startLvl; lvl <= endLvl; lvl++){
               let qType = Math.random();
               let levelData = { num: lvl, world: "w"+wId, shards: 25 };
               
               if (qType > 0.6) {
                   // سؤال صورة
                   let rand = imgQuestions[Math.floor(Math.random() * imgQuestions.length)];
                   levelData.q = rand.q; levelData.a = rand.a; levelData.img = rand.img;
               } else {
                   // سؤال ترتيب أحرف عادي
                   levelData.q = "رتب الأحرف لتكوين الكلمة"; 
                   levelData.a = words[Math.floor(Math.random() * words.length)];
               }
               // await setDoc(doc(db, "levels", "lvl_"+lvl), levelData);
           }
       }
       showToast("تم توليد العوالم والمراحل بنجاح!", "🔥", "success");
   } catch(e) { 
       showToast("حدث خطأ أثناء التوليد", "❌", "error"); 
   }
}

// 6. تحميل وتشغيل المرحلة (تتضمن فحص الصورة وترتيب الحروف)
function loadLevel(lvlData) {
  currentLevelObj = lvlData; 
  document.getElementById('game-level-num').innerText = `مرحلة ${lvlData.num}`; 
  document.getElementById('game-question-text').innerText = lvlData.q;
  
  // إظهار الصورة إذا كانت موجودة في المرحلة
  const imgContainer = document.getElementById('game-question-image');
  if (lvlData.img) {
      imgContainer.innerHTML = `<img src="${lvlData.img}" class="w-32 h-32 object-cover rounded-xl border-2 border-brand-500 shadow-lg mx-auto" />`;
      imgContainer.classList.remove('hidden');
  } else {
      imgContainer.innerHTML = '';
      imgContainer.classList.add('hidden');
  }

  currentSlots = Array(lvlData.a.length).fill(null);
  
  // خلط الأحرف
  const arabicLetters = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'; 
  availableLetters = lvlData.a.split('');
  while(availableLetters.length < 14) {
      availableLetters.push(arabicLetters[Math.floor(Math.random() * arabicLetters.length)]);
  }
  availableLetters = availableLetters.sort(() => Math.random() - 0.5).map((char, index) => ({ id: index, char: char, used: false }));
  
  renderGameUI();
}

function renderGameUI() {
  const slotsContainer = document.getElementById('answer-slots-container'); 
  slotsContainer.innerHTML = '';
  currentSlots.forEach((slot, index) => { slotsContainer.innerHTML += `<div onclick="removeLetterFromSlot(${index})" class="letter-slot shadow-inner">${slot ? slot.char : ''}</div>`; });
  
  const poolContainer = document.getElementById('letters-pool-container'); 
  poolContainer.innerHTML = '';
  availableLetters.forEach(l => { poolContainer.innerHTML += `<button onclick="addLetterToSlot(${l.id})" class="letter-btn ${l.used ? 'hidden-letter' : ''}">${l.char}</button>`; });
}

function addLetterToSlot(letterId) { const emptyIndex = currentSlots.findIndex(s => s === null); if (emptyIndex !== -1) { const l = availableLetters.find(x => x.id === letterId); if(l && !l.used) { l.used = true; currentSlots[emptyIndex] = l; renderGameUI(); } } }
function removeLetterFromSlot(slotIndex) { const slot = currentSlots[slotIndex]; if (slot) { const l = availableLetters.find(x => x.id === slot.id); if(l) l.used = false; currentSlots[slotIndex] = null; renderGameUI(); } }
function removeLastLetter() { for(let i=currentSlots.length-1; i>=0; i--){ if(currentSlots[i] !== null) { removeLetterFromSlot(i); break; } } }
function shuffleLetters() { availableLetters.sort(() => Math.random() - 0.5); renderGameUI(); }

function playCurrentLevel() {
    navigateTo('game');
    // تشغيل مرحلة تجريبية للاختبار
    loadLevel({ num: 1, q: "ما هو هذا الحيوان؟", a: "قطة", img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&q=80", shards: 20 });
}

// تشغيل الواجهة
setTimeout(() => { document.getElementById('screen-splash').classList.add('hidden'); navigateTo('home'); }, 2000);
