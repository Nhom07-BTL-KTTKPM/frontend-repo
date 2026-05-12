export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  displayOrder?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  originCountry?: string;
  websiteUrl?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category extends CategoryResponse {}
export interface Brand extends BrandResponse {}

// Lightweight projections returned by /summary endpoints
export interface BrandSummaryResponse {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface CategorySummaryResponse {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
}

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
