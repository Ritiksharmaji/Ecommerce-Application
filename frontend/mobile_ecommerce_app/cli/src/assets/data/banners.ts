export interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle: string;
}

/** Home screen carousel (static marketing content). */
export const BANNERS: Banner[] = [
  {
    id: 'sale',
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop',
    title: '50% Off',
    subtitle: 'On everything today',
  },
  {
    id: 'new-arrivals',
    image:
      'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=1000&auto=format&fit=crop',
    title: 'New Arrivals',
    subtitle: 'Summer Collection',
  },
  {
    id: 'shoes',
    image:
      'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1000&auto=format&fit=crop',
    title: 'Big Sale',
    subtitle: 'Up to 70% off shoes',
  },
];
