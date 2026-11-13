import React from 'react';

export interface DefinitionItem {
  label: string;
  value: React.ReactNode;
  isMono?: boolean;
}

export interface DefinitionListProps {
  items: DefinitionItem[];
  className?: string;
}

export const DefinitionList: React.FC<DefinitionListProps> = ({
  items,
  className = '',
}) => {
  return (
    <dl className={`divide-y divide-rule/60 text-sm font-sans ${className}`}>
      {items.map((item, idx) => (
        <div key={idx} className="py-2.5 flex items-baseline justify-between gap-4">
          <dt className="text-[13px] font-medium text-ink-soft select-none flex-shrink-0">
            {item.label}
          </dt>
          <div className="flex-1 border-b border-dotted border-rule self-center mx-2 h-0" />
          <dd
            className={`text-right text-ink font-medium ${
              item.isMono ? 'font-mono text-xs' : 'text-sm'
            }`}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
};

