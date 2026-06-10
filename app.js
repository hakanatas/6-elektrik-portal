// --- SES VE AUDIO YÖNETİMİ (Web Audio API) ---
let audioCtx = null;
let soundEnabled = true;

// Reosta Radyo Ses Üreteçleri
let radioOsc = null;
let radioNoise = null;
let radioGain = null;
let radioInterval = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Genel Tık Sesi (Chirp)
function playClickSound() {
  if (!soundEnabled) return;
  initAudio();
  try {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } catch (e) {
    console.log("Ses çalma hatası:", e);
  }
}

// Başarı Beep-Boop Sesi
function playSuccessSound() {
  if (!soundEnabled) return;
  initAudio();
  try {
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(330, t); // Mi
    osc.frequency.setValueAtTime(523, t + 0.1); // Do
    
    gainNode.gain.setValueAtTime(0.2, t);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(t + 0.35);
  } catch (e) {
    console.log("Ses çalma hatası:", e);
  }
}

// Hata/Başarısızlık Sesi (Buzzer)
function playFailureSound() {
  if (!soundEnabled) return;
  initAudio();
  try {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  } catch (e) {
    console.log("Ses çalma hatası:", e);
  }
}

// Piyano Notaları Frekans Haritası (C4 - A4)
const pianoNotes = {
  'ArrowLeft': 261.63,  // Do (C4)
  'ArrowUp': 293.66,    // Re (D4)
  'ArrowRight': 329.63, // Mi (E4)
  'ArrowDown': 349.23,  // Fa (F4)
  'Space': 392.00,      // Sol (G4)
  'Click': 440.00       // La (A4)
};

// Makey Makey Notalarını Çalma
function playMakeyNote(keyId) {
  if (!soundEnabled) return;
  initAudio();
  const freq = pianoNotes[keyId];
  if (!freq) return;

  try {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    // Neal.fun havasında retro 8-bit kare dalga tonu
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
    
    // Görsel efektleri tetikle
    highlightMakeyKey(keyId);
  } catch (e) {
    console.log("Nota çalınamadı:", e);
  }
}

// Sesi Aç/Kapat
function toggleSound() {
  soundEnabled = !soundEnabled;
  const statusText = document.getElementById("sound-status-text");
  const toggleBtn = document.getElementById("btn-sound-toggle");
  
  if (soundEnabled) {
    statusText.innerText = "Ses Açık";
    toggleBtn.querySelector(".btn-icon").innerText = "🔊";
    if (currentView === "reosta-lab") {
      startRadioSynth();
    }
  } else {
    statusText.innerText = "Ses Kapalı";
    toggleBtn.querySelector(".btn-icon").innerText = "🔇";
    stopRadioSynth();
  }
}


// --- REOSTA RADYO SES SENTEZLEYİCİ (Retro Synth & Noise) ---
function startRadioSynth() {
  if (!soundEnabled) return;
  initAudio();
  try {
    if (radioOsc) stopRadioSynth();
    
    radioGain = audioCtx.createGain();
    radioGain.connect(audioCtx.destination);
    
    // 1. Radyo Cızırtısı (White Noise)
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    radioNoise = audioCtx.createBufferSource();
    radioNoise.buffer = noiseBuffer;
    radioNoise.loop = true;
    
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.04, audioCtx.currentTime); // Hafif arka plan cızırtısı
    
    radioNoise.connect(noiseGain);
    noiseGain.connect(radioGain);
    radioNoise.start();
    
    // 2. Radyo Müzik Melodisi (8-Bit Retro Döngü)
    radioOsc = audioCtx.createOscillator();
    radioOsc.type = 'sine';
    
    const oscGain = audioCtx.createGain();
    oscGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    
    radioOsc.connect(oscGain);
    oscGain.connect(radioGain);
    radioOsc.start();
    
    // Basit bir melodik döngü (Radyo şarkısı)
    const melody = [261.63, 329.63, 392.00, 523.25, 440.00, 349.23, 392.00, 329.63];
    let noteIdx = 0;
    radioInterval = setInterval(() => {
      if (radioOsc && audioCtx) {
        radioOsc.frequency.setValueAtTime(melody[noteIdx], audioCtx.currentTime);
        noteIdx = (noteIdx + 1) % melody.length;
      }
    }, 350);
    
    // Reosta sürgüsüne göre ilk ses ayarı
    updateRadioVolume();
  } catch (e) {
    console.log("Radyo sentezlenemedi:", e);
  }
}

function stopRadioSynth() {
  try {
    if (radioNoise) {
      radioNoise.stop();
      radioNoise.disconnect();
      radioNoise = null;
    }
    if (radioOsc) {
      radioOsc.stop();
      radioOsc.disconnect();
      radioOsc = null;
    }
    if (radioInterval) {
      clearInterval(radioInterval);
      radioInterval = null;
    }
  } catch (e) {
    // ignore
  }
}

function updateRadioVolume() {
  if (!radioGain) return;
  const slider = document.getElementById("reosta-slider");
  if (!slider) return;
  
  // Reosta 2 Yönüne kaydırıldığında direnç azalır, akım ve ses artar (Görsel 6.2.12)
  // Sürgü 1 (sol) iken direnç maks, ses 0
  // Sürgü 100 (sağ) iken direnç min, ses maks
  const vol = slider.value / 100;
  
  if (soundEnabled) {
    radioGain.gain.setValueAtTime(vol * 0.8, audioCtx.currentTime);
  } else {
    radioGain.gain.setValueAtTime(0, audioCtx.currentTime);
  }
}


// --- SAYFA NAVİGASYONU (View Transitions API Entegrasyonu) ---
let currentView = "dashboard-view";

function navigateTo(viewId) {
  playClickSound();
  
  if (currentView === "sorting-game" && viewId !== "sorting-game") {
    endSortingGame("Oyundan ayrıldınız.");
  }
  
  // Hangi görünüm açıldıysa sesleri durdur/başlat
  if (viewId === "reosta-lab") {
    startRadioSynth();
  } else {
    stopRadioSynth();
  }
  
  if (viewId === "direnc-lab") {
    initResistanceLab();
  }
  
  const targetElement = document.getElementById(viewId);
  if (!targetElement) return;

  const updateDOM = () => {
    // Tüm görünümleri kapat
    document.getElementById("dashboard-view").style.display = "none";
    document.querySelectorAll(".view-container").forEach(el => {
      el.style.display = "none";
    });
    
    // Hedef görünümü aç
    if (viewId === "dashboard-view") {
      document.getElementById("dashboard-view").style.display = "block";
    } else {
      targetElement.style.display = "block";
    }
    currentView = viewId;
  };

  // View Transitions API Desteği Kontrolü
  if (!document.startViewTransition) {
    updateDOM();
    // Programatik odak yönetimi (Erişilebilirlik)
    routeFocus(viewId);
  } else {
    const transition = document.startViewTransition(() => updateDOM());
    transition.finished.finally(() => {
      routeFocus(viewId);
    });
  }
}

function showDashboard() {
  navigateTo("dashboard-view");
}

