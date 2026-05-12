export interface CatalogProductPage {
  content: CatalogProduct[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
}

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  minPrice?: number;
  maxPrice?: number;
  images?: CatalogProductImage[];
  variants?: CatalogProductVariant[];
}

export interface CatalogProductImage {
  id?: string;
  url: string;
  altText?: string;
  isPrimary?: boolean;
}

export interface CatalogProductVariant {
  id: string;
  productId: string;
  sku?: string;
  variantName?: string;
  price: number;
  originalPrice?: number;
  stockQuantity?: number;
  sold?: number;
  imageUrl?: string;
  isActive?: boolean;
}
