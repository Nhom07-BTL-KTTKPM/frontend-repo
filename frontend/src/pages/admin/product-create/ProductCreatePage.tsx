import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BadgeCheck, CheckCircle2, Flame, Leaf, Sparkles, WandSparkles } from 'lucide-react';
import { Controller, FormProvider, useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { brandOptions, categoryOptions, skinConcernSuggestions, skinTypeSuggestions } from './productCreate.constants';
import { productCreateSchema, type ProductCreateFormValues } from './productCreate.schema';
import { SectionCard } from './components/SectionCard';
import { FieldShell } from './components/FieldShell';
import { TagInput } from './components/TagInput';
import { ProductVariantEditor } from './components/ProductVariantEditor';
import { ProductImageEditor } from './components/ProductImageEditor';
import { AutoGrowTextarea } from './components/AutoGrowTextarea';

const inputClassName =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100';

const initialValues: ProductCreateFormValues = {
  name: 'Full Spectrum CBD Tincture - Pet Tincture',
  slug: 'full-spectrum-cbd-tincture-pet-tincture',
  categoryId: categoryOptions[0].id,
  brandId: brandOptions[0].id,
  description: 'Mô tả chi tiết sản phẩm, câu chuyện thương hiệu và định vị công dụng cho catalog.',
  ingredients: 'Hemp extract, botanical oil blend, carrier oil',
  usageInstructions: 'Làm sạch da trước khi sử dụng, dùng theo từng bước routine buổi sáng hoặc tối.',
  suitableSkinTypes: ['Da nhạy cảm', 'Da khô'],
  skinConcerns: ['Dưỡng ẩm', 'Làm dịu'],
  isActive: true,
  isFeatured: false,
  variants: [
    {
      sku: 'CBD-PET-30ML',
      variantName: '30ml',
      price: '180000',
      originalPrice: '320000',
      stockQuantity: '12',
      imageUrl: '',
      isActive: true,
    },
  ],
  images: [
    {
      url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80',
      altText: 'Ảnh minh họa sản phẩm',
      displayOrder: '0',
      isPrimary: true,
    },
  ],
};

const formatCurrency = (value: string) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 'Liên hệ';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(parsed);
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const ProductCreatePage = () => {
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [submittedName, setSubmittedName] = useState<string>('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const form = useForm<ProductCreateFormValues>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: initialValues,
    mode: 'onChange',
  });

  const watchedValues = useWatch({ control: form.control });

  useEffect(() => {
    if (isSlugManuallyEdited) {
      return;
    }

    const autoSlug = slugify(watchedValues.name || '');
    form.setValue('slug', autoSlug, { shouldDirty: false, shouldValidate: true });
  }, [form, isSlugManuallyEdited, watchedValues.name]);

  const selectedCategory = useMemo(
    () => categoryOptions.find((item) => item.id === watchedValues.categoryId),
    [watchedValues.categoryId],
  );

  const selectedBrand = useMemo(
    () => brandOptions.find((item) => item.id === watchedValues.brandId),
    [watchedValues.brandId],
  );

  const variantPrices = (watchedValues.variants || [])
    .map((variant) => Number(variant.price))
    .filter((price) => Number.isFinite(price) && price > 0);

  const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : null;
  const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : null;
  const primaryImage = watchedValues.images?.find((item) => item.isPrimary) || watchedValues.images?.[0];

  const onSubmit: SubmitHandler<ProductCreateFormValues> = (values) => {
    setSubmittedAt(new Date().toLocaleString('vi-VN'));
    setSubmittedName(values.name);
  };

  const imageCount = watchedValues.images?.length || 0;
  const variantCount = watchedValues.variants?.length || 0;
  const formChecklist = [
    { label: 'Tên sản phẩm', done: Boolean(watchedValues.name?.trim()) },
    { label: 'Danh mục', done: Boolean(selectedCategory) },
    { label: 'Thương hiệu', done: Boolean(selectedBrand) },
    { label: 'Ảnh đại diện', done: Boolean(primaryImage) },
    { label: 'Biến thể', done: variantCount > 0 },
  ];

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="relative grid gap-6 rounded-[32px] border border-slate-200 bg-[#f8f9fa] p-4 pb-28 shadow-[0_20px_55px_rgba(15,23,42,0.06)] lg:p-6 lg:pb-28">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]">
          <div className="absolute -left-20 top-16 h-52 w-52 rounded-full bg-amber-200/20 blur-3xl" />
          <div className="absolute right-[-40px] top-28 h-64 w-64 rounded-full bg-indigo-200/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-rose-200/15 blur-3xl" />
        </div>

        <header className="relative z-10 grid gap-4 rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_12px_30px_rgba(201,169,110,0.08)] lg:flex lg:items-end lg:justify-between">
          <div className="grid gap-3">
            <Link to="/admin/products" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900">
              <ArrowLeft size={16} />
              Quay lại danh sách sản phẩm
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-900">
                <Sparkles size={12} />
                Xưởng sản phẩm
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                <WandSparkles size={12} />
                Chỉ kiểm tra phía giao diện
              </span>
            </div>

            <div>
              <h1 className="m-0 text-3xl font-bold text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                Thêm sản phẩm mới
              </h1>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Trạng thái</p>
              <p className="m-0 mt-1 text-sm font-bold text-emerald-900">Bản nháp hợp lệ</p>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">Biến thể</p>
              <p className="m-0 mt-1 text-sm font-bold text-indigo-900">{variantCount} mục</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">Hình ảnh</p>
              <p className="m-0 mt-1 text-sm font-bold text-amber-900">{imageCount} ảnh</p>
            </div>
          </div>
        </header>

        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
          <div className="grid gap-6">
            <SectionCard title="Thông tin cốt lõi">
              <div className="grid gap-5 md:grid-cols-2">
                <FieldShell label="Tên sản phẩm" error={form.formState.errors.name?.message} hint="Bắt buộc, tối đa 500 ký tự">
                  <input {...form.register('name')} className={inputClassName} placeholder="Full Spectrum CBD Tincture - Pet Tincture" />
                </FieldShell>

                <FieldShell
                  label="Slug"
                  hint="Tự động sinh theo tên sản phẩm, bạn vẫn có thể sửa tay"
                  error={form.formState.errors.slug?.message}
                  action={
                    isSlugManuallyEdited ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSlugManuallyEdited(false);
                          form.setValue('slug', slugify(form.getValues('name')), { shouldDirty: true, shouldValidate: true });
                        }}
                        className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                      >
                        Dùng slug tự động
                      </button>
                    ) : null
                  }
                >
                  <input
                    {...form.register('slug', {
                      onChange: () => {
                        setIsSlugManuallyEdited(true);
                      },
                    })}
                    className={inputClassName}
                    placeholder="full-spectrum-cbd-tincture-pet-tincture"
                  />
                </FieldShell>

                <FieldShell label="Danh mục" error={form.formState.errors.categoryId?.message}>
                  <select {...form.register('categoryId')} className={inputClassName}>
                    {categoryOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </FieldShell>

                <FieldShell label="Thương hiệu" error={form.formState.errors.brandId?.message}>
                  <select {...form.register('brandId')} className={inputClassName}>
                    {brandOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </FieldShell>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="inline-flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <input {...form.register('isActive')} type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">Đang kinh doanh</span>
                    <span className="block text-xs text-slate-500">Hiển thị sản phẩm trên storefront.</span>
                  </span>
                </label>

                <label className="inline-flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <input {...form.register('isFeatured')} type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">Đánh dấu nổi bật</span>
                    <span className="block text-xs text-slate-500">Ưu tiên hiển thị tại khu vực hero hoặc landing.</span>
                  </span>
                </label>
              </div>
            </SectionCard>

            <SectionCard title="Mô tả và nội dung">
              <div className="grid gap-5">
                <FieldShell label="Mô tả" hint="Mô tả chi tiết sản phẩm" error={form.formState.errors.description?.message}>
                  <Controller
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <AutoGrowTextarea
                        {...field}
                        minHeight={140}
                        maxHeight={300}
                        className={inputClassName}
                        placeholder="Mô tả chi tiết..."
                      />
                    )}
                  />
                </FieldShell>

                <FieldShell label="Thành phần" hint="Thành phần hoặc hoạt chất" error={form.formState.errors.ingredients?.message}>
                  <Controller
                    control={form.control}
                    name="ingredients"
                    render={({ field }) => (
                      <AutoGrowTextarea
                        {...field}
                        minHeight={120}
                        maxHeight={280}
                        className={inputClassName}
                        placeholder="Danh sách thành phần..."
                      />
                    )}
                  />
                </FieldShell>

                <FieldShell label="Hướng dẫn sử dụng" hint="Hướng dẫn sử dụng" error={form.formState.errors.usageInstructions?.message}>
                  <Controller
                    control={form.control}
                    name="usageInstructions"
                    render={({ field }) => (
                      <AutoGrowTextarea
                        {...field}
                        minHeight={120}
                        maxHeight={280}
                        className={inputClassName}
                        placeholder="Cách sử dụng..."
                      />
                    )}
                  />
                </FieldShell>
              </div>
            </SectionCard>

            <SectionCard title="Phân loại AI">
              <div className="grid gap-5">
                <TagInput
                  name="suitableSkinTypes"
                  label="Loại da phù hợp"
                  hint="Tối đa 8 mục, click chip để xoá"
                  placeholder="Ví dụ: Da dầu"
                  suggestions={skinTypeSuggestions}
                />

                <TagInput
                  name="skinConcerns"
                  label="Vấn đề da"
                  hint="Tối đa 8 mục, dùng để gợi ý AI"
                  placeholder="Ví dụ: Mụn"
                  suggestions={skinConcernSuggestions}
                />
              </div>
            </SectionCard>

            <ProductVariantEditor />
          </div>

          <aside className="grid gap-6 lg:sticky lg:top-6 lg:self-start">
            <SectionCard
              title="Ảnh sản phẩm"
              badge={<span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"><BadgeCheck size={12} />Minh họa nội bộ</span>}
            >
              <ProductImageEditor />
            </SectionCard>

            <SectionCard title="Tổng quan giá">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Giá từ</p>
                  <p className="m-0 mt-1 text-lg font-bold text-slate-900">{minPrice !== null ? formatCurrency(String(minPrice)) : 'Liên hệ'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Giá đến</p>
                  <p className="m-0 mt-1 text-lg font-bold text-slate-900">{maxPrice !== null ? formatCurrency(String(maxPrice)) : 'Liên hệ'}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-950">
                <div className="flex items-center gap-2 font-semibold text-amber-900">
                  <Flame size={16} />
                  Lưu ý validate FE
                </div>
                <p className="m-0 text-amber-900/90">
                  Biểu mẫu sẽ chặn tên trống, slug sai định dạng, danh mục hoặc thương hiệu chưa chọn, biến thể thiếu giá hoặc SKU, và ảnh chưa có ảnh đại diện.
                </p>
              </div>
            </SectionCard>

            <SectionCard title="Danh sách kiểm tra">
              <div className="grid gap-3">
                {formChecklist.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.done ? <CheckCircle2 size={12} /> : <Leaf size={12} />}
                      {item.done ? 'Đã đủ' : 'Chưa đủ'}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Xem trước dữ liệu">
              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-950 p-4 text-slate-100 shadow-inner">
                <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                  <span>du-lieu-san-pham</span>
                  <span>{submittedAt ? `Đã lưu lúc ${submittedAt}` : 'Bản nháp'}</span>
                </div>
                <pre className="m-0 overflow-auto text-xs leading-6 text-slate-200">
{JSON.stringify(
  {
    tenSanPham: submittedName || watchedValues.name,
    slug: watchedValues.slug || '(tu-dong-sinh)',
    danhMuc: selectedCategory?.name,
    thuongHieu: selectedBrand?.name,
    dangKinhDoanh: watchedValues.isActive,
    noiBat: watchedValues.isFeatured,
    soBienThe: variantCount,
    soAnh: imageCount,
  },
  null,
  2,
)}
                </pre>
              </div>
            </SectionCard>

          </aside>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:left-[280px]">
          <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-8">
            <p className="m-0 text-sm text-slate-500">
              {form.formState.isValid ? 'Biểu mẫu hợp lệ, có thể lưu ngay.' : 'Biểu mẫu còn lỗi, kiểm tra các trường được tô đỏ.'}
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  form.reset(initialValues);
                  setIsSlugManuallyEdited(false);
                }}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Hủy thay đổi
              </button>

              <button
                type="submit"
                disabled={!form.formState.isValid}
                className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                Thêm sản phẩm
              </button>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};
