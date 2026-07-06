import { describe, it, expect } from 'vitest';
import { buildPixelScript } from '@/pixel/axon-pixel-template';

describe('buildPixelScript', () => {
  const defaultOpts = { pixelKey: 'test_key_123', categoryId: 200, statsUrl: 'https://app.com/api/stats?shop=myshop' };

  describe('configuration embedding', () => {
    it('embeds pixel key', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('var PIXEL_KEY="test_key_123"');
    });

    it('embeds category ID', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('var CATEGORY_ID=200');
    });

    it('embeds stats URL', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('var REPORT_URL="https://app.com/api/stats?shop=myshop"');
    });

    it('handles empty stats URL', () => {
      const script = buildPixelScript({ ...defaultOpts, statsUrl: '' });
      expect(script).toContain('var REPORT_URL=""');
    });

    it('handles special characters in pixel key', () => {
      const script = buildPixelScript({ ...defaultOpts, pixelKey: 'key_with-dash.dot' });
      expect(script).toContain('var PIXEL_KEY="key_with-dash.dot"');
    });
  });

  describe('Axon SDK loading', () => {
    it('loads primary axon pixel.js', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('https://s.axon.ai/pixel.js');
    });

    it('loads fallback loader', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('https://c.albss.com/p/l/loader.iife.js');
    });

    it('initializes axon', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('axon("init")');
    });
  });

  describe('event tracking', () => {
    it('tracks page_view', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('axon("track","page_view")');
    });

    it('tracks add_to_cart', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('axon("track","add_to_cart"');
    });

    it('tracks begin_checkout', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('axon("track","begin_checkout"');
    });

    it('tracks purchase', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('axon("track","purchase"');
    });

    it('tracks view_item', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('axon("track","view_item"');
    });
  });

  describe('Add to Cart detection layers', () => {
    it('has fetch/XHR interception', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('handleCartInterception');
      expect(script).toContain('window.fetch=function');
      expect(script).toContain('XMLHttpRequest.prototype.open');
    });

    it('has PerformanceObserver fallback', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('PerformanceObserver');
    });

    it('has click listener fallback', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('form[action*="/cart"]');
    });

    it('has Shopline Analytics subscribeV2', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('Shopline.Analytics.subscribeV2');
      expect(script).toContain('"AddToCart"');
    });
  });

  describe('purchase handling', () => {
    it('includes SHA-256 hashing for user_data', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('crypto.subtle.digest("SHA-256"');
    });

    it('includes purchase deduplication via localStorage', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('_axon_sent_');
      expect(script).toContain('localStorage.getItem(dk)');
    });

    it('includes transaction_id in purchase event', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('transaction_id');
    });
  });

  describe('stats reporting', () => {
    it('uses navigator.sendBeacon for reporting', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('navigator.sendBeacon');
    });

    it('flushes on visibility change', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('visibilitychange');
    });

    it('flushes on page hide', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('pagehide');
    });

    it('has 5-minute flush interval', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('var FLUSH_INTERVAL=300000');
    });
  });

  describe('deduplication', () => {
    it('has event deduplication logic', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('isDuplicate');
      expect(script).toContain('recentEvents');
    });

    it('uses 3-second dedup window', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('3000');
    });
  });

  describe('cookie propagation', () => {
    it('propagates _axwrt cookie', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('_axwrt=');
    });
  });

  describe('output format', () => {
    it('wraps in IIFE', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script.startsWith('(function(){')).toBe(true);
      expect(script.endsWith('})();')).toBe(true);
    });

    it('uses strict mode', () => {
      const script = buildPixelScript(defaultOpts);
      expect(script).toContain('"use strict"');
    });
  });
});
