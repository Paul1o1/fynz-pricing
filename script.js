document.addEventListener('DOMContentLoaded', () => {
    // --- Logic Configuration ---
    const TIERS = {
        ESSENTIAL: 'card-essential',
        SMART_PLUS: 'card-smart-plus',
        PRO: 'card-pro'
    };

    // Tier Levels for comparison (Higher is better)
    const TIER_LEVELS = {
        [TIERS.ESSENTIAL]: 1,
        [TIERS.SMART_PLUS]: 2,
        [TIERS.PRO]: 3
    };

    const CATEGORIES = {
        BASIC: ['no_income', 'student', 'employment_one_t4', 'social_assistance', 'rrsp', 'donations', 'medical_expenses'],
        MODERATE: ['spouse', 'dependents', 'more_than_one_t4', 'pension', 'dividends', 'investment_income', 'capital_gains', 'foreign_income'],
        PRO: ['self_employed', 'business_expenses', 'uber_lyft', 'freelance', 'rental', 'gig_work', 'small_business'],
        FAMILY: ['spouse', 'dependents']
    };

    const FEATURES = {
        [TIERS.ESSENTIAL]: [
            "Simple T4 Income",
            "RRSP & Donations",
            "Student Credits",
            "Max Refund Guarantee"
        ],
        [TIERS.SMART_PLUS]: [
            "All Essential Features",
            "Audit Defence included",
            "Investment Income (T3/T5008)",
            "Priority Support",
            "7-Year Cloud Storage"
        ],
        [TIERS.PRO]: [
            "All Smart Plus Features",
            "Self-Employment Income (T2125)",
            "Rental Income (T776)",
            "Unlimited Business Expenses",
            "GST/HST Return Filing"
        ]
    };

    // Preference Mapping: Defaults to start with
    const PREF_MAPPING = {
        'myself': TIERS.ESSENTIAL,
        'expert': TIERS.SMART_PLUS,
        'forme': TIERS.PRO,
        'unsure': TIERS.ESSENTIAL // neutral default
    };

    // --- State ---
    const selectedChips = new Set();
    let currentPreference = 'unsure'; // default

    // --- DOM Elements ---
    const chips = document.querySelectorAll('.chip');
    const prefCards = document.querySelectorAll('.pref-card');
    const steps = document.querySelectorAll('.wizard-step');
    const stepIndicators = document.querySelectorAll('.step-indicator');
    const nextBtns = document.querySelectorAll('.next-btn');
    const backBtns = document.querySelectorAll('.back-btn');
    const startOverBtn = document.getElementById('start-over-btn');

    // Result Elements
    const priceExplainer = document.getElementById('price-explainer');
    const reasoningText = document.getElementById('reasoning-text');
    const featureListUl = document.getElementById('feature-list-ul');

    // Result Cards
    const cards = {
        [TIERS.ESSENTIAL]: document.getElementById(TIERS.ESSENTIAL),
        [TIERS.SMART_PLUS]: document.getElementById(TIERS.SMART_PLUS),
        [TIERS.PRO]: document.getElementById(TIERS.PRO)
    };
    const familyAlert = document.getElementById('family-pack-alert');

    // --- 1. Preference Selection ---
    prefCards.forEach(card => {
        card.addEventListener('click', () => {
            // UI Toggle
            prefCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            // Logic Update
            currentPreference = card.dataset.pref;
            updatePricing();
        });
    });

    // --- 2. Chip Selection Logic ---
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const value = chip.dataset.value;

            if (selectedChips.has(value)) {
                selectedChips.delete(value);
                chip.classList.remove('selected');
            } else {
                selectedChips.add(value);
                chip.classList.add('selected');
            }
            updatePricing();
        });
    });

    // --- 3. Wizard Navigation ---
    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const nextStepId = btn.dataset.next;
            goToStep(nextStepId);
        });
    });

    backBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const backStepId = btn.dataset.back;
            goToStep(backStepId);
        });
    });

    // Step Indicator Click Logic
    stepIndicators.forEach(ind => {
        ind.addEventListener('click', () => {
            const stepNum = ind.dataset.step;
            goToStep(stepNum);
        });
    });

    function goToStep(stepNum) {
        // Hide all steps
        steps.forEach(s => s.classList.remove('active'));
        // Show target step
        document.getElementById(`step-${stepNum}`).classList.add('active');

        // Update Indicators
        stepIndicators.forEach(ind => {
            const indStep = parseInt(ind.dataset.step);
            if (indStep == stepNum) ind.classList.add('active');
            else if (indStep > stepNum) ind.classList.remove('active');
        });

        // Show/Hide Start Over Button
        if (stepNum > 1) {
            startOverBtn.classList.remove('hidden');
        } else {
            startOverBtn.classList.add('hidden');
        }
    }

    // --- Start Over Logic ---
    if (startOverBtn) {
        startOverBtn.addEventListener('click', () => {
            // Reset State
            selectedChips.clear();
            currentPreference = 'unsure';

            // Reset UI
            chips.forEach(c => c.classList.remove('selected'));
            prefCards.forEach(c => c.classList.remove('selected'));

            updatePricing();
            goToStep(1);
        });
    }

    // --- 4. Pricing Calculation Logic ---
    function updatePricing() {
        // 1. Determine "Base" Tier from Preference
        let baseTier = PREF_MAPPING[currentPreference];

        // 2. Determine "Situational" Tier from Chips
        let situationTier = TIERS.ESSENTIAL;
        const hasPro = Array.from(selectedChips).some(val => CATEGORIES.PRO.includes(val));
        const hasModerate = Array.from(selectedChips).some(val => CATEGORIES.MODERATE.includes(val));
        const hasFamily = Array.from(selectedChips).some(val => CATEGORIES.FAMILY.includes(val));

        if (hasPro) {
            situationTier = TIERS.PRO;
        } else if (hasModerate) {
            situationTier = TIERS.SMART_PLUS;
        }

        // 3. Final Tier is Max(Base, Situation)
        let activeTierId = TIERS.ESSENTIAL;
        if (TIER_LEVELS[baseTier] >= TIER_LEVELS[situationTier]) {
            activeTierId = baseTier;
        } else {
            activeTierId = situationTier;
        }

        // --- NEW: Generate Reasoning Text ---
        // Basic heuristic for explanation
        let reason = "Recommended based on your selection.";

        if (activeTierId === TIERS.PRO) {
            if (hasPro) {
                const proItems = Array.from(selectedChips).filter(val => CATEGORIES.PRO.includes(val));
                const formatList = proItems.map(i => i.replace(/_/g, ' ')).join(', ');
                reason = `Recommended because you selected: <br><strong>${formatList}</strong>`;
            } else if (baseTier === TIERS.PRO) {
                reason = "Recommended because you chose 'I want someone to do it for me'.";
            }
        } else if (activeTierId === TIERS.SMART_PLUS) {
            if (hasModerate) {
                const modItems = Array.from(selectedChips).filter(val => CATEGORIES.MODERATE.includes(val));
                // Only show first 2 to keep it short if too many
                const formatList = modItems.slice(0, 3).map(i => i.replace(/_/g, ' ')).join(', ');
                reason = `Recommended because you have: <br><strong>${formatList}</strong>`;
            } else if (baseTier === TIERS.SMART_PLUS) {
                reason = "Recommended because you chose 'I want an expert to help'.";
            }
        } else {
            reason = "The best value for simple returns.";
        }

        // Update DOM
        if (priceExplainer) {
            reasoningText.innerHTML = reason;
            if (currentPreference !== 'unsure' || selectedChips.size > 0) {
                priceExplainer.classList.remove('hidden');
            } else {
                priceExplainer.classList.add('hidden');
            }
        }

        // --- NEW: Update Feature List ---
        if (featureListUl && FEATURES[activeTierId]) {
            featureListUl.innerHTML = FEATURES[activeTierId].map(feat => `<li>✔ ${feat}</li>`).join('');
        }

        // Update UI Cards
        Object.keys(cards).forEach(key => {
            const card = cards[key];
            if (key === activeTierId) {
                card.classList.add('active-plan');
                card.classList.remove('inactive-plan');
            } else {
                card.classList.remove('active-plan');
                card.classList.add('inactive-plan');
            }
        });

        // Family Pack Visibility
        if (hasFamily) {
            familyAlert.classList.remove('hidden');
        } else {
            familyAlert.classList.add('hidden');
        }
    }

    // Initialize with default
    updatePricing();

    // --- 5. Global Scroll Animations (IntersectionObserver) ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target); // Trigger once
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });

    // --- 6. FAQ Accordion Logic ---
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.parentElement;
            // Toggle current
            item.classList.toggle('active');
        });
    });

    // --- 7. Stacking Cards Scroll Effect ---
    // Simple logic: As we scroll through the testimonials section, the cards pop up
    const testimonialsSection = document.querySelector('.testimonials-section');
    const stackCards = document.querySelectorAll('.stack-card');

    if (testimonialsSection && stackCards.length > 0) {
        window.addEventListener('scroll', () => {
            const rect = testimonialsSection.getBoundingClientRect();
            const sectionHeight = testimonialsSection.offsetHeight;
            const scrollProgress = -rect.top / (sectionHeight - window.innerHeight);
            // 0 at top entrance, 1 at bottom exit roughly

            if (scrollProgress < 0 || scrollProgress > 1.2) return;

            // Logic to cycle cards based on progress
            // 0-0.33: Card 1 front
            // 0.33-0.66: Card 2 front
            // 0.66-1.0: Card 3 front

            // This is a simple visual swap implementation
            if (scrollProgress > 0.66) {
                // Card 3 Active
                setActiveCard(2);
            } else if (scrollProgress > 0.33) {
                // Card 2 Active
                setActiveCard(1);
            } else {
                // Card 1 Active
                setActiveCard(0);
            }
        });

        function setActiveCard(index) {
            stackCards.forEach((card, i) => {
                if (i === index) {
                    card.style.transform = "scale(1) translateY(0)";
                    card.style.opacity = "1";
                    card.style.zIndex = "10";
                } else if (i < index) {
                    // Cards already passed - move up and fade
                    card.style.transform = "scale(0.9) translateY(-50px)";
                    card.style.opacity = "0";
                    card.style.zIndex = "1";
                } else {
                    // Cards coming up - waiting in back
                    card.style.transform = `scale(${0.9 - (i - index) * 0.05}) translateY(${40 + (i - index) * 20}px)`;
                    card.style.opacity = "0.8"; // peek
                    card.style.zIndex = 5 - i;
                }
            });
        }
    }

    // --- 8. Comparison Modal Logic ---
    const compareBtn = document.getElementById('compare-plans-btn');
    const compareModal = document.getElementById('compare-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');

    if (compareBtn && compareModal && closeModalBtn) {
        compareBtn.addEventListener('click', () => {
            compareModal.classList.remove('hidden');
        });

        closeModalBtn.addEventListener('click', () => {
            compareModal.classList.add('hidden');
        });

        // Close on click outside
        compareModal.addEventListener('click', (e) => {
            if (e.target === compareModal) {
                compareModal.classList.add('hidden');
            }
        });
    }
});
