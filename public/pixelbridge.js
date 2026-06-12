(function() {
  'use strict';

  var scriptEl = document.currentScript || document.querySelector('script[src*="pixelbridge"]');
  var params = new URL(scriptEl.src).searchParams;
  var SHOP = params.get('shop') || '';
  var SERVER = params.get('server') || scriptEl.src.split('/pixelbridge.js')[0].replace('/pixel', '');

  if (!SHOP) return;

  var SENT = {};
  var PURCHASE_KEY = 'pb_purchased_' + SHOP;

  function getCookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  function getParam(name) {
    var m = location.search.match(new RegExp('[?&]' + name + '=([^&]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  function getAttribution() {
    return {
      fbp: getCookie('_fbp'),
      fbc: getCookie('_fbc') || (getParam('fbclid') ? 'fb.1.' + Date.now() + '.' + getParam('fbclid') : ''),
      gclid: getParam('gclid') || getCookie('_gcl_aw'),
      ttclid: getParam('ttclid') || getCookie('_ttp'),
      axwrt: getCookie('_axwrt'),
    };
  }

  function genEventId(event, extra) {
    return event + '_' + SHOP + '_' + (extra || '') + '_' + Date.now();
  }

  function dedup(key) {
    if (SENT[key] && Date.now() - SENT[key] < 3000) return true;
    SENT[key] = Date.now();
    return false;
  }

  function send(endpoint, data) {
    var url = SERVER + '/api/pixel/' + endpoint;
    var payload = JSON.stringify(data);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, payload);
    } else {
      fetch(url, { method: 'POST', body: payload, keepalive: true });
    }
  }

  function sendEvent(name, data) {
    var dedupKey = name + '_' + (data.product_id || data.order_id || '');
    if (dedup(dedupKey)) return;

    if (name === 'purchase') {
      var orderId = data.order_id || '';
      var purchased = localStorage.getItem(PURCHASE_KEY);
      if (purchased && purchased.indexOf(orderId) >= 0) return;
      localStorage.setItem(PURCHASE_KEY, (purchased || '') + ',' + orderId);
    }

    send('event', {
      event: name,
      event_id: genEventId(name, data.product_id || data.order_id),
      shop: SHOP,
      data: data,
      attribution: getAttribution(),
      ua: navigator.userAgent,
      url: location.href,
      referrer: document.referrer,
      cart_token: getCookie('cart_token') || getCookie('_shopline_cart_token') || '',
      timestamp: Date.now(),
    });
  }

  function sendBridge() {
    var attr = getAttribution();
    if (!attr.fbp && !attr.fbc && !attr.gclid && !attr.ttclid && !attr.axwrt) return;

    send('bridge', {
      shop: SHOP,
      cart_token: getCookie('cart_token') || getCookie('_shopline_cart_token') || '',
      fbp: attr.fbp,
      fbc: attr.fbc,
      gclid: attr.gclid,
      ttclid: attr.ttclid,
      axwrt: attr.axwrt,
      ua: navigator.userAgent,
      url: location.href,
      referrer: document.referrer,
    });
  }

  // Shopline Analytics API
  function subscribeShopline() {
    if (typeof Shopline === 'undefined' || !Shopline.Analytics || !Shopline.Analytics.subscribeV2) {
      setTimeout(subscribeShopline, 500);
      return;
    }

    Shopline.Analytics.subscribeV2('page_viewed', function() {
      sendEvent('page_view', {});
    });

    Shopline.Analytics.subscribeV2('product_viewed', function(e) {
      var p = e && e.productVariant ? e.productVariant : {};
      sendEvent('view_item', {
        product_id: p.product_id || p.id || '',
        name: p.title || p.name || '',
        value: parseFloat(p.price || 0),
        currency: e.currency || 'USD',
      });
    });

    Shopline.Analytics.subscribeV2('product_added_to_cart', function(e) {
      var item = e && e.cartLine ? e.cartLine : {};
      var variant = item.merchandise || {};
      sendEvent('add_to_cart', {
        product_id: variant.product_id || variant.id || '',
        name: variant.title || '',
        value: parseFloat(item.cost?.totalAmount?.amount || variant.price || 0),
        currency: item.cost?.totalAmount?.currencyCode || 'USD',
        quantity: item.quantity || 1,
      });
    });

    Shopline.Analytics.subscribeV2('checkout_started', function(e) {
      var checkout = e || {};
      sendEvent('begin_checkout', {
        value: parseFloat(checkout.totalPrice?.amount || 0),
        currency: checkout.totalPrice?.currencyCode || checkout.currencyCode || 'USD',
      });
    });

    Shopline.Analytics.subscribeV2('checkout_completed', function(e) {
      var checkout = e || {};
      sendEvent('purchase', {
        order_id: checkout.orderNo || checkout.orderId || '',
        value: parseFloat(checkout.totalPrice?.amount || 0),
        currency: checkout.totalPrice?.currencyCode || checkout.currencyCode || 'USD',
      });
    });
  }

  // Fetch/XHR interception fallback for add-to-cart
  var origFetch = window.fetch;
  window.fetch = function() {
    var url = arguments[0];
    if (typeof url === 'string' && url.indexOf('/cart/add') > -1) {
      try {
        var opts = arguments[1] || {};
        var body = opts.body ? JSON.parse(opts.body) : {};
        sendEvent('add_to_cart', {
          product_id: body.id || body.variant_id || '',
          quantity: body.quantity || 1,
        });
      } catch(e) {}
    }
    return origFetch.apply(this, arguments);
  };

  // Init
  sendBridge();
  sendEvent('page_view', {});
  subscribeShopline();
})();
