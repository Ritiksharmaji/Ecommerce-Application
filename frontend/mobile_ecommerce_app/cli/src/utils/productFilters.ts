import type {Product} from '@/types/models';

export type ProductSort = 'newest' | 'price-asc' | 'price-desc';

export const SORT_OPTIONS: {label: string; value: ProductSort}[] = [
  {label: 'Newest', value: 'newest'},
  {label: 'Price: Low to High', value: 'price-asc'},
  {label: 'Price: High to Low', value: 'price-desc'},
];

export interface ProductFilters {
  search: string;
  /** Category name; empty = all. */
  category: string;
  minPrice: string;
  maxPrice: string;
  sort: ProductSort;
}

export const DEFAULT_FILTERS: ProductFilters = {
  search: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  sort: 'newest',
};

const byNewest = (a: Product, b: Product) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

/** Client-side search, category/price filter and sort (the catalogue is loaded once). */
export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  const query = filters.search.trim().toLowerCase();
  const min = filters.minPrice ? Number(filters.minPrice) : null;
  const max = filters.maxPrice ? Number(filters.maxPrice) : null;

  const list = products.filter(
    p =>
      (!query ||
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)) &&
      (!filters.category || p.category === filters.category) &&
      (min === null || p.price >= min) &&
      (max === null || p.price <= max),
  );

  switch (filters.sort) {
    case 'price-asc':
      return list.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return list.sort((a, b) => b.price - a.price);
    default:
      return list.sort(byNewest);
  }
}

/** Newest products first. */
export const latestProducts = (products: Product[], count: number): Product[] =>
  [...products].sort(byNewest).slice(0, count);
