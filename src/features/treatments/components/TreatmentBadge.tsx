import type { TreatmentState } from '@/types';

const badgeConfig: Record<TreatmentState, { bg: string; text: string; label: string }> = {
  activo: { bg: 'bg-green-100', text: 'text-green-800', label: 'Activo' },
  suspendido: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Suspendido' },
  finalizado: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Finalizado' },
};

interface TreatmentBadgeProps {
  estado: TreatmentState;
}

export default function TreatmentBadge({ estado }: TreatmentBadgeProps) {
  const config = badgeConfig[estado] ?? badgeConfig.finalizado;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