function routeFocus(viewId) {
  if (viewId === "dashboard-view") {
    document.querySelector(".dashboard-intro h2")?.focus();
  } else if (viewId === "iletken-lab") {
    document.getElementById("iletken-heading")?.focus();
  } else if (viewId === "makey-lab") {
    document.getElementById("makey-heading")?.focus();
  } else if (viewId === "direnc-lab") {
    document.getElementById("direnc-heading")?.focus();
  } else if (viewId === "reosta-lab") {
    document.getElementById("reosta-heading")?.focus();
  } else if (viewId === "resist-o-lab") {
    document.getElementById("resist-heading")?.focus();
  } else if (viewId === "sorting-game") {
    document.getElementById("sorting-heading")?.focus();
  } else if (viewId === "makey-projects") {
    document.getElementById("projects-heading")?.focus();
  } else if (viewId === "calisma-kagidi") {
    document.getElementById("worksheet-heading")?.focus();
  } else if (viewId === "ders-plani") {
    document.getElementById("plan-heading")?.focus();
  }
}


// --- MODÜL 1: İLETKEN VE YALITKAN LAB MANTIĞI ---
function initDragAndDrop() {
  const dropTarget = document.getElementById("drop-target");
  const materialItems = document.querySelectorAll(".material-item");

  materialItems.forEach(item => {
    item.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", item.id);
      item.style.opacity = "0.4";
    });

    item.addEventListener("dragend", () => {
      item.style.opacity = "1";
    });
  });

  dropTarget.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropTarget.classList.add("dragover");
  });

  dropTarget.addEventListener("dragleave", () => {
    dropTarget.classList.remove("dragover");
  });

  dropTarget.addEventListener("drop", (e) => {
    e.preventDefault();
    dropTarget.classList.remove("dragover");
    
    const matId = e.dataTransfer.getData("text/plain");
    const matEl = document.getElementById(matId);
    if (!matEl) return;
    
    // Lab1 test işlemi
    testMaterialInLab1(matEl);
  });
}

function testMaterialInLab1(matEl) {
  const isConductive = matEl.getAttribute("data-conductive") === "true";
  const matName = matEl.getAttribute("data-name");
  const matType = matEl.getAttribute("data-type");
  const dropTarget = document.getElementById("drop-target");
  const labBulb = document.getElementById("lab-bulb");
  const labBulbIcon = document.getElementById("lab-bulb-icon");
  const feedbackPanel = document.getElementById("lab-feedback-panel");
  
  // Test gap alanını doldur
  dropTarget.innerHTML = `<strong>${matEl.innerHTML}</strong>`;
  
  if (isConductive) {
    // Ampulü Yak
    labBulbIcon.innerText = "💡";
    labBulbIcon.style.textShadow = "0 0 40px #fde047, 0 0 70px #f59e0b";
    labBulb.style.borderColor = "var(--color-success)";
    
    // Geri bildirim
    feedbackPanel.innerHTML = `🌟 <strong>Harika!</strong> <code>${matName}</code> bir <strong>İletken</strong> maddedir. Elektrik akımı geçebildiği için ampul yandı!`;
    feedbackPanel.style.borderColor = "var(--color-success)";
    feedbackPanel.style.backgroundColor = "var(--color-success-light)";
    
    playSuccessSound();
  } else {
    // Ampulü Söndür
    labBulbIcon.innerText = "⚫";
    labBulbIcon.style.textShadow = "none";
    labBulb.style.borderColor = "var(--color-danger)";
    
    // Geri bildirim
    feedbackPanel.innerHTML = `❌ <strong>Dikkat!</strong> <code>${matName}</code> bir <strong>Yalıtkan</strong> maddedir. Elektrik akımının geçişini engellediği için ampul sönük kaldı.`;
    feedbackPanel.style.borderColor = "var(--color-danger)";
    feedbackPanel.style.backgroundColor = "var(--color-danger-light)";
    
    playFailureSound();
  }
}

function resetLab1() {
  playClickSound();
  const dropTarget = document.getElementById("drop-target");
  const labBulbIcon = document.getElementById("lab-bulb-icon");
  const labBulb = document.getElementById("lab-bulb");
  const feedbackPanel = document.getElementById("lab-feedback-panel");
  
  dropTarget.innerHTML = "Maddeleri Buraya Sürükle";
  labBulbIcon.innerText = "💡";
  labBulbIcon.style.textShadow = "none";
  labBulb.style.borderColor = "var(--border-color)";
  
  feedbackPanel.innerHTML = "💡 <strong>Nasıl Oynanır?</strong> Sağ paneldeki katı ve sıvı maddeleri devredeki test alanına sürükle-bırak yap.";
  feedbackPanel.style.borderColor = "var(--border-color)";
  feedbackPanel.style.backgroundColor = "#fff";
}


// --- MODÜL 2: SANAL MAKEY MAKEY MANTIĞI ---
function highlightMakeyKey(keyId) {
  // SVG üzerindeki tuşu aydınlat
  const svgKey = document.getElementById(`mk-${keyId}`);
  if (svgKey) {
    svgKey.classList.add("active");
    setTimeout(() => svgKey.classList.remove("active"), 300);
  }
  
  // HTML üzerindeki piyano tuşunu aydınlat
  const htmlKey = document.getElementById(`pk-${keyId}`);
  if (htmlKey) {
    htmlKey.classList.add("active");
    setTimeout(() => htmlKey.classList.remove("active"), 300);
  }
}

// Klavye Olay Dinleyicileri
window.addEventListener("keydown", (e) => {
  if (currentView === "makey-lab") {
    let keyMapped = null;
    if (e.key === "ArrowLeft") keyMapped = "ArrowLeft";
    else if (e.key === "ArrowUp") keyMapped = "ArrowUp";
    else if (e.key === "ArrowRight") keyMapped = "ArrowRight";
    else if (e.key === "ArrowDown") keyMapped = "ArrowDown";
    else if (e.key === " " || e.code === "Space") {
      keyMapped = "Space";
      e.preventDefault(); // Sayfanın kaymasını önle
    }
    
    if (keyMapped) {
      playMakeyNote(keyMapped);
    }
  } else if (currentView === "sorting-game") {
    if (e.key === "ArrowLeft") {
      sortFallingItem('iletken');
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      sortFallingItem('yalitkan');
      e.preventDefault();
    }
  }
});


// --- MODÜL 3: ELEKTRİKSEL DİRENÇ LAB SİMÜLASYONU ---
let resistanceState = {
  material: 'bakir', // veya 'demir'
  length: 10,
  thickness: 2
};

let microCanvas = null;
let microCtx = null;
let electronParticles = [];
let animFrameId = null;

function initResistanceLab() {
  const view = document.getElementById("micro-view-box");
  view.innerHTML = `<canvas id="micro-canvas" width="600" height="200" style="width:100%; height:100%; display:block;"></canvas>`;
  microCanvas = document.getElementById("micro-canvas");
  microCtx = microCanvas.getContext("2d");
  
  // İlk elektron taneciklerini yarat
  electronParticles = [];
  for (let i = 0; i < 40; i++) {
    electronParticles.push({
      x: Math.random() * microCanvas.width,
      y: Math.random() * (microCanvas.height - 40) + 20,
      speed: Math.random() * 2 + 1
    });
  }
  
  // Simülasyon döngüsünü başlat
  if (animFrameId) cancelAnimationFrame(animFrameId);
  runResistanceLoop();
}

function setWireType(type) {
  playClickSound();
  resistanceState.material = type;
  
  document.getElementById("wire-bakir").classList.remove("active");
  document.getElementById("wire-demir").classList.remove("active");
  
  document.getElementById(`wire-${type}`).classList.add("active");
  
  const expl = document.getElementById("type-explanation");
  if (type === 'bakir') {
    expl.innerText = "Bakırın/Gümüşün elektriksel direnci düşüktür, akım rahat geçer.";
  } else {
    expl.innerText = "Demirin direnci yüksektir, elektron geçişi zorlaşır ve enerji ısıya dönüşür.";
  }
  
  updateResistanceSimulation();
}

