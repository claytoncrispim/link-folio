import { type ApiRequestStatus } from '../apiClient';

type RequestStatusNoticeProps = {
    status: ApiRequestStatus;
    className?: string;
    compact?: boolean;
};

const phaseTheme: Record<Exclude<ApiRequestStatus['phase'], 'idle'>, { wrapper: string; pill: string; title: string }> = {
    requesting: {
        wrapper: 'border-slate-700 bg-slate-900 text-slate-200',
        pill: 'bg-slate-700 text-slate-100',
        title: 'Connecting',
    },
    warming: {
        wrapper: 'border-amber-700 bg-amber-950/60 text-amber-200',
        pill: 'bg-amber-700 text-amber-100',
        title: 'Waking server',
    },
    retrying: {
        wrapper: 'border-amber-700 bg-amber-950/60 text-amber-200',
        pill: 'bg-amber-700 text-amber-100',
        title: 'Retrying',
    },
    success: {
        wrapper: 'border-emerald-700 bg-emerald-950/60 text-emerald-200',
        pill: 'bg-emerald-700 text-emerald-100',
        title: 'Ready',
    },
    error: {
        wrapper: 'border-red-700 bg-red-950/60 text-red-200',
        pill: 'bg-red-700 text-red-100',
        title: 'Error',
    },
};

const RequestStatusNotice = ({ status, className = '', compact = false }: RequestStatusNoticeProps) => {
    if (status.phase === 'idle') {
        return null;
    }

    const theme = phaseTheme[status.phase];
    const wrapperClasses = compact
        ? 'rounded-xl border px-3 py-2'
        : 'rounded-2xl border px-4 py-3 shadow-sm';

    return (
        <div className={`${wrapperClasses} ${theme.wrapper} ${className}`.trim()} role="status" aria-live="polite">
            <div className="flex items-start gap-3">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${theme.pill}`}>
                    {theme.title}
                </span>
                <div className="min-w-0 text-left">
                    <p className="text-sm font-medium">{status.label}</p>
                    {!compact && status.detail && (
                        <p className="mt-1 text-xs leading-5 opacity-90">{status.detail}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RequestStatusNotice;