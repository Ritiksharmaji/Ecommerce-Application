import {normalizeOrder, normalizeProduct, normalizeProducts} from '../src/utils/normalize';
import {formatPrice, parseList} from '../src/utils/format';
import {shippingFor} from '../src/constants/app';

describe('normalizeProduct', () => {
  it('fills defaults for partially populated products', () => {
    const p = normalizeProduct({_id: '1', name: 'Cap', price: '9.5'});
    expect(p).toMatchObject({
      _id: '1',
      price: 9.5,
      images: [],
      sizes: [],
      stock: 0,
      ratings: {average: 0, count: 0},
      isActive: true,
    });
  });

  it('reads legacy `image` arrays and category objects', () => {
    const p = normalizeProduct({_id: '2', image: ['a.jpg'], category: {name: 'Men'}});
    expect(p.images).toEqual(['a.jpg']);
    expect(p.category).toBe('Men');
  });

  it('drops null entries', () => {
    expect(normalizeProducts([null, {_id: '3'}])).toHaveLength(1);
    expect(normalizeProducts(undefined)).toEqual([]);
  });
});

describe('normalizeOrder', () => {
  it('replaces deleted products with a placeholder', () => {
    const order = normalizeOrder({_id: 'o', items: [{_id: 'i', product: null}], totalAmount: '12'});
    expect(order.items[0].product).toEqual({images: []});
    expect(order.totalAmount).toBe(12);
  });
});

describe('format helpers', () => {
  it('formats prices and lists', () => {
    expect(formatPrice(12.5)).toBe('$12.50');
    expect(parseList(' S, M ,,L ')).toEqual(['S', 'M', 'L']);
  });

  it('charges shipping only for a non-empty cart', () => {
    expect(shippingFor(0)).toBe(0);
    expect(shippingFor(10)).toBe(2);
  });
});