function updateResistanceSimulation() {
  const lengthSlider = document.getElementById("slider-length");
  const thicknessSlider = document.getElementById("slider-thickness");
  
  resistanceState.length = parseInt(lengthSlider.value);
  resistanceState.thickness = parseInt(thicknessSlider.value);
  
  document.getElementById("val-length").innerText = resistanceState.length;
  document.getElementById("val-thickness").innerText = resistanceState.thickness;
  
  // Direnç Hesaplama (Basit R = rho * L / S mantığı)
  // Öz direnç (rho): Bakır = 1, Demir = 4
  const rho = (resistanceState.material === 'bakir') ? 0.1 : 0.45;
  const resistance = (rho * resistanceState.length) / resistanceState.thickness;
  
  document.getElementById("total-resistance-val").innerText = `${resistance.toFixed(2)} Ω (Ohm)`;
  
  // Ampul Parlaklığı (Direnç arttıkça akım azalır, V=I*R)
  // Akım I = V / R. Voltajımız 3V olsun.
  const current = 3 / (resistance + 0.5); // 0.5 pil/duy iç direnci olsun
  const maxCurrent = 3 / 0.7; // Minimum dirençteki akım
  const glowPercent = Math.min(100, Math.round((current / maxCurrent) * 100));
  
  document.getElementById("glow-percent").innerText = `Parlaklık: %${glowPercent}`;
  
  // Ampul görsel parıltı efekti
  const bulb = document.getElementById("simulation-bulb");
  if (glowPercent === 0) {
    bulb.innerText = "⚫";
    bulb.style.textShadow = "none";
  } else {
    bulb.innerText = "💡";
    const shadowSize = glowPercent * 0.4;
    const opacity = glowPercent / 100;
    bulb.style.textShadow = `0 0 ${shadowSize}px rgba(253, 224, 71, ${opacity}), 0 0 ${shadowSize * 1.5}px rgba(245, 158, 11, ${opacity})`;
  }
}

// Mikroskobik Animasyon Döngüsü
function runResistanceLoop() {
  if (currentView !== "direnc-lab") {
    animFrameId = requestAnimationFrame(runResistanceLoop);
    return;
  }
  
  const w = microCanvas.width;
  const h = microCanvas.height;
  
  // Arka planı temizle
  microCtx.fillStyle = "#0f172a";
  microCtx.fillRect(0, 0, w, h);
  
  // Direnç ve akım hesaplama verilerini al
  const rho = (resistanceState.material === 'bakir') ? 0.1 : 0.45;
  const resistance = (rho * resistanceState.length) / resistanceState.thickness;
  const current = 3 / (resistance + 0.5);
  
  // 1. Atom Çekirdeklerini Çiz (Atomlar dirence bağlı olarak titreşir - ısı yayar)
  const cols = 10;
  const rows = 4;
  const colSpacing = w / cols;
  const rowSpacing = h / rows;
  const vibration = resistance * 1.5; // Direnç arttıkça atomların titreşimi (sıcaklık) artar
  
  microCtx.fillStyle = "rgba(239, 68, 68, 0.8)";
  for (let c = 1; c < cols; c++) {
    for (let r = 1; r < rows; r++) {
      // Rastgele küçük titreşim
      const dx = (Math.random() - 0.5) * vibration;
      const dy = (Math.random() - 0.5) * vibration;
      
      const x = c * colSpacing + dx;
      const y = r * rowSpacing + dy;
      
      // Çekirdek
      microCtx.beginPath();
      // Kesit alanına göre atom büyüklüğü (Kanal daraldığında atomlar sıkışık görünür)
      const atomRadius = 14 - (resistanceState.thickness * 1.2);
      microCtx.arc(x, y, atomRadius, 0, Math.PI * 2);
      microCtx.fill();
      microCtx.strokeStyle = "#b91c1c";
      microCtx.stroke();
    }
  }
  
  // 2. Elektronları Hareket Ettir ve Çiz
  // Hız akımla doğru orantılıdır
  const flowSpeed = current * 2;
  
  microCtx.fillStyle = "#60a5fa";
  microCtx.shadowBlur = 8;
  microCtx.shadowColor = "#3b82f6";
  
  electronParticles.forEach(p => {
    // Sağa doğru akış
    p.x += (p.speed * flowSpeed * 0.4);
    
    // Küçük dikey salınım
    p.y += (Math.random() - 0.5) * 2;
    
    // Telin dışına taşmasını engelle
    if (p.y < 15) p.y = 15;
    if (p.y > h - 15) p.y = h - 15;
    
    // Sağdan çıkınca soldan gir
    if (p.x > w) {
      p.x = 0;
      p.y = Math.random() * (h - 40) + 20;
    }
    
    // Çizim
    microCtx.beginPath();
    microCtx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    microCtx.fill();
  });
  
  // Shadow sıfırla
  microCtx.shadowBlur = 0;
  
  animFrameId = requestAnimationFrame(runResistanceLoop);
}


// --- MODÜL 4: REOSTA SİMÜLATÖRÜ ---
function updateReosta() {
  const slider = document.getElementById("reosta-slider");
  const val = slider.value;
  
  // Ampul parlaklığını güncelle
  const reostaBulb = document.getElementById("reosta-bulb");
  const reostaBulbText = document.getElementById("reosta-bulb-text");
  
  // Reosta 2 Yönüne çekilirse direnç azalır, akım ve parlaklık artar (Görsel 6.2.12)
  reostaBulbText.innerText = `Parlaklık: %${val}`;
  
  if (val == 0) {
    reostaBulb.innerText = "⚫";
    reostaBulb.style.textShadow = "none";
    reostaBulb.style.transform = "scale(1)";
  } else {
    reostaBulb.innerText = "💡";
    const shadowSize = val * 0.4;
    const opacity = val / 100;
    reostaBulb.style.textShadow = `0 0 ${shadowSize}px rgba(253, 224, 71, ${opacity}), 0 0 ${shadowSize * 1.5}px rgba(245, 158, 11, ${opacity})`;
    reostaBulb.style.transform = `scale(${1 + (val / 500)})`;
  }
  
  // Radyo Sesini Güncelle
  updateRadioVolume();
  
  const radioVolText = document.getElementById("radio-vol-text");
  if (radioVolText) {
    radioVolText.innerText = `Ses Düzeyi: %${val}`;
  }
  
  // Hoparlör titreşim dalgalarını tetikle
  const speaker = document.getElementById("radio-speaker-container");
  const wave1 = document.getElementById("sound-wave-1");
  const wave2 = document.getElementById("sound-wave-2");
  
  if (val > 10 && soundEnabled) {
    wave1.style.display = "block";
    wave2.style.display = "block";
    // Hıza göre animasyon frekansı
    const delay = (1.5 - (val / 100)) + "s";
    wave1.style.animationDuration = delay;
    wave2.style.animationDuration = delay;
    speaker.style.transform = `scale(${1 + (val / 1000) * Math.sin(Date.now() / 50)})`;
  } else {
    wave1.style.display = "none";
    wave2.style.display = "none";
    speaker.style.transform = "scale(1)";
  }
}


