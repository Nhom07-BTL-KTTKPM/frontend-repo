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
