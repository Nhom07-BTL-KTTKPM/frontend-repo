import React from 'react';
import type { CategorySummaryResponse } from '../types/catalog';

interface CategoryCardProps {
  category: CategorySummaryResponse;
  onClick?: (category: CategorySummaryResponse) => void;
}

const iconMap: Record<string, string> = {
  'chăm-sóc-da': '💧',
  'trang-điểm': '💄',
  'chăm-sóc-tóc': '✂️',
  'chăm-sóc-cơ-thể': '🧴',
  'chăm-sóc-nắng': '☀️',
  'bộ-quà-tặng': '🎁',
};

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onClick }) => {
  const icon = iconMap[category.slug.toLowerCase()] || '✨';

  return (
    <div className="category-card" onClick={() => onClick?.(category)}>
      <div className="category-card__icon">{icon}</div>
      <h3 className="category-card__name">{category.name}</h3>
    </div>
  );
};