// --- MODÜL 5: KENDİ TELİNİ TASARLA (RESIST-O-LAB) ---
let resistState = {
  activeChallenge: 'toaster', // 'toaster', 'rocket', 'fuse'
  slots: ['bakir', 'bakir', 'bakir', 'bakir', 'bakir'],
  isSimulating: false,
  fuseVoltage: 50,
  animFrameId: null,
  currentI: 0,
  currentT: 20,
  rocketCharge: 0,
  fuseMelted: false,
  meltedAtVoltage: 0,
  challengeCompleted: false,
  challengeFailed: false,
  electrons: []
};

const resistMaterials = {
  'bakir': { name: 'Bakır', icon: '⚡', R: 1.0, colorClass: 'bakir' },
  'altin': { name: 'Altın', icon: '👑', R: 0.5, colorClass: 'altin' },
  'demir': { name: 'Demir', icon: '🔩', R: 5.0, colorClass: 'demir' },
  'tahta': { name: 'Tahta', icon: '🪵', R: 9999.0, colorClass: 'tahta' }
};

function initResistLab() {
  selectResistChallenge('toaster');
}

function selectResistChallenge(challengeId) {
  stopResistSimulation();
  
  playClickSound();
  resistState.activeChallenge = challengeId;
  
  // Update challenge card styles
  document.querySelectorAll('.challenge-card').forEach(card => {
    card.classList.remove('active');
  });
  document.getElementById(`chall-${challengeId}`)?.classList.add('active');
  
  // Update task labels
  const titleEl = document.getElementById('resist-task-title');
  const feedEl = document.getElementById('resist-feedback');
  if (feedEl) feedEl.innerText = 'Tasarımınızı test etmek için "DEVREYİ ÇALIŞTIR" butonuna basın.';
  
  // Show/Hide illustrations & settings
  const illToaster = document.getElementById('ill-toaster');
  const illRocket = document.getElementById('ill-rocket');
  const illFuse = document.getElementById('ill-fuse');
  const fuseCtrl = document.getElementById('fuse-voltage-control');
  const tempBox = document.getElementById('temp-stat-box');
  const tempLabel = document.getElementById('temp-stat-label');
  
  if (illToaster) illToaster.style.display = 'none';
  if (illRocket) illRocket.style.display = 'none';
  if (illFuse) illFuse.style.display = 'none';
  if (fuseCtrl) fuseCtrl.style.display = 'none';
  if (tempBox) tempBox.style.display = 'block';
  if (tempLabel) tempLabel.innerText = 'Sıcaklık';
  
  // Reset outputs
  const bread = document.getElementById('toaster-bread');
  if (bread) {
    bread.style.transform = 'translateY(0)';
    bread.style.backgroundColor = '#fbcfe8'; // Pink uncooked bread
  }
  const steam = document.getElementById('toast-steam');
  if (steam) steam.style.opacity = '0';
  
  const rocket = document.getElementById('rocket-sprite');
  if (rocket) {
    rocket.style.transform = 'translateY(0) scale(1)';
  }
  const smoke = document.getElementById('rocket-smoke');
  if (smoke) smoke.style.opacity = '0';
  
  const pc = document.getElementById('pc-screen');
  if (pc) {
    pc.innerText = '💻 KAPALI';
    pc.style.backgroundColor = '#000000';
    pc.style.color = '#ffffff';
  }
  
  if (challengeId === 'toaster') {
    if (titleEl) titleEl.innerText = 'Görev: Ekmek Kızartıcı';
    if (illToaster) illToaster.style.display = 'flex';
  } else if (challengeId === 'rocket') {
    if (titleEl) titleEl.innerText = 'Görev: Fırlatma Rampası';
    if (illRocket) illRocket.style.display = 'flex';
    if (tempLabel) tempLabel.innerText = 'Motor Gücü';
    const tempVal = document.getElementById('stat-temp');
    if (tempVal) tempVal.innerText = '%0';
  } else if (challengeId === 'fuse') {
    if (titleEl) titleEl.innerText = 'Görev: Güvenli Ev Sigortası';
    if (illFuse) illFuse.style.display = 'flex';
    if (fuseCtrl) fuseCtrl.style.display = 'block';
    
    // Set fuse initial slider values
    const slider = document.getElementById('fuse-voltage-slider');
    if (slider) slider.value = 50;
    const voltsVal = document.getElementById('fuse-volts-val');
    if (voltsVal) voltsVal.innerText = '50 Volt';
    resistState.fuseVoltage = 50;
    
    if (pc) pc.innerText = '💻 50V NORMAL';
  }
  
  // Reset gauges display
  const iEl = document.getElementById('stat-current');
  if (iEl) iEl.innerText = '0.0 A';
  const tEl = document.getElementById('stat-temp');
  if (tEl && challengeId !== 'rocket') tEl.innerText = '20 °C';
  
  updateResistStats();
}

function cycleSlotMaterial(index) {
  if (resistState.isSimulating) return;
  
  playClickSound();
  const current = resistState.slots[index];
  const matKeys = Object.keys(resistMaterials);
  const nextIndex = (matKeys.indexOf(current) + 1) % matKeys.length;
  const nextMaterial = matKeys[nextIndex];
  
  resistState.slots[index] = nextMaterial;
  
  // Update visual slot card
  const slotEl = document.getElementById(`wslot-${index}`);
  if (slotEl) {
    // Clear old classes
    matKeys.forEach(k => slotEl.classList.remove(k));
    slotEl.classList.add(nextMaterial);
    
    const iconEl = slotEl.querySelector('.wire-slot-icon');
    const labelEl = slotEl.querySelector('.wire-slot-label');
    const mat = resistMaterials[nextMaterial];
    if (iconEl) iconEl.innerText = mat.icon;
    if (labelEl) labelEl.innerText = mat.name;
  }
  
  updateResistStats();
}

function updateResistStats() {
  let totalR = 0;
  let hasInsulator = false;
  
  resistState.slots.forEach(matKey => {
    const mat = resistMaterials[matKey];
    totalR += mat.R;
    if (matKey === 'tahta') {
      hasInsulator = true;
    }
  });
  
  // Cap resistance display
  const rEl = document.getElementById('stat-resistance');
  if (rEl) {
    if (hasInsulator) {
      rEl.innerText = '∞ Ω (Açık)';
    } else {
      rEl.innerText = `${totalR.toFixed(1)} Ω`;
    }
  }
  
  return { totalR, hasInsulator };
}

function updateFuseVoltage() {
  const slider = document.getElementById('fuse-voltage-slider');
  const voltsVal = document.getElementById('fuse-volts-val');
  if (slider && voltsVal) {
    resistState.fuseVoltage = parseInt(slider.value);
    voltsVal.innerText = `${resistState.fuseVoltage} Volt`;
  }
  playClickSound();
}

function stopResistSimulation() {
  resistState.isSimulating = false;
  if (resistState.animFrameId) {
    cancelAnimationFrame(resistState.animFrameId);
    resistState.animFrameId = null;
  }
  
  const btn = document.getElementById('btn-run-resist');
  if (btn) btn.innerText = 'DEVREYİ ÇALIŞTIR ⚡';
  
  // Clear electrons
  const container = document.getElementById('electron-flow-container');
  if (container) container.innerHTML = '';
  resistState.electrons = [];
  
  // Remove glowing classes
  document.querySelectorAll('.wire-slot-card.demir').forEach(card => {
    card.classList.remove('glowing');
  });
  const glowLine = document.getElementById('resist-wire-glow');
  if (glowLine) {
    glowLine.style.transform = 'translateY(-50%) scaleY(0)';
  }
}

