import { useState, useEffect, useCallback, useRef } from 'react';

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Master Your Data Management in HisabKitab 📂',
    badge: 'Onboarding Guide',
    icon: '🗂️',
    type: 'overview',
    description:
      'HisabKitab is powered by 4 interconnected Data Management tools designed to keep your spending organized and automated.',
    pillars: [
      {
        icon: '📖',
        title: '1. Chapter Manager',
        desc: 'Separate tracking books for months, semesters, or vacation trips.',
      },
      {
        icon: '🏷️',
        title: '2. Category Manager',
        desc: 'Custom emoji icons & color badges that dynamically power charts.',
      },
      {
        icon: '💳',
        title: '3. Payment Methods',
        desc: 'Track balances across Cash, bKash, Nagad, Bank, and Cards.',
      },
      {
        icon: '⚡',
        title: '4. Recurring Expenses',
        desc: 'Fixed bills that auto-suggest amounts in 1 tap when spending.',
      },
    ],
    highlightNote:
      '💡 Let’s take 1 minute to explore each of these 4 managers with live dummy data!',
    primaryButton: 'Open Chapter Manager →',
  },
  {
    id: 'chapter_manager',
    title: '1. Chapter Manager & Smart Import 📖',
    badge: 'Live Manager Demo',
    icon: '📖',
    type: 'chapter',
    description:
      'The Chapter Manager is open above! Chapters are separate notebooks for your money (e.g. "August 2026", "July 2026").',
    features: [
      {
        title: '🗓️ Time Periods & Projects',
        desc: 'Create monthly books or trip budgets. Each chapter maintains its own isolated balance and expenses.',
      },
      {
        title: '📥 The Chapter Import Superpower',
        desc: 'Notice the 📥 Import button on the chapter cards! Tap it to copy recurring bills & template records from past chapters in 1 click.',
      },
      {
        title: '📅 Date Range Filters',
        desc: 'Set custom start and end dates to match your salary or billing cycle.',
      },
    ],
    highlightNote:
      '📍 Live Demo: See the sample chapters "August 2026" and "July 2026" above with their date ranges and import action.',
    primaryButton: 'Next: Category Manager →',
  },
  {
    id: 'category_manager',
    title: '2. Custom Category Manager 🏷️',
    badge: 'Live Manager Demo',
    icon: '🏷️',
    type: 'category',
    description:
      'The Category Manager is open above! Classify your expenses with personalized emojis and vibrant color badges.',
    features: [
      {
        title: '🎨 Emojis & Color Badges',
        desc: 'Pick any emoji (🍚 Food, 🏠 Housing, 🚌 Commute, ⚡ Utilities) and custom badge colors for instant recognition.',
      },
      {
        title: '⚡ 12+ Pre-built Suggestions',
        desc: 'Quickly tap the predefined chips (+ Groceries, + Utilities, + Education) to add categories with one tap.',
      },
      {
        title: '📊 Dynamic Charts',
        desc: 'Your Category Donut chart and Top Spending list automatically adapt to your custom categories and colors.',
      },
    ],
    highlightNote:
      '📍 Live Demo: See the color picker palette and category list above with custom emoji badges.',
    primaryButton: 'Next: Payment Methods →',
  },
  {
    id: 'payment_methods',
    title: '3. Payment Methods (Multi-Wallet) 💳',
    badge: 'Live Manager Demo',
    icon: '💳',
    type: 'payment',
    description:
      'The Payment Method Manager is open above! Know where your money is coming from and where it is going across all your physical and digital accounts.',
    features: [
      {
        title: '📱 Digital Wallets & Mobile Banking',
        desc: 'Create dedicated methods for bKash 📱, Nagad 📱, Rocket, Upay, etc.',
      },
      {
        title: '🏦 Bank & Card Accounts',
        desc: 'Separate credit card purchases from cash or bank transfers.',
      },
      {
        title: '📋 Transaction History Filtering',
        desc: 'Filter past transactions by payment method in the History tab to audit your account balances.',
      },
    ],
    highlightNote:
      '📍 Live Demo: See the payment method options (Cash 💵, bKash 📱, Bank 🏦, Card 💳) in the list above.',
    primaryButton: 'Next: Recurring Expenses →',
  },
  {
    id: 'recurring_expenses',
    title: '4. Recurring Expenses & 1-Tap Quick-Fill 🔄',
    badge: 'Live Manager Demo',
    icon: '⚡',
    type: 'recurring',
    description:
      'The Recurring Expense Manager is open above! Automate regular bills so you never have to re-type identical amounts.',
    features: [
      {
        title: '🔄 Set Up Monthly Bill Templates',
        desc: 'Save fixed expenses like WiFi (৳1,500), Apartment Rent (৳15,000), Gym, or Subscriptions.',
      },
      {
        title: '⚡ 1-Tap Quick-Fill Chips',
        desc: 'When logging an expense in the form, selecting that category reveals instant suggestion chips to auto-fill the whole form in 1 tap!',
      },
      {
        title: '💡 Time Saver',
        desc: 'Log frequent daily expenses in under 3 seconds with zero manual number typing.',
      },
    ],
    highlightNote:
      '📍 Live Demo: See the recurring templates (WiFi ৳1,500, Rent ৳15,000, Gym ৳2,000) loaded in the manager above.',
    primaryButton: 'Next: Settings & Themes →',
  },
  {
    id: 'settings_hub',
    title: '5. Settings Hub & Personalization ⚙️',
    badge: 'Live Settings Demo',
    icon: '🛠️',
    type: 'settings',
    description:
      'The Settings Panel is open above! Your centralized control center for all 4 Data Managers and appearance customization.',
    features: [
      {
        title: '🎨 4 Bespoke Themes',
        desc: 'Switch between Dark Charcoal 🌙, Deep Blue Navy 🌊, Pure OLED Black 🖤, and Crisp Light ☀️.',
      },
      {
        title: '👤 Account & Profile Security',
        desc: 'Update your name, change password, link Google Sign-In, or manage sessions.',
      },
      {
        title: '🎓 Replay Start Guide',
        desc: 'Need a refresher later? Replay this Data Management Tour anytime under "Help & Start Guide".',
      },
    ],
    highlightNote:
      '📍 Live Demo: See the Appearance theme switcher, Data Management shortcuts, and Help section above.',
    primaryButton: 'Finish & Build Setup →',
  },
  {
    id: 'ready',
    title: 'Ready to Build Your Setup! 🎉',
    badge: 'All Set',
    icon: '🚀',
    type: 'ready',
    description:
      'You are now equipped with full knowledge of HisabKitab’s Data Management tools!',
    stepsToStart: [
      '1️⃣ Create your first chapter (e.g. Current Month).',
      '2️⃣ Add your starting Balance.',
      '3️⃣ Visit Settings to customize your Categories and Payment Methods.',
      '4️⃣ Start recording your expenses with ease!',
    ],
    highlightNote:
      '👉 Tap "Create First Chapter" below to launch the Chapter Manager and start tracking!',
    primaryButton: '➕ Create My First Chapter 📖',
    secondaryButton: 'Go to Dashboard 🏠',
  },
];

