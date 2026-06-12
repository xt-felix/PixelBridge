(function() {
  'use strict';

  var scriptEl = document.currentScript || document.querySelector('script[src*="pixelbridge"]');
  var params = new URL(scriptEl.src).searchParams;
  var SHOP = params.get('shop') || '';
  var SERVER = params.get('server') || scriptEl.src.split('/pixelbridge.js')[0].replace('/pixel', '');

  if (!SHOP) return;

  var SENT = {};
  var PURCHASE_KEY = 'pb_purchased_' + SHOP;
  var CONFIG = null;

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

  // === Meta Pixel (fbevents.js) ===
  function initMetaPixel(pixelId) {
    if (!pixelId || window.fbq) return;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
    (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', pixelId);
    fbq('track', 'PageView');
  }

  function fireMetaEvent(eventName, eventData, eventId) {
    if (!window.fbq || !CONFIG || !CONFIG.meta) return;
    var metaEvent = {
      'page_view': 'PageView',
      'view_item': 'ViewContent',
      'add_to_cart': 'AddToCart',
      'begin_checkout': 'InitiateCheckout',
      'purchase': 'Purchase'
    }[eventName];
    if (!metaEvent) return;

    var customData = {};
    if (eventData.value) customData.value = eventData.value;
    if (eventData.currency) customData.currency = eventData.currency;
    if (eventData.product_id) customData.content_ids = [eventData.product_id];
    if (eventData.product_id) customData.content_type = 'product';
    if (eventData.order_id) customData.order_id = eventData.order_id;
    if (eventData.quantity) customData.num_items = eventData.quantity;

    fbq('track', metaEvent, customData, { eventID: eventId });
  }

  // === TikTok Pixel ===
  function initTikTokPixel(pixelCode) {
    if (!pixelCode || window.ttq) return;
    !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
    ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
    ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
    for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
    ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
    ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;
    ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");
    o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;
    var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
    ttq.load(pixelCode);ttq.page()}(window,document,'ttq');
  }

  function fireTikTokEvent(eventName, eventData, eventId) {
    if (!window.ttq || !CONFIG || !CONFIG.tiktok) return;
    var ttEvent = {
      'page_view': 'Pageview',
      'view_item': 'ViewContent',
      'add_to_cart': 'AddToCart',
      'begin_checkout': 'InitiateCheckout',
      'purchase': 'CompletePayment'
    }[eventName];
    if (!ttEvent || ttEvent === 'Pageview') return;

    var props = {};
    if (eventData.value) props.value = eventData.value;
    if (eventData.currency) props.currency = eventData.currency;
    if (eventData.product_id) props.contents = [{ content_id: eventData.product_id, content_type: 'product', quantity: eventData.quantity || 1 }];

    ttq.track(ttEvent, props, { event_id: eventId });
  }

  // === Core Event Dispatch ===
  function sendEvent(name, data) {
    var dedupKey = name + '_' + (data.product_id || data.order_id || '');
    if (dedup(dedupKey)) return;

    if (name === 'purchase') {
      var orderId = data.order_id || '';
      var purchased = localStorage.getItem(PURCHASE_KEY);
      if (purchased && purchased.indexOf(orderId) >= 0) return;
      localStorage.setItem(PURCHASE_KEY, (purchased || '') + ',' + orderId);
    }

    var eventId = genEventId(name, data.product_id || data.order_id);

    // Browser-side pixels (for platform detection tools & dedup with CAPI)
    fireMetaEvent(name, data, eventId);
    fireTikTokEvent(name, data, eventId);

    // Server-side (CAPI forwarding via our backend)
    send('event', {
      event: name,
      event_id: eventId,
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

  // === Init: fetch config then start ===
  function init() {
    fetch(SERVER + '/api/pixel/config?shop=' + SHOP)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        CONFIG = data;
        // Load browser-side pixels
        if (data.meta && data.meta.pixelId) {
          initMetaPixel(data.meta.pixelId);
        }
        if (data.tiktok && data.tiktok.pixelCode) {
          initTikTokPixel(data.tiktok.pixelCode);
        }
        // Start tracking
        sendBridge();
        sendEvent('page_view', {});
        subscribeShopline();
      })
      .catch(function() {
        // Even if config fetch fails, still do basic tracking
        sendBridge();
        sendEvent('page_view', {});
        subscribeShopline();
      });
  }

  init();
})();
