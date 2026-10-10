import type {Product} from '../src/types/models';
import {DEFAULT_FILTERS, filterProducts, latestProducts} from '../src/utils/productFilters';
import {normalizeProduct} from '../src/utils/normalize';

const product = (overrides: Partial<Product>): Product =>
  normalizeProduct({_id: overrides.name, description: '', ...overrides});

const catalogue = [
  product({name: 'Blue Shirt', category: 'Men', price: 20, createdAt: '2026-01-01'}),
  product({name: 'Red Dress', category: 'Women', price: 50, createdAt: '2026-03-01'}),
  product({name: 'Kids Cap', category: 'Kids', price: 10, createdAt: '2026-02-01'}),
];

const names = (list: Product[]) => list.map(p => p.name);

describe('filterProducts', () => {
  it('sorts newest first by default', () => {
    expect(names(filterProducts(catalogue, DEFAULT_FILTERS))).toEqual([
      'Red Dress',
      'Kids Cap',
      'Blue Shirt',
    ]);
  });

  it('filters by search text, category and price range', () => {
    expect(names(filterProducts(catalogue, {...DEFAULT_FILTERS, search: 'shirt'}))).toEqual([
      'Blue Shirt',
    ]);
    expect(names(filterProducts(catalogue, {...DEFAULT_FILTERS, category: 'Women'}))).toEqual([
      'Red Dress',
    ]);
    expect(
      names(filterProducts(catalogue, {...DEFAULT_FILTERS, minPrice: '15', maxPrice: '40'})),
    ).toEqual(['Blue Shirt']);
  });

  it('sorts by price', () => {
    expect(names(filterProducts(catalogue, {...DEFAULT_FILTERS, sort: 'price-asc'}))).toEqual([
      'Kids Cap',
      'Blue Shirt',
      'Red Dress',
    ]);
    expect(names(filterProducts(catalogue, {...DEFAULT_FILTERS, sort: 'price-desc'}))[0]).toBe(
      'Red Dress',
    );
  });

  it('does not mutate the input', () => {
    const copy = [...catalogue];
    filterProducts(catalogue, {...DEFAULT_FILTERS, sort: 'price-asc'});
    latestProducts(catalogue, 2);
    expect(catalogue).toEqual(copy);
  });
});
