document.addEventListener('DOMContentLoaded', () => {
    // --- MOCK DATABASE ---
    const questionBank = {
        'cardio': [
            { stem: 'AF\'de inme risk stratifikasyonu için standart araç aşağıdakilerden hangisidir?', options: ['CHA₂DS₂-VASc', 'TIMI', 'GRACE', 'HEART'], answer: 0, difficulty: 'orta' },
            { stem: 'AF\'de inme önlemede warfarin yerine hangi ilaçlar tercih edilir?', options: ['NOAC\'lar', 'Aspirin', 'Beta-blokerler', 'Kalsiyum kanal blokerleri'], answer: 0, difficulty: 'orta' },
            { stem: 'Atriyal fibrilasyon yetişkin popülasyonun yaklaşık yüzde kaçını etkiler?', options: ['%10-15', '%2-4', '%0.5', '%20'], answer: 1, difficulty: 'kolay' },
            { stem: '65 yaş üstü AF hastalarında yaygınlık yaklaşık olarak şuna ulaşır:', options: ['%1-2', '%5-8', '%15-20', '%30'], answer: 1, difficulty: 'zor' },
            { stem: 'Antikoagülan kullanan hastalarda kanama riskini değerlendirmek için hangi skor kullanılır?', options: ['CHADS2', 'HAS-BLED', 'WELLS', 'NYHA'], answer: 1, difficulty: 'orta' },
            { stem: 'AF\'de inme önlemesi için artık tek başına aspirin önerilmemektedir.', options: ['Doğru', 'Yanlış'], answer: 0, difficulty: 'kolay' },
            { stem: 'AF hastalarının yaklaşık yüzde kaçında hipertansiyon mevcuttur?', options: ['%20', '%40', '%60', '%80'], answer: 2, difficulty: 'orta' },
            { stem: 'AF yönetiminde hangi strateji kişiselleştirilmelidir?', options: ['Hız vs ritim kontrolü', 'Herkes için aspirin', 'Bekle ve gör', 'Herkes için cerrahi'], answer: 0, difficulty: 'orta' },
            { stem: 'Obezite (BMI >30) AF riskini ne kadar artırır?', options: ['%10', '%25', '%49', '%100'], answer: 2, difficulty: 'zor' },
            { stem: 'Kalbin birincil pili şudur:', options: ['AV düğümü', 'SA düğümü', 'His demeti', 'Purkinje lifleri'], answer: 1, difficulty: 'kolay' }
        ],
        'neuro': [
            { stem: 'Akut iskemik inmede IV Alteplaz için standart zaman penceresi:', options: ['1 saat', '3 saat', '4.5 saat', '6 saat'], answer: 2, difficulty: 'orta' },
            { stem: 'İnmede trombolize başlamadan önce hangi görüntüleme zorunludur?', options: ['Beyin MRG', 'Kontrassız Beyin BT', 'Akciğer Grafisi', 'Karotis Ultrasonu'], answer: 1, difficulty: 'kolay' },
            { stem: 'İnme yönetimindeki "altın saat" şu süre içindeki tedaviyi ifade eder:', options: ['60 dakika', '120 dakika', '15 dakika', '24 saat'], answer: 0, difficulty: 'kolay' },
            { stem: 'İnme şiddetini değerlendirmek için hangi skor kullanılır?', options: ['GCS', 'NIHSS', 'APGAR', 'Modifiye Rankin Skalası'], answer: 1, difficulty: 'orta' },
            { stem: 'Kan basıncı şundan yüksekse TPA\'dan kaçınılmalıdır:', options: ['140/90', '160/100', '185/110', '220/120'], answer: 2, difficulty: 'zor' }
        ],
        'peds': [
            { stem: 'Pediatrik status epileptikus için ilk seçenek ilaç:', options: ['Valproat', 'Benzodiazepinler', 'Fenitoin', 'Levetirasetam'], answer: 1, difficulty: 'orta' },
            { stem: 'Pediatrik şok için başlangıç sıvı bolusu genellikle şöyledir:', options: ['5 ml/kg', '10 ml/kg', '20 ml/kg', '50 ml/kg'], answer: 2, difficulty: 'orta' },
            { stem: 'APGAR skoru şu zamanlarda değerlendirilir:', options: ['1. ve 5. dakikalarda', '10. dakikada', 'Sadece doğumda', 'Her saat'], answer: 0, difficulty: 'kolay' }
        ]
    };

    // --- STATE ---
    let currentQuiz = [];
    let currentIndex = 0;
    let userAnswers = [];
    let currentSpecialty = 'cardio';

    // --- DOM ELEMENTS ---
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    // Config elements
    const quizConfig = document.getElementById('quiz-config');
    const quizPlayer = document.getElementById('quiz-player');
    const quizResults = document.getElementById('quiz-results');

    // Player elements
    const qStem = document.getElementById('q-stem');
    const qOptions = document.getElementById('q-options');
    const qNumber = document.getElementById('q-number');
    const qCounter = document.getElementById('q-counter');
    const qDiffBadge = document.getElementById('q-diff-badge');
    const quizProgress = document.getElementById('quiz-progress');

    // Buttons
    const btnStart = document.getElementById('btn-start-quiz');
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnRestart = document.getElementById('btn-restart');

    const pageMeta = {
        'nav-dashboard': { title: 'Program Paneli', subtitle: 'Tıbbi sertifikasyon mükemmeliyet hattı izleme' },
        'nav-play': { title: 'Sertifikasyon Sınavı', subtitle: 'Canlı sınav ve lisans değerlendirmesi' },
        'nav-reviewer': { title: 'Yönetici Onayı', subtitle: 'İçerik doğrulaması için yönetici arayüzü' },
        'nav-eval': { title: 'Kalite Değerlendirmesi', subtitle: 'Otomatik kalite regresyon testi' }
    };

    // --- TAB NAVIGATION ---
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.id;
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            const tabId = targetId.replace('nav-', 'tab-');
            tabContents.forEach(tab => {
                tab.classList.remove('active');
                if (tab.id === tabId) tab.classList.add('active');
            });

            if (pageMeta[targetId]) {
                pageTitle.textContent = pageMeta[targetId].title;
                pageSubtitle.textContent = pageMeta[targetId].subtitle;
            }
        });
    });

    // --- QUIZ LOGIC ---

    function startQuiz() {
        const spec = document.getElementById('config-specialty').value;
        const diff = document.getElementById('config-difficulty').value;
        const count = parseInt(document.getElementById('config-count').value);

        currentSpecialty = spec;
        
        // Filter and slice questions
        let pool = questionBank[spec] || [];
        // Optional: filter by difficulty if pool is large enough
        // For demo, we just take N questions
        currentQuiz = pool.sort(() => 0.5 - Math.random()).slice(0, count);
        
        currentIndex = 0;
        userAnswers = new Array(currentQuiz.length).fill(null);

        quizConfig.style.display = 'none';
        quizPlayer.style.display = 'block';
        quizResults.style.display = 'none';

        renderQuestion();
    }

    function renderQuestion() {
        const q = currentQuiz[currentIndex];
        qStem.textContent = q.stem;
        qNumber.textContent = `Soru ${currentIndex + 1} / ${currentQuiz.length}`;
        qCounter.textContent = `${currentIndex + 1} / ${currentQuiz.length}`;
        qDiffBadge.textContent = q.difficulty.toUpperCase();
        
        // Progress
        const progress = ((currentIndex + 1) / currentQuiz.length) * 100;
        quizProgress.style.width = `${progress}%`;

        // Options
        qOptions.innerHTML = '';
        q.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            if (userAnswers[currentIndex] === idx) btn.classList.add('selected');
            
            // HINT: Mark correct answer for development/testing as requested
            if (idx === q.answer) {
                btn.classList.add('hint-correct');
            }

            btn.textContent = opt;
            btn.addEventListener('click', () => {
                userAnswers[currentIndex] = idx;
                renderQuestion(); // Re-render to show selection
            });
            qOptions.appendChild(btn);
        });

        // Nav buttons
        btnPrev.disabled = currentIndex === 0;
        btnPrev.textContent = 'Önceki';
        btnNext.textContent = currentIndex === currentQuiz.length - 1 ? 'Sınavı Bitir' : 'Sonraki Soru';
    }

    function nextQuestion() {
        if (currentIndex < currentQuiz.length - 1) {
            currentIndex++;
            renderQuestion();
        } else {
            finishQuiz();
        }
    }

    function prevQuestion() {
        if (currentIndex > 0) {
            currentIndex--;
            renderQuestion();
        }
    }

    function finishQuiz() {
        let correctCount = 0;
        currentQuiz.forEach((q, idx) => {
            if (userAnswers[idx] === q.answer) correctCount++;
        });

        const score = Math.round((correctCount / currentQuiz.length) * 100);
        document.getElementById('final-score').textContent = score;
        
        const passed = score >= 70;
        const msg = passed ? 'Tebrikler! Sertifikasyon gerekliliklerini başarıyla geçtiniz.' : 'Geçme puanına (%70) ulaşamadınız. Lütfen materyalleri gözden geçirin ve tekrar deneyin.';
        document.getElementById('result-message').textContent = msg;

        // Show certificate only if passed
        const certWrapper = document.getElementById('certificate-wrapper');
        certWrapper.style.display = passed ? 'block' : 'none';

        // Cert Update
        const specName = document.getElementById('config-specialty').options[document.getElementById('config-specialty').selectedIndex].text;
        document.getElementById('cert-program-name').textContent = specName.toUpperCase() + ' SINAVI';

        quizPlayer.style.display = 'none';
        quizResults.style.display = 'block';

        // Add to dashboard activity
        const activity = document.getElementById('activity-list');
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        const log = document.createElement('div');
        log.textContent = `[${timeStr}] Sınav tamamlandı (${specName}) - Puan: %${score}`;
        activity.prepend(log);
    }

    // --- PDF DOWNLOAD ---
    const btnDownload = document.getElementById('btn-download-pdf');
    btnDownload.addEventListener('click', () => {
        const element = document.getElementById('certificate-to-print');
        const specName = document.getElementById('cert-program-name').textContent;
        const opt = {
            margin: 0.5,
            filename: `Sertifika_${specName.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
        };
        
        btnDownload.disabled = true;
        btnDownload.textContent = 'PDF Oluşturuluyor...';
        
        html2pdf().set(opt).from(element).save().then(() => {
            btnDownload.disabled = false;
            btnDownload.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" style="vertical-align: middle; margin-right: 8px; fill: currentColor;"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg> Resmi Sertifikayı İndir (PDF)';
        });
    });

    // --- EVENT LISTENERS ---
    btnStart.addEventListener('click', startQuiz);
    btnNext.addEventListener('click', nextQuestion);
    btnPrev.addEventListener('click', prevQuestion);
    btnRestart.addEventListener('click', () => {
        quizConfig.style.display = 'block';
        quizResults.style.display = 'none';
    });
});