function runResistSimulation() {
  if (resistState.isSimulating) {
    stopResistSimulation();
    return;
  }
  
  playClickSound();
  resistState.isSimulating = true;
  const btn = document.getElementById('btn-run-resist');
  if (btn) btn.innerText = 'DURDUR ⏹️';
  
  // Reset simulation variables
  resistState.currentI = 0;
  resistState.currentT = 20;
  resistState.rocketCharge = 0;
  resistState.fuseMelted = false;
  resistState.meltedAtVoltage = 0;
  resistState.challengeCompleted = false;
  resistState.challengeFailed = false;
  
  // Spawn electron particles
  spawnElectrons();
  
  // Reset outputs
  const bread = document.getElementById('toaster-bread');
  if (bread) {
    bread.style.transform = 'translateY(0)';
    bread.style.backgroundColor = '#fbcfe8';
  }
  const steam = document.getElementById('toast-steam');
  if (steam) steam.style.opacity = '0';
  
  const rocket = document.getElementById('rocket-sprite');
  if (rocket) {
    rocket.style.transform = 'translateY(0) scale(1)';
  }
  const smoke = document.getElementById('rocket-smoke');
  if (smoke) smoke.style.opacity = '0';
  
  const pc = document.getElementById('pc-screen');
  if (pc) {
    if (resistState.activeChallenge === 'fuse') {
      pc.innerText = `💻 ${resistState.fuseVoltage}V SİSTEM`;
      pc.style.backgroundColor = '#000000';
    } else {
      pc.innerText = '💻 KAPALI';
      pc.style.backgroundColor = '#000000';
    }
  }
  
  // Start loop
  resistState.animFrameId = requestAnimationFrame(simLoop);
}

function simLoop() {
  if (!resistState.isSimulating) return;
  
  // 1. Calculate physics values in real-time
  const { totalR, hasInsulator } = updateResistStats();
  
  let V = 100;
  if (resistState.activeChallenge === 'fuse') {
    V = resistState.fuseVoltage;
  }
  
  // If fuse is melted, circuit is cut
  let I = 0;
  if (!hasInsulator && !resistState.fuseMelted) {
    I = V / totalR;
  }
  
  let demirCount = resistState.slots.filter(s => s === 'demir').length;
  let targetT = 20;
  if (I > 0) {
    if (resistState.activeChallenge === 'toaster') {
      targetT = 20 + I * demirCount * 12.5;
    } else if (resistState.activeChallenge === 'fuse') {
      targetT = 20 + (I * I) * totalR * 0.15;
    }
  }
  
  // Smoothly interpolate current and temperature
  resistState.currentI += (I - resistState.currentI) * 0.1;
  resistState.currentT += (targetT - resistState.currentT) * 0.1;
  
  // Update UI Gauges
  const rEl = document.getElementById('stat-resistance');
  const iEl = document.getElementById('stat-current');
  const tEl = document.getElementById('stat-temp');
  
  if (rEl) {
    rEl.innerText = hasInsulator ? '∞ Ω (Açık)' : `${totalR.toFixed(1)} Ω`;
  }
  if (iEl) {
    iEl.innerText = `${resistState.currentI.toFixed(1)} A`;
  }
  
  if (tEl) {
    if (resistState.activeChallenge === 'rocket') {
      const chargePct = hasInsulator ? 0 : Math.max(0, Math.min(100, (3.0 / totalR) * 100));
      resistState.rocketCharge += (chargePct - resistState.rocketCharge) * 0.1;
      tEl.innerText = `%${Math.round(resistState.rocketCharge)}`;
    } else {
      tEl.innerText = `${Math.round(resistState.currentT)} °C`;
    }
  }
  
  // Update wire glow based on temperature
  const glowLine = document.getElementById('resist-wire-glow');
  if (glowLine) {
    if (resistState.currentT > 50 && demirCount > 0) {
      glowLine.style.transform = 'translateY(-50%) scaleY(1)';
      if (resistState.currentT > 250) {
        glowLine.style.backgroundColor = '#ef4444'; // Red
      } else {
        glowLine.style.backgroundColor = '#f59e0b'; // Orange
      }
      
      // Make iron slots glow
      document.querySelectorAll('.wire-slot-card.demir').forEach(card => {
        card.classList.add('glowing');
      });
    } else {
      glowLine.style.transform = 'translateY(-50%) scaleY(0)';
      document.querySelectorAll('.wire-slot-card.demir').forEach(card => {
        card.classList.remove('glowing');
      });
    }
  }
  
  // Update electron positions
  updateElectronPositions(resistState.currentI);
  
  // Check conditions/evaluations
  const feedEl = document.getElementById('resist-feedback');
  
  if (resistState.activeChallenge === 'toaster') {
    const bread = document.getElementById('toaster-bread');
    const steam = document.getElementById('toast-steam');
    
    if (hasInsulator) {
      if (feedEl) feedEl.innerHTML = '<span style="color:var(--color-danger)">❌ Devre Kesik (Tahta blok akımı engelliyor). Ekmek kızaramadı!</span>';
    } else if (targetT >= 150 && targetT <= 250 && resistState.currentT >= 150) {
      if (feedEl && !resistState.challengeCompleted) {
        feedEl.innerHTML = '<span style="color:var(--color-success)">🎉 Başarılı! Ekmek harika kızardı ve çıtır çıtır oldu! 🥪</span>';
        playSuccessSound();
        resistState.challengeCompleted = true;
      }
      if (bread) {
        bread.style.transform = 'translateY(-45px)';
        bread.style.backgroundColor = '#d97706'; // Golden brown
      }
      if (steam) steam.style.opacity = '0.8';
    } else if (resistState.currentT < 150 && targetT <= 250) {
      if (feedEl) feedEl.innerText = 'Telin ısınması bekleniyor... (Direnci artırmak için demir bloklar ekleyin)';
    } else if (resistState.currentT > 250 || targetT > 250) {
      // Burned!
      if (feedEl && !resistState.challengeFailed) {
        feedEl.innerHTML = '<span style="color:var(--color-danger)">🔥 Ekmek yandı! Tel aşırı ısındı ve ekmek kömür oldu! (Demiri azaltın)</span>';
        playFailureSound();
        resistState.challengeFailed = true;
      }
      if (bread) {
        bread.style.transform = 'translateY(-45px)';
        bread.style.backgroundColor = '#1e293b'; // Burnt black
      }
      if (steam) steam.style.opacity = '0';
    }
  }
  
  else if (resistState.activeChallenge === 'rocket') {
    const rocket = document.getElementById('rocket-sprite');
    const smoke = document.getElementById('rocket-smoke');
    
    if (hasInsulator) {
      if (feedEl) feedEl.innerHTML = '<span style="color:var(--color-danger)">❌ Devre kesik. Roket motorları enerjisiz!</span>';
    } else if (totalR <= 3.0) {
      if (feedEl && !resistState.challengeCompleted) {
        feedEl.innerHTML = `<span style="color:var(--color-success)">🚀 Başarılı! Roket motorları ateşlendi! UZAYA!</span>`;
        playSuccessSound();
        resistState.challengeCompleted = true;
      }
      if (rocket) {
        rocket.style.transform = 'translateY(-180px) scale(0.6)';
      }
      if (smoke) smoke.style.opacity = '0.9';
    } else {
      if (feedEl) feedEl.innerText = `Motor gücü yetersiz (Direnci azaltmak için bakır/altın ekleyin). Mevcut direnç: ${totalR.toFixed(1)}Ω`;
    }
  }
  
  else if (resistState.activeChallenge === 'fuse') {
    const pc = document.getElementById('pc-screen');
    
    if (hasInsulator) {
      if (feedEl) feedEl.innerHTML = '<span style="color:var(--color-danger)">❌ Devre yalıtkan yüzünden çalışmıyor!</span>';
      if (pc) pc.innerText = '💻 KAPALI';
    } else if (resistState.fuseMelted) {
      if (resistState.meltedAtVoltage === 120) {
        if (feedEl && !resistState.challengeCompleted) {
          feedEl.innerHTML = `<span style="color:var(--color-success)">🎉 Başarılı! Yüksek voltajda sigorta eridi, bilgisayar korundu! 🛡️</span>`;
          playSuccessSound();
          resistState.challengeCompleted = true;
        }
        if (pc) {
          pc.innerText = '💻 SİSTEM KORUNDU';
          pc.style.backgroundColor = '#3b82f6';
          pc.style.color = '#ffffff';
        }
      } else {
        // Melted at 50V
        if (feedEl && !resistState.challengeFailed) {
          feedEl.innerHTML = `<span style="color:var(--color-danger)">❌ Başarısız! Sigorta normal gerilimde (50V) eridi. Direnci artırın!</span>`;
          playFailureSound();
          resistState.challengeFailed = true;
        }
        if (pc) {
          pc.innerText = '💥 SİGORTA ERİDİ';
          pc.style.backgroundColor = '#ef4444';
        }
      }
    } else {
      // Not melted yet
      if (resistState.currentI >= 10.0) {
        resistState.fuseMelted = true;
        resistState.meltedAtVoltage = V;
        playClickSound(); // Snap sound
      } else {
        if (V === 50) {
          if (feedEl) feedEl.innerHTML = '<span style="color:var(--color-warning)">🛡️ 50V Altında Sistem Güvenli. Şimdi voltajı 120V yaparak test edin!</span>';
          if (pc) {
            pc.innerText = '💻 50V ÇALIŞIYOR';
            pc.style.backgroundColor = '#22c55e';
            pc.style.color = '#ffffff';
          }
        } else if (V === 120) {
          if (feedEl && !resistState.challengeFailed) {
            feedEl.innerHTML = `<span style="color:var(--color-danger)">❌ Faciayla Bitti! Yüksek voltajda sigorta erimedi, bilgisayar yandı! (Direnci düşürün!)</span>`;
            playFailureSound();
            resistState.challengeFailed = true;
          }
          if (pc) {
            pc.innerText = '🔥 EXPIRED / YANDI';
            pc.style.backgroundColor = '#7f1d1d';
            pc.style.color = '#ffffff';
          }
        }
      }
    }
  }
  
  resistState.animFrameId = requestAnimationFrame(simLoop);
}