export default function GuidedTour({
  isActive,
  currentStepIndex = 0,
  onStepChange,
  onComplete,
  onSkip,
}) {
  const [internalStep, setInternalStep] = useState(currentStepIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    setInternalStep(currentStepIndex);
  }, [currentStepIndex]);

  const step = TOUR_STEPS[internalStep] || TOUR_STEPS[0];
  const isFirstStep = internalStep === 0;
  const isLastStep = internalStep === TOUR_STEPS.length - 1;
  const isModalView = internalStep >= 1 && internalStep <= 5;

  const goToStep = (newIndex) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setInternalStep(newIndex);
      if (onStepChange) onStepChange(newIndex);
      setIsTransitioning(false);
    }, 120);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (!isLastStep) handleNext();
      } else if (e.key === 'ArrowLeft') {
        if (!isFirstStep) handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, internalStep, isFirstStep, isLastStep]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete(true);
      return;
    }
    goToStep(internalStep + 1);
  };

  const handlePrev = () => {
    if (isFirstStep) return;
    goToStep(internalStep - 1);
  };

  const handleSkip = () => {
    if (onSkip) onSkip();
    else if (onComplete) onComplete({ openChapterManager: false });
  };

  const handleComplete = (openChapterManager = false) => {
    if (onComplete) {
      onComplete({ openChapterManager });
    }
  };

  // Manage body class for smart side-by-side positioning
  useEffect(() => {
    if (isActive && isModalView) {
      document.body.classList.add('tour-active-modal');
    } else {
      document.body.classList.remove('tour-active-modal');
    }
    return () => {
      document.body.classList.remove('tour-active-modal');
    };
  }, [isActive, isModalView]);

  if (!isActive || !step) return null;

  return (
    <div className="tour-portal" role="dialog" aria-modal="true" aria-label="Data Management Guide">
      {/* Dimmed Backdrop (only on centered steps) */}
      {!isModalView && <div className="tour-backdrop" onClick={handleSkip} />}

      {/* Tour Card */}
      <div
        ref={cardRef}
        className={`tour-card ${
          isModalView ? 'tour-card--docked-side' : 'tour-card--center'
        } ${isTransitioning ? 'tour-card--transitioning' : ''}`}
      >
        {/* Card Header */}
        <div className="tour-card__header">
          <div className="tour-card__tag">
            <span className="tour-card__icon">{step.icon}</span>
            <span className="tour-card__step-num">
              {step.badge || `Step ${internalStep + 1} of ${TOUR_STEPS.length}`}
            </span>
          </div>

          <div className="tour-card__header-right">
            <span className="tour-step-counter">
              {internalStep + 1} / {TOUR_STEPS.length}
            </span>
            <button
              type="button"
              className="tour-card__close"
              onClick={handleSkip}
              title="Close tour"
              aria-label="Close tour"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="tour-card__body">
          <h3 className="tour-card__title">{step.title}</h3>
          <p className="tour-card__desc">{step.description}</p>

          {/* Overview Pillars (Step 1) */}
          {step.pillars && (
            <div className="tour-pillars-grid">
              {step.pillars.map((p, idx) => (
                <div key={idx} className="tour-pillar-card">
                  <div className="tour-pillar-icon">{p.icon}</div>
                  <div className="tour-pillar-content">
                    <strong className="tour-pillar-title">{p.title}</strong>
                    <span className="tour-pillar-desc">{p.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Detailed Features List (Steps 2-6) */}
          {step.features && (
            <div className="tour-features-list">
              {step.features.map((f, idx) => (
                <div key={idx} className="tour-feature-item">
                  <span className="tour-feature-bullet">•</span>
                  <div className="tour-feature-text">
                    <strong>{f.title}</strong>: {f.desc}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Steps to Start (Step 7) */}
          {step.stepsToStart && (
            <div className="tour-steps-checklist">
              {step.stepsToStart.map((item, idx) => (
                <div key={idx} className="tour-checklist-item">
                  {item}
                </div>
              ))}
            </div>
          )}

          {/* Highlight Callout Box */}
          {step.highlightNote && (
            <div className="tour-card__highlight-note">
              {step.highlightNote}
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="tour-card__footer">
          {/* Step Progress Dots */}
          <div className="tour-dots">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                className={`tour-dot ${idx === internalStep ? 'tour-dot--active' : ''} ${
                  idx < internalStep ? 'tour-dot--visited' : ''
                }`}
                onClick={() => goToStep(idx)}
                aria-label={`Go to step ${idx + 1}`}
                title={`Step ${idx + 1}: ${s.title}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="tour-actions">
            {!isFirstStep && (
              <button
                type="button"
                className="btn btn--secondary btn--sm tour-btn-prev"
                onClick={handlePrev}
              >
                ← Back
              </button>
            )}

            {!isLastStep ? (
              <>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm tour-btn-skip"
                  onClick={handleSkip}
                >
                  Skip
                </button>
                <button
                  type="button"
                  className="btn btn--primary btn--sm tour-btn-next"
                  onClick={handleNext}
                >
                  {step.primaryButton || 'Next →'}
                </button>
              </>
            ) : (
              <div className="tour-actions--final">
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => handleComplete(false)}
                >
                  {step.secondaryButton || 'Dashboard 🏠'}
                </button>
                <button
                  type="button"
                  className="btn btn--primary btn--sm tour-btn-finish"
                  onClick={() => handleComplete(true)}
                >
                  {step.primaryButton || '➕ Create Chapter'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
