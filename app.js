// ==========================================
// 1. حالة اللعبة والبيانات التشغيلية (State)
// ==========================================
let screenHistory = ['home'];

let player = {
    uid: 'guest_998',
    email: '',
    name: 'اللاعب الأسطوري',
    shards: 150,
    gems: 20,
    level: 1,
    currentWorld: 1,
    equippedTitle: 'مستكشف الألغاز',
    equippedAvatar: 'LghzakPlayer',
    equippedFrame: 'border-brand-500',
    inventoryTitles: ['مستكشف الألغاز', 'بطل العوالم', 'ملك الألغاز'],
    inventoryAvatars: ['LghzakPlayer', 'RobotAlpha', 'WizardKing'],
    inventoryFrames: ['border-brand-500', 'border-purple-500', 'border-yellow-400'],
    lastDailyReward: '',
    isAdmin: false
};

let currentLevelObj = null;
let currentSlots = [];
let availableLetters = [];

// قاعدة بيانات كود الهدايا المؤقتة
window.tempCodes = {
    'LGHZAK2026': 300,
    'WELCOME': 100
};

// ==========================================
// 2. نظام التنقل والواجهات (Navigation System)
// ==========================================
function navigateTo(screenId) {
    // إخفاء جميع الشاشات
    const screens = document.querySelectorAll('main > section');
    screens.forEach(s => s.classList.add('hidden'));

    // إظهار الشاشة المطلوبة
    const targetScreen = document.getElementById(`screen-${screenId}`);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
    }

    // إدارة شريط التنقل العلوي والسفلي
    const topBar = document.getElementById('top-bar');
    const backBtn = document.getElementById('header-back-btn');
    
    if (screenId === 'splash') {
        topBar.classList.add('hidden');
    } else {
        topBar.classList.remove('hidden');
    }

    if (screenId === 'home' || screenId === 'splash') {
        backBtn.classList.add('hidden');
    } else {
        backBtn.classList.remove('hidden');
    }

    // إضافة إلى سجل التنقل
    if (screenHistory[screenHistory.length - 1] !== screenId && screenId !== 'splash') {
        screenHistory.push(screenId);
    }

    // أفعال إضافية عند فتح شاشات معينة
    if (screenId === 'home') {
        checkDailyReward();
    } else if (screenId === 'worlds') {
        renderWorldsList();
    } else if (screenId === 'profile') {
        renderInventoryUI();
    }

    updatePlayerHeaderUI();
}

function goBack() {
    if (screenHistory.length > 1) {
        screenHistory.pop(); // حذف الشاشة الحالية
        const previousScreen = screenHistory.pop();
        navigateTo(previousScreen);
    } else {
        navigateTo('home');
    }
}