function spawnElectrons() {
  const container = document.getElementById('electron-flow-container');
  if (!container) return;
  container.innerHTML = '';
  
  const dotCount = 10;
  resistState.electrons = [];
  
  for (let i = 0; i < dotCount; i++) {
    const dot = document.createElement('div');
    dot.className = 'electron-flow-dot';
    container.appendChild(dot);
    resistState.electrons.push({
      el: dot,
      pos: (i / dotCount) * 100
    });
  }
}

function updateElectronPositions(current) {
  if (!resistState.electrons || resistState.electrons.length === 0) return;
  
  const speed = current * 0.15; // Speed proportional to current
  resistState.electrons.forEach(d => {
    d.pos += speed;
    if (d.pos > 100) d.pos = 0;
    d.el.style.left = `${d.pos}%`;
  });
}

function resetResistLab() {
  stopResistSimulation();
  playClickSound();
  
  resistState.slots = ['bakir', 'bakir', 'bakir', 'bakir', 'bakir'];
  
  for (let i = 0; i < 5; i++) {
    const slotEl = document.getElementById(`wslot-${i}`);
    if (slotEl) {
      Object.keys(resistMaterials).forEach(k => slotEl.classList.remove(k));
      slotEl.classList.add('bakir');
      
      const iconEl = slotEl.querySelector('.wire-slot-icon');
      const labelEl = slotEl.querySelector('.wire-slot-label');
      if (iconEl) iconEl.innerText = '⚡';
      if (labelEl) labelEl.innerText = 'Bakır';
    }
  }
  
  selectResistChallenge(resistState.activeChallenge);
}


// --- MODÜL 7: ÇALIŞMA KAĞIDI MANTIĞI ---
let worksheetAnswers = {
  q1: null,
  q2: null,
  q3: null,
  q4: null
};

const correctWorksheetAnswers = {
  q1: 'D',
  q2: 'A',
  q3: 'B',
  q4: 'A'
};

function selectOption(qId, val) {
  playClickSound();
  worksheetAnswers[qId] = val;
  
  // Önceki seçim stillerini kaldır
  const qContainer = document.querySelector(`[data-q-id="${qId}"]`);
  qContainer.querySelectorAll(".option-item").forEach(el => {
    el.classList.remove("selected");
  });
  
  // Seçilen şıkkı işaretle
  const selectedEl = qContainer.querySelector(`[data-val="${val}"]`);
  if (selectedEl) {
    selectedEl.classList.add("selected");
  }
}

function checkWorksheetAnswers() {
  // Check if all answered first to prevent cheat exploits
  for (let qId in correctWorksheetAnswers) {
    if (!worksheetAnswers[qId]) {
      alert("Lütfen tüm soruları yanıtlayın!");
      return;
    }
  }
  
  let score = 0;
  
  // Her soruyu kontrol et
  for (let qId in correctWorksheetAnswers) {
    const userAnswer = worksheetAnswers[qId];
    const correctAnswer = correctWorksheetAnswers[qId];
    const qContainer = document.querySelector(`[data-q-id="${qId}"]`);
    
    qContainer.querySelectorAll(".option-item").forEach(el => {
      el.classList.remove("selected", "correct", "wrong");
      const optVal = el.getAttribute("data-val");
      
      if (optVal === correctAnswer) {
        el.classList.add("correct");
      } else if (optVal === userAnswer) {
        el.classList.add("wrong");
      }
    });
    
    if (userAnswer === correctAnswer) {
      score += 25;
    }
  }
  
  const scorePanel = document.getElementById("worksheet-score-panel");
  scorePanel.style.display = "block";
  scorePanel.innerHTML = `🏆 <strong>Değerlendirme Sonucu:</strong> Toplam Puanınız <strong>${score} / 100</strong>.`;
  
  if (score === 100) {
    scorePanel.innerHTML += " Mükemmel! Konuyu tamamen anlamışsınız. 🌟";
    scorePanel.style.borderColor = "var(--color-success)";
    scorePanel.style.backgroundColor = "var(--color-success-light)";
    playSuccessSound();
  } else {
    scorePanel.innerHTML += " Yanlış cevaplarınızı ve konu anlatımlarını tekrar gözden geçirin.";
    scorePanel.style.borderColor = "var(--color-warning)";
    scorePanel.style.backgroundColor = "var(--color-warning-light)";
    playFailureSound();
  }
}

function resetWorksheet() {
  playClickSound();
  worksheetAnswers = { q1: null, q2: null, q3: null, q4: null };
  
  document.querySelectorAll(".option-item").forEach(el => {
    el.classList.remove("selected", "correct", "wrong");
  });
  
  const scorePanel = document.getElementById("worksheet-score-panel");
  scorePanel.style.display = "none";
}


