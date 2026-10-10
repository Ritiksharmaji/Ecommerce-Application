import type {IconName} from '@/components/icons';

export type Category = {id: string; name: string; icon: IconName};

/** Must match the `category` enum in expressJs_ecommerce_backend models/Product.ts. */
export const CATEGORIES: Category[] = [
  {id: 'men', name: 'Men', icon: 'man-outline'},
  {id: 'women', name: 'Women', icon: 'woman-outline'},
  {id: 'kids', name: 'Kids', icon: 'happy-outline'},
  {id: 'shoes', name: 'Shoes', icon: 'footsteps-outline'},
  {id: 'bags', name: 'Bags', icon: 'bag-handle-outline'},
  {id: 'other', name: 'Other', icon: 'pricetag-outline'},
];

export const ALL_CATEGORY: Category = {id: 'all', name: 'All', icon: 'grid'};