// إشعارات Toast
function showToast(msg, icon = '✨', type = 'info') {
    const toast = document.getElementById('toast-msg');
    const toastText = document.getElementById('toast-text');
    const toastIcon = document.getElementById('toast-icon');

    toastText.innerText = msg;
    toastIcon.innerText = icon;

    toast.classList.remove('-translate-y-10', 'opacity-0', 'hidden');
    
    setTimeout(() => {
        toast.classList.add('-translate-y-10', 'opacity-0');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}

// تحديث بيانات الهيدر العلوي
function updatePlayerHeaderUI() {
    document.getElementById('currency-shards').innerText = player.shards;
    document.getElementById('currency-gems').innerText = player.gems;
    document.getElementById('header-name').innerText = player.name;
    document.getElementById('header-title').innerText = player.equippedTitle;
    document.getElementById('header-avatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${player.equippedAvatar}`;
    
    const frameWrap = document.getElementById('header-frame-wrap');
    frameWrap.className = `relative rounded-full p-0.5 border-2 ${player.equippedFrame}`;
}

// ==========================================
// 3. حل مشكلة تسجيل الدخول (Safe Login Fix)
// ==========================================
async function loginUserSafe() {
    const btn = document.getElementById('login-btn');
    const emailInput = document.getElementById('login-email').value.trim();
    const passInput = document.getElementById('login-pass').value.trim();

    if (!emailInput || !passInput) {
        showToast("يرجى إدخال البريد الإلكتروني وكلمة المرور", "⚠️");
        return;
    }

    // 1. تغيير حالة الزر لمنع التكرار
    btn.disabled = true;
    btn.innerText = "جاري الاتصال بالسيرفر...";

    try {
        // محاكاة الاتصال بالسيرفر أو الفايربيس
        // await window.signInWithEmailAndPassword(window.auth, emailInput, passInput);
        await new Promise(resolve => setTimeout(resolve, 1200));

        player.email = emailInput;
        player.name = emailInput.split('@')[0];
        
        showToast("تم تسجيل الدخول وتحديث البيانات بنجاح!", "✅");
        updatePlayerHeaderUI();
        navigateTo('home');

    } catch (error) {
        console.error("Login Error:", error);
        showToast("حدث خطأ أثناء تسجيل الدخول! تأكد من شبكة الإنترنت", "❌");
    } finally {
        // 2. الأهم: فك تجميد الزر دائماً لمنع التعليق
        btn.disabled = false;
        btn.innerText = "تسجيل الدخول / حساب جديد";
    }
}

// ==========================================
// 4. نظام كود الهدايا المضمون (Promo Codes)
// ==========================================
async function adminCreatePromoCodeUI() {
    const nameInput = document.getElementById('admin-promo-name').value.trim().toUpperCase();
    const amountInput = parseInt(document.getElementById('admin-promo-amount').value);

    if (!nameInput || isNaN(amountInput) || amountInput <= 0) {
        showToast("يرجى أدخل اسم الكود وقيمة الشظايا بشكل صحيح", "⚠️");
        return;
    }

    try {
        // إضافة الكود للذاكرة/الفايربيس
        window.tempCodes[nameInput] = amountInput;
        
        showToast(`تم إنشاء كود الهدية (${nameInput}) بقيمة ${amountInput} شظية!`, "👑");
        document.getElementById('admin-promo-name').value = '';
        document.getElementById('admin-promo-amount').value = '';

    } catch (error) {
        showToast("خطأ أثناء حفظ الكود بالسيرفر", "❌");
    }
}

async function redeemCode() {
    const inputCode = document.getElementById('redeem-input').value.trim().toUpperCase();

    if (!inputCode) {
        showToast("يرجى كتابة رمز الهدية أولاً", "⚠️");
        return;
    }

    try {
        if (window.tempCodes && window.tempCodes[inputCode]) {
            let rewardShards = window.tempCodes[inputCode];
            player.shards += rewardShards;
            
            // إلغاء الكود بعد الاستخدام
            delete window.tempCodes[inputCode];

            showToast(`مبروك! حصلت على ${rewardShards} شظية 🧩`, "🎁");
            document.getElementById('redeem-input').value = '';
            updatePlayerHeaderUI();

            if (typeof confetti !== 'undefined') {
                confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
            }
        } else {
            showToast("رمز الهدية غير صحيح أو تم استخدامه مسبقاً", "❌");
        }
    } catch (error) {
        showToast("حدث خطأ أثناء فحص رمز الهدية", "❌");
    }
}

// ==========================================
// 5. نظام الحقيبة وتجهيز العناصر (Inventory)
// ==========================================
function renderInventoryUI() {
    const titleSelect = document.getElementById('equip-title-select');
    const avatarSelect = document.getElementById('equip-avatar-select');
    const frameSelect = document.getElementById('equip-frame-select');

    // تعبئة الألقاب المملوكة
    titleSelect.innerHTML = '';
    player.inventoryTitles.forEach(t => {
        titleSelect.innerHTML += `<option value="${t}" ${player.equippedTitle === t ? 'selected' : ''}>${t}</option>`;
    });

    // تعبئة الصور المملوكة
    avatarSelect.innerHTML = '';
    player.inventoryAvatars.forEach(a => {
        avatarSelect.innerHTML += `<option value="${a}" ${player.equippedAvatar === a ? 'selected' : ''}>${a}</option>`;
    });

    // تعبئة الإطارات المملوكة
    frameSelect.innerHTML = '';
    player.inventoryFrames.forEach(f => {
        let fName = f === 'border-brand-500' ? 'برتقالي' : f === 'border-purple-500' ? 'بنفسجي' : 'ذهبي';
        frameSelect.innerHTML += `<option value="${f}" ${player.equippedFrame === f ? 'selected' : ''}>إطار ${fName}</option>`;
    });
}

function equipTitle(val) {
    player.equippedTitle = val;
    updatePlayerHeaderUI();
    showToast(`تم تجهيز اللقب: ${val}`, "🏷️");
}

function equipAvatar(val) {
    player.equippedAvatar = val;
    updatePlayerHeaderUI();
    showToast("تم تحديث الصورة الرمزية", "🖼️");
}

function equipFrame(val) {
    player.equippedFrame = val;
    updatePlayerHeaderUI();
    showToast("تم تغيير إطار البروفايل", "✨");
}

// ==========================================
// 6. مولد العوالم والمراحل الضخم (10 العوالم)
// ==========================================
let generatedWorldsData = [];

async function adminGenerateMassiveGame() {
    if (!confirm("هل تريد توليد 10 عوالم تحتوي على 1000 مرحلة الآن؟")) return;

    showToast("جاري توليد العوالم والمراحل...", "⏳");

    const sampleImages = [
        { q: 'ما هذا الشيء في الصورة؟', a: 'تفاحة', img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6f46d?w=300&q=80' },
        { q: 'ما هو هذا الحيوان؟', a: 'قطة', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&q=80' },
        { q: 'ما هذا المشروب؟', a: 'قهوة', img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&q=80' }
    ];

    const sampleWords = ['سيارة', 'طائرة', 'مدرسة', 'كمبيوتر', 'هاتف', 'شمس', 'قمر', 'كوكب'];

    generatedWorldsData = [];

    for (let w = 1; w <= 10; w++) {
        let worldObj = {
            id: w,
            name: `العالم ${w}: ${w === 1 ? 'عالم البداية' : w === 2 ? 'عالم الغابة' : 'العالم الأسطوري ' + w}`,
            startLevel: (w - 1) * 100 + 1,
            endLevel: w * 100,
            levels: []
        };

        for (let l = worldObj.startLevel; l <= worldObj.endLevel; l++) {
            if (l % 2 === 0) {
                // مرحلة مصورة
                let imgItem = sampleImages[l % sampleImages.length];
                worldObj.levels.push({
                    num: l,
                    q: imgItem.q,
                    a: imgItem.a,
                    img: imgItem.img,
                    shardsReward: 20
                });
            } else {
                // مرحلة نصية
                let word = sampleWords[l % sampleWords.length];
                worldObj.levels.push({
                    num: l,
                    q: 'رتب الأحرف لتشكيل الكلمة الصحيحة',
                    a: word,
                    img: null,
                    shardsReward: 15
                });
            }
        }

        generatedWorldsData.push(worldObj);
    }

    showToast("تم توليد 10 عوالم و 1000 مرحلة بنجاح!", "🔥");
    renderWorldsList();
}

function renderWorldsList() {
    const container = document.getElementById('worlds-list-container');
    container.innerHTML = '';

    if (generatedWorldsData.length === 0) {
        // إنشاء عوالم افتراضية للعرض
        adminGenerateMassiveGame();
        return;
    }

    generatedWorldsData.forEach(w => {
        container.innerHTML += `
            <div class="glass-card p-4 rounded-3xl border border-white/10 flex justify-between items-center">
                <div>
                    <h3 class="text-sm font-black text-amber-300 font-messiri">${w.name}</h3>
                    <p class="text-[10px] text-gray-400">المراحل: من ${w.startLevel} إلى ${w.endLevel}</p>
                </div>
                <button onclick="startWorld(${w.id})" class="btn-3d-orange px-3.5 py-1.5 rounded-xl text-xs font-black">
                    دخول
                </button>
            </div>
        `;
    });
}

function startWorld(worldId) {
    player.currentWorld = worldId;
    let world = generatedWorldsData.find(w => w.id === worldId);
    if (world && world.levels.length > 0) {
        loadLevelObject(world.levels[0]);
        navigateTo('game');
    }
}

// ==========================================
// 7. محرك وقواعد اللعبة (Game Engine)
// ==========================================
function playCurrentLevel() {
    if (generatedWorldsData.length === 0) {
        adminGenerateMassiveGame();
    }
    let firstLevel = generatedWorldsData[0].levels[0];
    loadLevelObject(firstLevel);
    navigateTo('game');
}

function loadLevelObject(levelObj) {
    currentLevelObj = levelObj;
    
    document.getElementById('game-level-num').innerText = `المرحلة ${levelObj.num}`;
    document.getElementById('game-question-text').innerText = levelObj.q;

    // معالجة صورة السؤال
    const imgDiv = document.getElementById('game-question-image');
    if (levelObj.img) {
        imgDiv.innerHTML = `<img src="${levelObj.img}" class="w-36 h-36 object-cover rounded-2xl border-2 border-brand-500 shadow-xl mx-auto" />`;
        imgDiv.classList.remove('hidden');
    } else {
        imgDiv.innerHTML = '';
        imgDiv.classList.add('hidden');
    }

    // تجهيز خانات الإجابة
    currentSlots = Array(levelObj.a.length).fill(null);

    // تجهيز مجمعة الحروف
    const arabicChars = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي';
    let letters = levelObj.a.split('');
    
    while (letters.length < 14) {
        letters.push(arabicChars[Math.floor(Math.random() * arabicChars.length)]);
    }

    availableLetters = letters.sort(() => Math.random() - 0.5).map((char, index) => ({
        id: index,
        char: char,
        used: false
    }));

    renderGameSlotsAndPool();
}

function renderGameSlotsAndPool() {
    // عرض الخانات
    const slotsDiv = document.getElementById('answer-slots-container');
    slotsDiv.innerHTML = '';
    currentSlots.forEach((slot, idx) => {
        slotsDiv.innerHTML += `
            <div onclick="removeLetterFromSlot(${idx})" class="letter-slot shadow-md">
                ${slot ? slot.char : ''}
            </div>
        `;
    });

    // عرض الحروف
    const poolDiv = document.getElementById('letters-pool-container');
    poolDiv.innerHTML = '';
    availableLetters.forEach(l => {
        poolDiv.innerHTML += `
            <button onclick="addLetterToSlot(${l.id})" class="letter-btn ${l.used ? 'hidden-letter' : ''}">
                ${l.char}
            </button>
        `;
    });
}

function addLetterToSlot(letterId) {
    const emptySlotIdx = currentSlots.findIndex(s => s === null);
    if (emptySlotIdx !== -1) {
        const item = availableLetters.find(x => x.id === letterId);
        if (item && !item.used) {
            item.used = true;
            currentSlots[emptySlotIdx] = item;
            renderGameSlotsAndPool();
            checkAnswerCondition();
        }
    }
}

function removeLetterFromSlot(slotIdx) {
    const slotItem = currentSlots[slotIdx];
    if (slotItem) {
        const item = availableLetters.find(x => x.id === slotItem.id);
        if (item) item.used = false;
        currentSlots[slotIdx] = null;
        renderGameSlotsAndPool();
    }
}

function removeLastLetter() {
    for (let i = currentSlots.length - 1; i >= 0; i--) {
        if (currentSlots[i] !== null) {
            removeLetterFromSlot(i);
            break;
        }
    }
}

function shuffleLetters() {
    availableLetters.sort(() => Math.random() - 0.5);
    renderGameSlotsAndPool();
}

function checkAnswerCondition() {
    if (currentSlots.every(s => s !== null)) {
        let userWord = currentSlots.map(s => s.char).join('');
        if (userWord === currentLevelObj.a) {
            player.shards += currentLevelObj.shardsReward;
            showToast(`إجابة صحيحة! حصلت على ${currentLevelObj.shardsReward} شظية 🧩`, "🎉");
            
            if (typeof confetti !== 'undefined') {
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            }

            setTimeout(() => {
                let nextNum = currentLevelObj.num + 1;
                showToast(`جاري الانقال للمرحلة ${nextNum}`, "🚀");
            }, 1500);
        } else {
            showToast("إجابة خاطئة! حاول مرة أخرى", "❌");
        }
    }
}

function useHint() {
    if (player.shards < 20) {
        showToast("لا تملك شظايا كافية للتلميح!", "⚠️");
        return;
    }
    player.shards -= 20;
    updatePlayerHeaderUI();
    showToast(`الكلمة هي: (${currentLevelObj.a})`, "💡");
}

// ==========================================
// 8. نظام المكافأة اليومية والصناديق
// ==========================================
function checkDailyReward() {
    const today = new Date().toDateString();
    const banner = document.getElementById('daily-reward-banner');
    if (player.lastDailyReward !== today) {
        banner.classList.remove('hidden');
    } else {
        banner.classList.add('hidden');
    }
}

function claimDailyReward() {
    player.lastDailyReward = new Date().toDateString();
    player.shards += 50;
    document.getElementById('daily-reward-banner').classList.add('hidden');
    updatePlayerHeaderUI();
    showToast("استلمت 50 شظية مجاناً!", "🎁");
}

function openCrate(type) {
    if (type === 'common') {
        if (player.shards < 100) return showToast("تحتاج إلى 100 شظية!", "⚠️");
        player.shards -= 100;
        showToast("فتحت الصندوق العادي وحصلت على لقب جديد!", "📦");
    } else {
        if (player.gems < 50) return showToast("تحتاج إلى 50 جوهرة!", "⚠️");
        player.gems -= 50;
        showToast("فتحت الصندوق الأسطوري وحصلت على إطار نادر!", "👑");
    }
    updatePlayerHeaderUI();
}

function buyShardsWithGems() {
    if (player.gems < 10) return showToast("لا تملك جواهر كافية!", "⚠️");
    player.gems -= 10;
    player.shards += 500;
    updatePlayerHeaderUI();
    showToast("تم شراء 500 شظية بنجاح!", "💎");
}

// ==========================================
// 9. تشغيل اللعبة الأولي عند التحميل
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('screen-splash').classList.add('hidden');
        navigateTo('home');
    }, 1800);
});