// --- MODÜL 8: ÖĞRETMEN DERS PLANI SEKME KONTROLÜ ---
function switchLessonTab(tabId) {
  playClickSound();
  
  // Tüm sekmeleri inaktif yap
  document.querySelectorAll(".lesson-tab").forEach(tab => {
    tab.classList.remove("active");
  });
  
  // Tüm panelleri gizle
  document.querySelectorAll(".lesson-content-pane").forEach(pane => {
    pane.classList.remove("active");
  });
  
  // Aktif sekmeyi ve paneli göster
  document.querySelector(`[data-tab="${tabId}"]`).classList.add("active");
  document.getElementById(`tab-${tabId}`).classList.add("active");
}


// --- MODÜL 9: İLETKEN/YALITKAN ARCADE TASNİF OYUNU MANTIĞI ---
// --- MODÜL 9: İLETKEN/YALITKAN ARCADE TASNİF OYUNU MANTIĞI ---
const sortingItems = [
  // İletkenler (Conductors)
  { name: "Demir Anahtar", icon: "🔑", category: "iletken" },
  { name: "Bakır Bozuk Para", icon: "🪙", category: "iletken" },
  { name: "Demir Vida", icon: "🔩", category: "iletken" },
  { name: "Altın Yüzük", icon: `<svg viewBox='0 0 64 64' width='48' height='48' style='display:inline-block; vertical-align:middle;'><circle cx='32' cy='32' r='18' fill='none' stroke='#fbbf24' stroke-width='6'/><circle cx='32' cy='32' r='18' fill='none' stroke='#d97706' stroke-width='2'/><circle cx='24' cy='22' r='2.5' fill='#fff'/></svg>`, category: "iletken" },
  { name: "Metal Konserve", icon: "🥫", category: "iletken" },
  { name: "Kalem Ucu (Grafit)", icon: "✏️", category: "iletken" },
  { name: "Tuzlu Su", icon: `<svg viewBox='0 0 64 64' width='48' height='48' style='display:inline-block; vertical-align:middle;'><path d='M20,12 L20,48 A4,4 0 0,0 24,52 L40,52 A4,4 0 0,0 44,48 L44,12' fill='none' stroke='#000000' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/><line x1='17' y1='12' x2='47' y2='12' stroke='#000000' stroke-width='3' stroke-linecap='round'/><path d='M21.5,30 L21.5,48 A2.5,2.5 0 0,0 24,50.5 L40,50.5 A2.5,2.5 0 0,0 42.5,48 L42.5,30 Z' fill='#60a5fa'/><rect x='25' y='36' width='3' height='3' rx='0.5' fill='#ffffff' stroke='#000000' stroke-width='1'/><rect x='34' y='42' width='3' height='3' rx='0.5' fill='#ffffff' stroke='#000000' stroke-width='1'/><rect x='28' y='45' width='3' height='3' rx='0.5' fill='#ffffff' stroke='#000000' stroke-width='1'/><rect x='36' y='34' width='3' height='3' rx='0.5' fill='#ffffff' stroke='#000000' stroke-width='1'/><text x='25' y='24' font-size='8' font-family='sans-serif' font-weight='800' fill='#000000'>TUZ</text></svg>`, category: "iletken" },
  { name: "Limonlu Su", icon: `<svg viewBox='0 0 64 64' width='48' height='48' style='display:inline-block; vertical-align:middle;'><path d='M20,12 L20,48 A4,4 0 0,0 24,52 L40,52 A4,4 0 0,0 44,48 L44,12' fill='none' stroke='#000000' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/><line x1='17' y1='12' x2='47' y2='12' stroke='#000000' stroke-width='3' stroke-linecap='round'/><path d='M21.5,30 L21.5,48 A2.5,2.5 0 0,0 24,50.5 L40,50.5 A2.5,2.5 0 0,0 42.5,48 L42.5,30 Z' fill='#fef08a'/><circle cx='32' cy='40' r='6' fill='#facc15' stroke='#000000' stroke-width='1.5'/><line x1='32' y1='34' x2='32' y2='46' stroke='#000000' stroke-width='1'/><line x1='26' y1='40' x2='38' y2='40' stroke='#000000' stroke-width='1'/></svg>`, category: "iletken" },
  { name: "Sirkeli Su", icon: `<svg viewBox='0 0 64 64' width='48' height='48' style='display:inline-block; vertical-align:middle;'><path d='M20,12 L20,48 A4,4 0 0,0 24,52 L40,52 A4,4 0 0,0 44,48 L44,12' fill='none' stroke='#000000' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/><line x1='17' y1='12' x2='47' y2='12' stroke='#000000' stroke-width='3' stroke-linecap='round'/><path d='M21.5,30 L21.5,48 A2.5,2.5 0 0,0 24,50.5 L40,50.5 A2.5,2.5 0 0,0 42.5,48 L42.5,30 Z' fill='#fca5a5'/><text x='22' y='24' font-size='8' font-family='sans-serif' font-weight='800' fill='#000000'>SİRKE</text></svg>`, category: "iletken" },

  // Yalıtkanlar (Insulators)
  { name: "Tahta Odun", icon: "🪵", category: "yalitkan" },
  { name: "Plastik Bardak", icon: "🥤", category: "yalitkan" },
  { name: "Porselen Fincan", icon: "🏺", category: "yalitkan" },
  { name: "Pencere Camı", icon: "🪟", category: "yalitkan" },
  { name: "Kağıt Kitap", icon: "📚", category: "yalitkan" },
  { name: "Yün Eldiven", icon: "🧤", category: "yalitkan" },
  { name: "Kumaş Parçası", icon: "🧶", category: "yalitkan" },
  { name: "Saf Su", icon: `<svg viewBox='0 0 64 64' width='48' height='48' style='display:inline-block; vertical-align:middle;'><path d='M20,12 L20,48 A4,4 0 0,0 24,52 L40,52 A4,4 0 0,0 44,48 L44,12' fill='none' stroke='#000000' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/><line x1='17' y1='12' x2='47' y2='12' stroke='#000000' stroke-width='3' stroke-linecap='round'/><path d='M21.5,30 L21.5,48 A2.5,2.5 0 0,0 24,50.5 L40,50.5 A2.5,2.5 0 0,0 42.5,48 L42.5,30 Z' fill='#bfdbfe'/><text x='25' y='24' font-size='8' font-family='sans-serif' font-weight='800' fill='#000000'>SAF</text></svg>`, category: "yalitkan" },
  { name: "Plastik Cetvel", icon: "📏", category: "yalitkan" }
];

let sortingGameState = {
  score: 0,
  lives: 3,
  highScore: 0,
  speed: 1.2, // Pixels per frame at 60fps
  currentItem: null,
  itemY: -150,
  isPlaying: false,
  inputLocked: false,
  animFrameId: null
};

let lastTime = 0;

function initSortingGame() {
  sortingGameState.highScore = parseInt(localStorage.getItem("sort_high_score") || "0");
  const hsEl = document.getElementById("sort-high-score-val");
  if (hsEl) hsEl.innerText = sortingGameState.highScore;
}

