document.addEventListener('DOMContentLoaded', () => {
    // Initialize AOS Animation
    AOS.init({
        once: true,
        offset: 50,
    });

    // Smooth Scrolling for Nav Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Tab Switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    let currentMode = 'manual';

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
            currentMode = tabId;
        });
    });

    // Elements
    const analyzeBtn = document.getElementById('analyze-btn');
    const inputSection = document.getElementById('input-section');
    const loadingSection = document.getElementById('loading-section');
    const resultsSection = document.getElementById('results-section');
    const resetBtn = document.getElementById('reset-btn');
    const sectionsContainer = document.getElementById('sections-container');
    const statusText = document.getElementById('status-text');
    const loadingProgress = document.getElementById('loading-progress');

    // Loading Simulation
    let loadingInterval;
    const loadingMessages = [
        "Connecting to Gemini AI...",
        "Parsing profile structure...",
        "Evaluating keywords and SEO...",
        "Analyzing leadership impact...",
        "Drafting elite rewrites...",
        "Finalizing score matrix..."
    ];

    function startLoading() {
        inputSection.classList.add('hidden');
        loadingSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');
        
        // Scroll to loading
        loadingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

        let progress = 0;
        let msgIndex = 0;
        
        statusText.textContent = loadingMessages[0];
        loadingProgress.style.width = '0%';

        loadingInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 95) progress = 95; // Hold at 95% until complete
            loadingProgress.style.width = `${progress}%`;

            if (Math.random() > 0.6 && msgIndex < loadingMessages.length - 1) {
                msgIndex++;
                statusText.textContent = loadingMessages[msgIndex];
            }
        }, 800);
    }

    function stopLoading() {
        clearInterval(loadingInterval);
        loadingProgress.style.width = '100%';
        statusText.textContent = "Analysis Complete!";
    }

    // API Call
    analyzeBtn.addEventListener('click', async () => {
        let payload = {};

        if (currentMode === 'manual') {
            const h = document.getElementById('f-headline').value.trim();
            const s = document.getElementById('f-summary').value.trim();
            const e = document.getElementById('f-experience').value.trim();
            const sk = document.getElementById('f-skills').value.trim();
            const ed = document.getElementById('f-education').value.trim();

            if (!h && !s && !e && !sk && !ed) {
                alert('Please fill out at least one field to analyze.');
                return;
            }

            payload = {
                type: 'manual',
                content: {
                    headline: h,
                    summary: s,
                    experience: e,
                    skills: sk,
                    education: ed
                }
            };
        } else if (currentMode === 'url') {
            const url = document.getElementById('profile-url').value.trim();
            if (!url || !url.includes('linkedin.com/in/')) {
                alert('Please enter a valid LinkedIn Profile URL.');
                return;
            }
            payload = {
                type: 'url',
                content: url
            };
        } else if (currentMode === 'html') {
            const htmlContent = document.getElementById('profile-html').value.trim();
            if (!htmlContent) {
                alert('Please paste the HTML source code of your LinkedIn profile.');
                return;
            }
            payload = {
                type: 'html',
                content: htmlContent
            };
        }

        startLoading();

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Unknown error occurred.');
            }

            stopLoading();
            setTimeout(() => {
                loadingSection.classList.add('hidden');
                resultsSection.classList.remove('hidden');
                renderResults(data);
                resultsSection.scrollIntoView({ behavior: 'smooth' });
            }, 500);

        } catch (err) {
            stopLoading();
            setTimeout(() => {
                loadingSection.classList.add('hidden');
                inputSection.classList.remove('hidden');
                alert(`Analysis Failed:\n${err.message}`);
            }, 500);
        }
    });

    // Reset
    resetBtn.addEventListener('click', () => {
        resultsSection.classList.add('hidden');
        inputSection.classList.remove('hidden');
        inputSection.scrollIntoView({ behavior: 'smooth' });
        
        // Clear fields
        document.getElementById('f-headline').value = '';
        document.getElementById('f-summary').value = '';
        document.getElementById('f-experience').value = '';
        document.getElementById('f-skills').value = '';
        document.getElementById('f-education').value = '';
        document.getElementById('profile-url').value = '';
        document.getElementById('profile-html').value = '';
        sectionsContainer.innerHTML = '';
    });

    function renderResults(data) {
        const totalScore = data.total_score || 0;
        
        // Setup Header evaluation text
        const evalElem = document.getElementById('score-evaluation');
        if (totalScore >= 90) evalElem.innerHTML = "<span style='color:var(--success)'>Top 5% Profile. Ready for tier-1 recruiters.</span>";
        else if (totalScore >= 75) evalElem.innerHTML = "<span style='color:var(--secondary)'>Strong foundation. High potential.</span>";
        else if (totalScore >= 60) evalElem.innerHTML = "<span style='color:var(--warning)'>Average profile. Needs optimization.</span>";
        else evalElem.innerHTML = "<span style='color:var(--danger)'>Critical improvements required.</span>";

        animateTotalScore(totalScore);

        // Render Sections
        const template = document.getElementById('section-template');
        const sectionOrder = ["Headline", "Summary", "Experience", "Skills", "Education"];
        
        sectionsContainer.innerHTML = '';

        sectionOrder.forEach((secName, index) => {
            if (data.sections && data.sections[secName]) {
                const sec = data.sections[secName];
                const clone = template.content.cloneNode(true);
                const card = clone.querySelector('.result-card');
                
                // Add AOS delay to cascade in
                card.setAttribute('data-aos-delay', index * 100);

                // Populate text
                clone.querySelector('.rc-title').textContent = secName;
                clone.querySelector('.rc-score-value').textContent = sec.score || 0;
                clone.querySelector('.feedback-content').textContent = sec.feedback || 'No feedback provided.';
                clone.querySelector('.orig-content').textContent = sec.original || 'Not provided';
                clone.querySelector('.impr-content').textContent = sec.improved || 'Not provided';

                // Set Score colors and progress
                const scoreBadge = clone.querySelector('.rc-score-badge');
                const progressFill = clone.querySelector('.rc-progress-fill');
                const score = sec.score || 0;
                
                let colorVar = 'var(--danger)';
                if (score >= 80) colorVar = 'var(--success)';
                else if (score >= 60) colorVar = 'var(--warning)';

                clone.querySelector('.rc-score-value').style.color = colorVar;
                progressFill.style.background = colorVar;

                // Setup Copy Button
                const copyBtn = clone.querySelector('.copy-action');
                const textToCopy = sec.improved || '';
                copyBtn.addEventListener('click', () => {
                    navigator.clipboard.writeText(textToCopy);
                    copyBtn.innerHTML = '<i class="fas fa-check" style="color:var(--success)"></i>';
                    setTimeout(() => copyBtn.innerHTML = '<i class="fas fa-copy"></i>', 2000);
                });

                sectionsContainer.appendChild(clone);

                // Animate progress bar after append
                setTimeout(() => {
                    const addedCards = sectionsContainer.querySelectorAll('.result-card');
                    const lastCard = addedCards[addedCards.length - 1];
                    const fill = lastCard.querySelector('.rc-progress-fill');
                    fill.style.width = `${score}%`;
                }, 100);
            }
        });

        // Re-init AOS to catch new elements
        AOS.refresh();
    }

    function animateTotalScore(target) {
        const textElem = document.getElementById('final-score-text');
        const circlePath = document.getElementById('score-circle-path');
        
        let current = 0;
        const duration = 2000;
        const intervalTime = 20;
        const steps = duration / intervalTime;
        const increment = target / steps;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            textElem.textContent = Math.round(current);
        }, intervalTime);

        // Setup SVG Dash
        setTimeout(() => {
            const dashArray = `${target}, 100`;
            circlePath.setAttribute('stroke-dasharray', dashArray);
            
            if (target >= 80) circlePath.style.stroke = 'var(--success)';
            else if (target >= 60) circlePath.style.stroke = 'var(--warning)';
            else circlePath.style.stroke = 'var(--danger)';
        }, 100);
    }
});
