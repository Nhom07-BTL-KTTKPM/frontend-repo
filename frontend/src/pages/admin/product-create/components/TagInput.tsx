import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { FieldShell } from './FieldShell';
import type { ProductCreateFormValues } from '../productCreate.schema';

type TagInputProps = {
  name: 'suitableSkinTypes' | 'skinConcerns';
  label: string;
  hint?: string;
  placeholder: string;
  suggestions: string[];
};

export const TagInput = ({ name, label, hint, placeholder, suggestions }: TagInputProps) => {
  const { watch, setValue, formState } = useFormContext<ProductCreateFormValues>();
  const [draft, setDraft] = useState('');
  const items = watch(name) || [];
  const fieldError = useMemo(() => {
    const error = formState.errors[name];
    return typeof error?.message === 'string' ? error.message : undefined;
  }, [formState.errors, name]);

  const addItem = (value: string) => {
    const nextValue = value.trim();
    if (!nextValue || items.includes(nextValue) || items.length >= 8) {
      return;
    }

    setValue(name, [...items, nextValue], { shouldDirty: true, shouldValidate: true });
    setDraft('');
  };

  const removeItem = (value: string) => {
    setValue(name, items.filter((item) => item !== value), { shouldDirty: true, shouldValidate: true });
  };

  return (
    <FieldShell label={label} hint={hint} error={fieldError}>
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => removeItem(item)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
            >
              {item}
              <X size={12} />
            </button>
          ))}
          {items.length === 0 ? <span className="text-sm text-slate-400">Chưa có mục nào.</span> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ',') {
                event.preventDefault();
                addItem(draft);
              }
            }}
            placeholder={placeholder}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
          />

          <button
            type="button"
            onClick={() => addItem(draft)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={14} />
            Thêm
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addItem(suggestion)}
              className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:border-amber-300 hover:bg-amber-100"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </FieldShell>
  );
};
