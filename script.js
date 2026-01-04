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
        // Show if Family chips selected, UNLESS we are already at max tier? 
        // Logic: Family pack add-on is for paying for spouse. Usually applies to Smart+/Pro.
        // We show it if family triggers exist.
        if (hasFamily) {
            familyAlert.classList.remove('hidden');
        } else {
            familyAlert.classList.add('hidden');
        }
    }
});
