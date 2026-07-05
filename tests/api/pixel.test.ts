import { describe, it, expect } from 'vitest';
import { buildPixelScript } from '@/pixel/axon-pixel-template';

describe('buildPixelScript', () => {
  it('embeds pixel key and category ID', () => {
    const script = buildPixelScript({
      pixelKey: 'test_key_123',
      categoryId: 200,
      statsUrl: 'https://example.com/api/stats?shop=myshop',
    });
    expect(script).toContain('var PIXEL_KEY="test_key_123"');
    expect(script).toContain('var CATEGORY_ID=200');
    expect(script).toContain('var REPORT_URL="https://example.com/api/stats?shop=myshop"');
  });

  it('contains axon SDK loader', () => {
    const script = buildPixelScript({ pixelKey: 'k', categoryId: 1, statsUrl: '' });
    expect(script).toContain('https://s.axon.ai/pixel.js');
    expect(script).toContain('axon("init")');
  });

  it('contains page_view tracking', () => {
    const script = buildPixelScript({ pixelKey: 'k', categoryId: 1, statsUrl: '' });
    expect(script).toContain('axon("track","page_view")');
  });

  it('contains add_to_cart fallback layers', () => {
    const script = buildPixelScript({ pixelKey: 'k', categoryId: 1, statsUrl: '' });
    expect(script).toContain('handleCartInterception');
    expect(script).toContain('PerformanceObserver');
    expect(script).toContain('form[action*="/cart"]');
  });
});
