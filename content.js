(function () {
  'use strict';
  function isNextJS() {
    if (window.__NEXT_DATA__) return true;
    if (document.getElementById('__NEXT_DATA__')) return true;
    if (document.querySelector('#__next')) return true;
    if (document.querySelector('[data-nextjs-scroll-focus-boundary]')) return true;
    if (document.querySelector('next-route-announcer')) return true;
    if (window.__next_f) return true;
    if (document.querySelector('meta[name="next-size-adjust"]')) return true;
    return (
      Array.from(document.querySelectorAll('script[src]')).some(function(s){ return s.src.indexOf('/_next/')!==-1; }) ||
      Array.from(document.querySelectorAll('link')).some(function(l){ return l.href && l.href.indexOf('/_next/')!==-1; })
    );
  }
  function getRouterType() {
    if (window.__NEXT_DATA__ || document.getElementById('__NEXT_DATA__')) return 'Pages Router';
    if (window.__next_f || document.querySelector('next-route-announcer')) return 'App Router (v13+)';
    return 'Unknown';
  }
  function getNextData() {
    try {
      var el = document.getElementById('__NEXT_DATA__');
      if (el) return JSON.parse(el.textContent);
      if (window.__NEXT_DATA__) return window.__NEXT_DATA__;
    } catch(e) {}
    return null;
  }
  function getNextFData() {
    try { if (window.__next_f && Array.isArray(window.__next_f)) return window.__next_f; } catch(e) {}
    return null;
  }
  function getNextScripts() {
    return Array.from(document.querySelectorAll('script[src]'))
      .map(function(s){ return s.src; })
      .filter(function(s){ return s.indexOf('/_next/')!==-1; });
  }
  chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.action === 'getSourceData') {
      sendResponse({
        isNextJS: isNextJS(), routerType: getRouterType(),
        html: document.documentElement.outerHTML,
        doctype: document.doctype ? '<!DOCTYPE ' + document.doctype.name + '>' : '',
        nextData: getNextData(), nextFData: getNextFData(),
        nextScripts: getNextScripts(), url: location.href, title: document.title
      });
    }
    return true;
  });
})();