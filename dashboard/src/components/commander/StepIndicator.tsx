'use client';

type Step = 'menu' | 'info' | 'confirm' | 'done';

interface StepIndicatorProps {
  currentStep: Step;
  brandColor: string;
}

const STEPS: { key: Step; label: string; index: number }[] = [
  { key: 'menu', label: 'Menu', index: 0 },
  { key: 'info', label: 'Mes infos', index: 1 },
  { key: 'confirm', label: 'Confirmation', index: 2 },
];

export default function StepIndicator({
  currentStep,
  brandColor,
}: StepIndicatorProps) {
  const currentIndex =
    currentStep === 'done'
      ? 2
      : STEPS.find((s) => s.key === currentStep)?.index ?? 0;

  return (
    <nav aria-label="Étapes de la commande" className="px-4 pt-4 pb-2">
      <ol className="flex items-center justify-between max-w-xs mx-auto">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <li key={step.key} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {/* Trait gauche */}
                {idx > 0 && (
                  <div
                    className="flex-1 h-0.5 transition-colors duration-300"
                    style={{
                      backgroundColor:
                        isCompleted || isCurrent ? brandColor : '#e5e7eb',
                    }}
                  />
                )}

                {/* Pastille */}
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300"
                  style={
                    isCompleted
                      ? { backgroundColor: brandColor, color: '#ffffff' }
                      : isCurrent
                      ? {
                          backgroundColor: brandColor,
                          color: '#ffffff',
                          boxShadow: `0 0 0 3px ${brandColor}33`,
                        }
                      : { backgroundColor: '#e5e7eb', color: '#9ca3af' }
                  }
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    /* Checkmark SVG */
                    <svg
                      viewBox="0 0 12 12"
                      fill="none"
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    >
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>

                {/* Trait droit */}
                {idx < STEPS.length - 1 && (
                  <div
                    className="flex-1 h-0.5 transition-colors duration-300"
                    style={{
                      backgroundColor:
                        currentIndex > idx + 1 || (isCurrent && false)
                          ? brandColor
                          : '#e5e7eb',
                    }}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className="mt-1.5 text-xs font-medium transition-colors duration-300 text-center"
                style={{
                  color: isCurrent
                    ? brandColor
                    : isCompleted
                    ? '#6b7280'
                    : '#9ca3af',
                }}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
