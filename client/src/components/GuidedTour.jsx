import { useState, useEffect, useCallback, useRef } from 'react';

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to HisabKitab! 👋',
    icon: '🌟',
    description:
      'HisabKitab is your personal smart spending tracker. Let’s take a quick 1-minute tour to help you master all the options and track your money effortlessly!',
    target: null, // Centered modal
    position: 'center',
    tip: '💡 You can skip or replay this tour anytime from Settings.',
  },
  {
    id: 'chapter',
    title: 'Chapters (Tracking Books) 📖',
    icon: '📖',
    description:
      'Organize your finances into Chapters — like monthly tracking (e.g., "August 2026"), semesters, or trip budgets. Every balance and expense belongs to your active chapter.',
    target: '.chapter-selector',
    fallbackTarget: '.header__nav',
    position: 'bottom',
    tip: '💡 Create multiple chapters and switch between them anytime.',
  },
  {
    id: 'summary',
    title: 'Financial Overview & Budget 💰',
    icon: '📊',
    description:
      'Monitor your Total Balance, Total Spent, and Remaining money in real-time. The live progress bar warns you before you exceed your budget limit.',
    target: '.summary-grid',
    fallbackTarget: '.app-container',
    position: 'bottom',
    tip: '💡 Instant calculations for every entry you make.',
  },
  {
    id: 'actions',
    title: 'Quick Income & Expense Entry ➕',
    icon: '⚡',
    description:
      'Use these buttons to deposit Balance (salary, income) or log daily Expenses. Each entry can have a category, payment method, date, and note.',
    target: '.add-transaction-banner',
    fallbackTarget: '.bottom-nav__fab-wrapper',
    position: 'top',
    tip: '💡 On mobile, tap the vibrant center (+) button anytime!',
  },
  {
    id: 'charts',
    title: 'Visual Trends & Categories 📈',
    icon: '🎨',
    description:
      'Detailed category donut breakdowns and daily spending bar charts visualize exactly where your money goes so you can save smarter.',
    target: '.charts-grid',
    fallbackTarget: '.top-categories',
    position: 'top',
    tip: '💡 Charts automatically update with each new transaction.',
  },
  {
    id: 'navigation',
    title: 'Navigation & History 🧭',
    icon: '📋',
    description:
      'Switch between your Dashboard overview and full Transaction History to filter, search, edit, or delete any past entry with ease.',
    target: '#bottom-nav',
    fallbackTarget: '.header__brand',
    position: 'top',
    tip: '💡 Detailed transaction history gives you complete financial records.',
  },
  {
    id: 'settings',
    title: 'Settings & Custom Managers ⚙️',
    icon: '🛠️',
    description:
      'Tailor HisabKitab to your lifestyle: switch themes (Dark, Blue, OLED, Light), create custom Categories with emojis, manage Payment Methods (Cash, bKash, Card), and set Recurring Bills.',
    target: '.header__nav .btn--secondary',
    fallbackTarget: '#bottom-nav',
    position: 'bottom',
    tip: '💡 Recurring expenses auto-suggest amounts when adding frequent bills!',
  },
  {
    id: 'ready',
    title: "You're All Set! 🎉",
    icon: '🚀',
    description:
      'You are ready to master your money. Start by creating your first chapter or logging your opening balance.',
    target: null, // Centered modal
    position: 'center',
    tip: '💡 Need help later? Visit Settings → "Help & Start Guide" anytime!',
  },
];

