import React from 'react';

export type NormalizedSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

interface SeverityConfig {
  label: string;
  className: string;
}

const severityConfig: Record<NormalizedSeverity, SeverityConfig> = {
  CRITICAL: { label: 'Critical', className: 'bg-red-100 text-red-700 border border-red-200' },
  HIGH:     { label: 'High',     className: 'bg-orange-100 text-orange-700 border border-orange-200' },
  MEDIUM:   { label: 'Medium',   className: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  LOW:      { label: 'Low',      className: 'bg-blue-100 text-blue-700 border border-blue-200' },
  INFO:     { label: 'Info',     className: 'bg-gray-100 text-gray-600 border border-gray-200' },
};

// Maps every tool's native vocabulary onto one 5-point scale.
// Add new tool severities here as you onboard more scanners.
const severityAliasMap: Record<string, NormalizedSeverity> = {
  // Trivy
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  UNKNOWN: 'INFO',

  // SonarQube
  BLOCKER: 'CRITICAL',
  MAJOR: 'HIGH',
  MINOR: 'LOW',

  // Semgrep
  ERROR: 'HIGH',
  WARNING: 'MEDIUM',
  INFO: 'INFO',

  // Gitleaks reports everything as HIGH already — covered above
};

export function normalizeSeverity(raw?: string | null): NormalizedSeverity {
  if (!raw) return 'INFO';
  const key = raw.trim().toUpperCase();
  return severityAliasMap[key] ?? 'INFO';
}

interface SeverityCardProps {
  title?: string | null;       // raw severity string from a finding, e.g. ele.severity
  value?: string | number;
  description?: string;
  className?: string;
}

function SeverityCard({ title, value, description, className }: SeverityCardProps) {
  const normalized = normalizeSeverity(title);
  const config = severityConfig[normalized];
  console.log(config)

  return (
    <div className={`rounded-lg p-4 border border-gray-200 ${className ?? ''} ${config.className} max-h-14`}>
      <div className="flex items-center justify-between">
        {value !== undefined && (
          <span className="text-2xl font-semibold text-gray-900">{value}</span>
        )}
        <span className={`text-xs font-medium px-2 py-1 rounded-full `}>
          {config.label}
        </span>
      </div>
      {description && (
        <div className="text-xs text-gray-400 mt-1">{description}</div>
      )}
      {/* Fallback: if no config.label styling is desired and you just want the raw text shown */}
      {!value && !description && (
        <span className="sr-only">{title}</span>
      )}
    </div>
  );
}

export default SeverityCard;