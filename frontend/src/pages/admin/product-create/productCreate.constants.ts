export type CatalogOption = {
  id: string;
  name: string;
  slug: string;
};

export const categoryOptions: CatalogOption[] = [
  { id: '4d3e9f5a-7d8d-4f9d-8af2-6f1a1a0f0001', name: 'Skincare', slug: 'skincare' },
  { id: '4d3e9f5a-7d8d-4f9d-8af2-6f1a1a0f0002', name: 'Serum', slug: 'serum' },
  { id: '4d3e9f5a-7d8d-4f9d-8af2-6f1a1a0f0003', name: 'Cleanser', slug: 'cleanser' },
  { id: '4d3e9f5a-7d8d-4f9d-8af2-6f1a1a0f0004', name: 'Moisturizer', slug: 'moisturizer' },
  { id: '4d3e9f5a-7d8d-4f9d-8af2-6f1a1a0f0005', name: 'Sunscreen', slug: 'sunscreen' },
];

export const brandOptions: CatalogOption[] = [
  { id: '8b7d9b2e-1d4d-4baf-9a1f-6d1a1a0f0001', name: 'CeraVe', slug: 'cerave' },
  { id: '8b7d9b2e-1d4d-4baf-9a1f-6d1a1a0f0002', name: 'La Roche-Posay', slug: 'la-roche-posay' },
  { id: '8b7d9b2e-1d4d-4baf-9a1f-6d1a1a0f0003', name: 'The Ordinary', slug: 'the-ordinary' },
  { id: '8b7d9b2e-1d4d-4baf-9a1f-6d1a1a0f0004', name: 'COSRX', slug: 'cosrx' },
  { id: '8b7d9b2e-1d4d-4baf-9a1f-6d1a1a0f0005', name: 'Innisfree', slug: 'innisfree' },
];

export const skinTypeSuggestions = ['Da dầu', 'Da khô', 'Da hỗn hợp', 'Da nhạy cảm', 'Da thường', 'Da mụn'];

export const skinConcernSuggestions = ['Mụn', 'Thâm nám', 'Lão hóa', 'Dưỡng ẩm', 'Kiểm soát dầu', 'Làm sáng da'];