export default function GuidedTour({ isActive, onComplete, onSkip }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const tooltipRef = useRef(null);

  const step = TOUR_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  // Calculate target element position and tooltip location
  const updatePosition = useCallback(() => {
    if (!isActive || !step) return;

    if (!step.target) {
      setTargetRect(null);
      setTooltipStyle({});
      return;
    }

    let el = document.querySelector(step.target);
    if (!el && step.fallbackTarget) {
      el = document.querySelector(step.fallbackTarget);
    }

    if (!el) {
      // Element not found, fallback to center
      setTargetRect(null);
      setTooltipStyle({});
      return;
    }

    // Scroll target into view if needed
    const rect = el.getBoundingClientRect();
    const isOutOfView =
      rect.top < 60 ||
      rect.bottom > window.innerHeight - 60 ||
      rect.left < 0 ||
      rect.right > window.innerWidth;

    if (isOutOfView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }

    // Add padding around target for spotlight
    const padding = 8;
    const adjustedRect = {
      top: Math.max(rect.top - padding, 4),
      left: Math.max(rect.left - padding, 4),
      width: Math.min(rect.width + padding * 2, window.innerWidth - 8),
      height: rect.height + padding * 2,
    };

    setTargetRect(adjustedRect);

    // Compute tooltip position
    const tooltipWidth = Math.min(380, window.innerWidth - 32);
    const spacing = 14;
    let computedTop = 0;
    let computedLeft = Math.max(
      16,
      Math.min(
        adjustedRect.left + adjustedRect.width / 2 - tooltipWidth / 2,
        window.innerWidth - tooltipWidth - 16
      )
    );

    const spaceAbove = adjustedRect.top;
    const spaceBelow = window.innerHeight - (adjustedRect.top + adjustedRect.height);

    if (step.position === 'top' || (spaceAbove > 280 && spaceBelow < 280)) {
      computedTop = Math.max(16, adjustedRect.top - spacing - 260);
    } else {
      computedTop = Math.min(
        window.innerHeight - 280,
        adjustedRect.top + adjustedRect.height + spacing
      );
    }

    setTooltipStyle({
      top: `${computedTop}px`,
      left: `${computedLeft}px`,
      width: `${tooltipWidth}px`,
    });
  }, [isActive, step]);

  useEffect(() => {
    if (!isActive) return;

    // Small delay to allow elements to settle/render
    const timer = setTimeout(() => {
      updatePosition();
    }, 150);

    const handleResize = () => updatePosition();
    const handleScroll = () => updatePosition();

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isActive, currentStepIndex, updatePosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentStepIndex]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
      return;
    }
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStepIndex((prev) => prev + 1);
      setIsTransitioning(false);
    }, 150);
  };

  const handlePrev = () => {
    if (isFirstStep) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStepIndex((prev) => prev - 1);
      setIsTransitioning(false);
    }, 150);
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else if (onComplete) {
      onComplete();
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  if (!isActive) return null;

  return (
    <div className="tour-portal" role="dialog" aria-modal="true" aria-label="Onboarding Tour">
      {/* Dimmed Overlay */}
      <div className="tour-backdrop" onClick={handleSkip} />

      {/* Target Spotlight Highlight Box */}
      {targetRect && (
        <div
          className="tour-spotlight"
          style={{
            top: `${targetRect.top}px`,
            left: `${targetRect.left}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`,
          }}
        />
      )}

      {/* Tour Card Tooltip */}
      <div
        ref={tooltipRef}
        className={`tour-card ${targetRect ? 'tour-card--positioned' : 'tour-card--center'} ${
          isTransitioning ? 'tour-card--transitioning' : ''
        }`}
        style={targetRect ? tooltipStyle : {}}
      >
        {/* Header */}
        <div className="tour-card__header">
          <div className="tour-card__tag">
            <span className="tour-card__icon">{step.icon}</span>
            <span className="tour-card__step-num">
              Step {currentStepIndex + 1} of {TOUR_STEPS.length}
            </span>
          </div>
          <button
            type="button"
            className="tour-card__close"
            onClick={handleSkip}
            title="Skip tour"
            aria-label="Close tour"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="tour-card__body">
          <h3 className="tour-card__title">{step.title}</h3>
          <p className="tour-card__desc">{step.description}</p>
          {step.tip && <div className="tour-card__tip">{step.tip}</div>}
        </div>

        {/* Footer & Actions */}
        <div className="tour-card__footer">
          {/* Step Dots Indicator */}
          <div className="tour-dots">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                className={`tour-dot ${idx === currentStepIndex ? 'tour-dot--active' : ''} ${
                  idx < currentStepIndex ? 'tour-dot--visited' : ''
                }`}
                onClick={() => setCurrentStepIndex(idx)}
                aria-label={`Go to step ${idx + 1}`}
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
                  {isFirstStep ? "Let's Go! →" : 'Next →'}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn--primary btn--sm tour-btn-finish"
                onClick={handleComplete}
              >
                Finish Tour 🚀
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