function startSortingGame() {
  playClickSound();
  
  sortingGameState.score = 0;
  sortingGameState.lives = 3;
  sortingGameState.speed = 1.2; // 1.2 pixels/frame is comfortable for 6th graders
  sortingGameState.isPlaying = true;
  sortingGameState.inputLocked = false;
  sortingGameState.itemY = -150;
  lastTime = 0; // Reset lastTime for delta loop
  
  updateSortingUI();
  
  const overlay = document.getElementById("sort-game-overlay");
  if (overlay) overlay.style.display = "none";
  
  spawnNextSortingItem();
  
  if (sortingGameState.animFrameId) {
    cancelAnimationFrame(sortingGameState.animFrameId);
  }
  sortingGameState.animFrameId = requestAnimationFrame(sortingGameLoop);
}

function spawnNextSortingItem() {
  const rand = Math.floor(Math.random() * sortingItems.length);
  sortingGameState.currentItem = sortingItems[rand];
  sortingGameState.itemY = -150;
  sortingGameState.inputLocked = false;
  lastTime = 0; // Reset lastTime for the next item's falling loop
  
  const iconEl = document.getElementById("falling-item-icon");
  const nameEl = document.getElementById("falling-item-name");
  const itemEl = document.getElementById("falling-item");
  
  if (iconEl) {
    if (sortingGameState.currentItem.icon.startsWith("<svg")) {
      iconEl.innerHTML = sortingGameState.currentItem.icon;
    } else {
      iconEl.innerText = sortingGameState.currentItem.icon;
    }
  }
  if (nameEl) nameEl.innerText = sortingGameState.currentItem.name;
  if (itemEl) {
    itemEl.style.transition = "none"; // Clear previous transition
    itemEl.style.left = "50%";
    itemEl.style.top = "-150px";
    void itemEl.offsetHeight; // FORCE REFLOW: clear queued CSS transitions instantly
  }
}

function sortingGameLoop(time) {
  if (!sortingGameState.isPlaying || currentView !== "sorting-game") {
    sortingGameState.isPlaying = false;
    return;
  }
  
  if (!time) time = performance.now();
  if (!lastTime) lastTime = time;
  const elapsed = time - lastTime;
  lastTime = time;
  
  // Normalize frame rate to 60fps (16.67ms per frame). Cap to 50ms to prevent huge jumps.
  const deltaFactor = Math.min(elapsed, 50) / 16.67;
  
  // Only update position and schedule next frame if input is not locked
  if (!sortingGameState.inputLocked) {
    sortingGameState.itemY += sortingGameState.speed * deltaFactor;
    
    const itemEl = document.getElementById("falling-item");
    if (itemEl) {
      itemEl.style.top = sortingGameState.itemY + "px";
    }
    
    // Miss detection limit (bottom of screen)
    if (sortingGameState.itemY > 325) {
      sortingGameState.inputLocked = true;
      handleSortingMiss();
    } else {
      sortingGameState.animFrameId = requestAnimationFrame(sortingGameLoop);
    }
  }
}

function handleSortingMiss() {
  playFailureSound();
  sortingGameState.lives--;
  updateSortingUI();
  
  const screen = document.querySelector("#sorting-game .dart-game-screen");
  if (screen) {
    screen.style.borderColor = "var(--color-danger)";
    setTimeout(() => screen.style.borderColor = "var(--border-color)", 200);
  }
  
  if (sortingGameState.lives <= 0) {
    endSortingGame("Maddeleri kaçırdınız veya hatalı tasnif ettiniz!");
  } else {
    setTimeout(() => {
      spawnNextSortingItem();
      sortingGameState.animFrameId = requestAnimationFrame(sortingGameLoop);
    }, 400);
  }
}

function sortFallingItem(chosenCategory) {
  if (!sortingGameState.isPlaying || sortingGameState.inputLocked) return;
  sortingGameState.inputLocked = true;
  
  const isCorrect = sortingGameState.currentItem.category === chosenCategory;
  const itemEl = document.getElementById("falling-item");
  
  const binId = chosenCategory === 'iletken' ? 'bin-conductor' : 'bin-insulator';
  const binEl = document.getElementById(binId);
  if (binEl) {
    binEl.style.transform = 'scale(1.1)';
    setTimeout(() => binEl.style.transform = 'scale(1)', 100);
  }
  
  if (itemEl) {
    itemEl.style.transition = "all 0.22s ease-out";
    if (chosenCategory === 'iletken') {
      itemEl.style.left = "20%";
      itemEl.style.top = "300px";
    } else {
      itemEl.style.left = "80%";
      itemEl.style.top = "300px";
    }
  }
  
  setTimeout(() => {
    const screen = document.querySelector("#sorting-game .dart-game-screen");
    if (isCorrect) {
      playSuccessSound();
      sortingGameState.score += 10;
      // Increment speed slowly
      sortingGameState.speed = 1.2 + (sortingGameState.score / 120);
      
      if (screen) {
        screen.style.borderColor = "var(--color-success)";
        setTimeout(() => screen.style.borderColor = "var(--border-color)", 200);
      }
    } else {
      playFailureSound();
      sortingGameState.lives--;
      
      if (screen) {
        screen.style.borderColor = "var(--color-danger)";
        setTimeout(() => screen.style.borderColor = "var(--border-color)", 200);
      }
    }
    
    updateSortingUI();
    
    if (sortingGameState.lives <= 0) {
      endSortingGame("Canlarınız Bitti!");
    } else {
      spawnNextSortingItem();
      sortingGameState.animFrameId = requestAnimationFrame(sortingGameLoop);
    }
  }, 230);
}

function updateSortingUI() {
  const scoreEl = document.getElementById("sort-score-val");
  const livesEl = document.getElementById("sort-lives-val");
  const hsEl = document.getElementById("sort-high-score-val");
  
  if (scoreEl) scoreEl.innerText = sortingGameState.score;
  if (hsEl) hsEl.innerText = Math.max(sortingGameState.score, sortingGameState.highScore);
  
  if (livesEl) {
    let livesStr = "";
    for (let i = 0; i < 3; i++) {
      livesStr += i < sortingGameState.lives ? "❤️" : "░";
    }
    livesEl.innerText = livesStr;
  }
}

function endSortingGame(reason) {
  sortingGameState.isPlaying = false;
  
  if (sortingGameState.animFrameId) {
    cancelAnimationFrame(sortingGameState.animFrameId);
  }
  
  if (sortingGameState.score > sortingGameState.highScore) {
    sortingGameState.highScore = sortingGameState.score;
    localStorage.setItem("sort_high_score", sortingGameState.highScore);
    const hsEl = document.getElementById("sort-high-score-val");
    if (hsEl) hsEl.innerText = sortingGameState.highScore;
  }
  
  const overlay = document.getElementById("sort-game-overlay");
  const title = document.getElementById("sort-overlay-title");
  const desc = document.getElementById("sort-overlay-desc");
  const btn = document.getElementById("btn-start-sort");
  
  if (overlay) overlay.style.display = "flex";
  if (title) title.innerText = "OYUN BİTTİ!";
  if (desc) {
    desc.innerHTML = `Skorunuz: <strong style="color:var(--color-warning); font-size: 22px;">${sortingGameState.score} Puan</strong><br><span style="font-size:12px; color:#94a3b8; display:block; margin-top:8px;">${reason}</span>`;
  }
  if (btn) btn.innerText = "YENİDEN BAŞLAT";
}


// --- UYGULAMA BAŞLANGIÇ AYARLARI ---
window.addEventListener("DOMContentLoaded", () => {
  initDragAndDrop();
  
  initResistanceLab();
  updateResistanceSimulation();
  
  initResistLab();
  
  updateReosta();
  
  initSortingGame();
  
  document.body.addEventListener("click", () => {
    initAudio();
  }, { once: true });
});
