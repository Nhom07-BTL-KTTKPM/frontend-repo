import type { VoucherStatus } from '../types';
import { statusToneMap } from '../voucherData';

export const VoucherStatusBadge = ({ status }: { status: VoucherStatus }) => {
  const tone = statusToneMap[status];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold tracking-[0.18em] ${tone.textClass}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${tone.dotClass}`} />
      {tone.label}
    </span>
  );
};
