import React from 'react';

export interface Step {
  id: string;
  title: string;
  description?: string;
}

export interface StepperProps {
  steps: Step[];
  currentStepIndex: number;
  onSelectStep?: (index: number) => void;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStepIndex,
  onSelectStep,
  className = '',
}) => {
  return (
    <nav aria-label="Progress" className={`w-full ${className}`}>
      <ol className="space-y-4">
        {steps.map((step, idx) => {
          const isCurrent = idx === currentStepIndex;
          const isDone = idx < currentStepIndex;
          const stepNum = String(idx + 1).padStart(2, '0');

          return (
            <li
              key={step.id}
              className={`pl-3 border-l-[3px] transition-colors ${
                isCurrent
                  ? 'border-l-green bg-paper-sunk/30 py-1 font-semibold text-ink'
                  : isDone
                  ? 'border-l-green/40 text-ink-soft'
                  : 'border-l-rule text-ink-faint'
              }`}
            >
              <div
                className={`flex items-baseline justify-between text-left ${
                  onSelectStep && isDone ? 'cursor-pointer hover:underline' : ''
                }`}
                onClick={() => onSelectStep && isDone && onSelectStep(idx)}
              >
                <div>
                  <span className="font-mono text-xs mr-2">{stepNum}</span>
                  <span className="text-sm">{step.title}</span>
                </div>
                {isDone && (
                  <span className="text-xs font-mono font-medium text-green uppercase tracking-wider">
                    Done
                  </span>
                )}
                {isCurrent && (
                  <span className="text-xs font-mono font-medium text-ink-soft uppercase tracking-wider">
                    Active
                  </span>
                )}
              </div>
              {step.description && (
                <p className="text-[12px] text-ink-soft mt-0.5 pl-6">
                  {step.description}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

