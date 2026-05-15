'use strict';

/* ── Pretty-print HTML ── */
function prettyHTML(htmlStr, doctype) {
  var VOID = {area:1,base:1,br:1,col:1,embed:1,hr:1,img:1,input:1,link:1,meta:1,param:1,source:1,track:1,wbr:1};
  var tab = '  ';
  var doc = new DOMParser().parseFromString(htmlStr, 'text/html');
  function serNode(node, level) {
    var pad = tab.repeat(level);
    if (node.nodeType === 3) { var t = node.textContent.replace(/\s+/g,' ').trim(); return t ? pad+t+'\n' : ''; }
    if (node.nodeType === 8) return pad+'<!--'+node.data+'-->\n';
    if (node.nodeType !== 1) return '';
    var tag = node.tagName.toLowerCase();
    var attrs = '';
    for (var i = 0; i < node.attributes.length; i++) {
      var a = node.attributes[i];
      attrs += ' '+a.name+(a.value?'="'+a.value+'"':'');
    }
    if (VOID[tag]) return pad+'<'+tag+attrs+'>\n';
    var childEls = 0;
    for (var c = node.firstChild; c; c = c.nextSibling) if (c.nodeType===1) childEls++;
    var txt = node.textContent.replace(/\s+/g,' ').trim();
    if (childEls===0 && txt.length<120) return pad+'<'+tag+attrs+'>'+txt+'</'+tag+'>\n';
    if (tag==='script'||tag==='style') {
      var inner = node.textContent.trim();
      return inner ? pad+'<'+tag+attrs+'>\n'+inner+'\n'+pad+'</'+tag+'>\n'
                   : pad+'<'+tag+attrs+'></'+tag+'>\n';
    }
    var out = pad+'<'+tag+attrs+'>\n';
    for (var ch = node.firstChild; ch; ch = ch.nextSibling) out += serNode(ch, level+1);
    return out + pad+'</'+tag+'>\n';
  }
  return (doctype||'<!DOCTYPE html>')+'\n'+serNode(doc.documentElement, 0);
}

/* ── Syntax highlight ── */
function highlightHTML(code) {
  return code
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^(&lt;!DOCTYPE[^\n]*)/gm,'<span class="hd">$1<\/span>')
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g,'<span class="hc">$1<\/span>')
    .replace(/(&lt;\/?[\w][\w-]*)([\s\S]*?)(\/? *&gt;)/g, function(_,tag,attrs,close){
      var sa = attrs.replace(
        /([\w-:@\.#]+)(=)(&quot;[^&]*&quot;)/g,
        '<span class="ha">$1<\/span>$2<span class="hv">$3<\/span>'
      );
      return '<span class="ht">'+tag+'<\/span>'+sa+'<span class="ht">'+close+'<\/span>';
    });
}

/* ── Render với line numbers ── */
function renderWithLines(highlighted) {
  return highlighted.split('\n').map(function(line, i) {
    return '<div class="line"><span class="ln">'+(i+1)+'<\/span><span class="lc">'+line+'<\/span><\/div>';
  }).join('');
}

/* ── Format size ── */
function fmtSize(str) {
  var b = new TextEncoder().encode(str).length;
  return b<1024?b+' B':b<1048576?(b/1024).toFixed(1)+' KB':(b/1048576).toFixed(2)+' MB';
}

/* ── Mode switcher — dùng addEventListener ── */
function setMode(mode) {
  var wrap = document.getElementById('codeWrap');
  wrap.classList.remove('mode-nowrap','mode-wrap','mode-perline');
  wrap.classList.add('mode-'+mode);
  document.querySelectorAll('.mode-btn').forEach(function(b){
    b.classList.toggle('active', b.dataset.mode === mode);
  });
}

/* ── Main ── */
document.addEventListener('DOMContentLoaded', function() {

  /* Gắn event cho mode buttons */
  document.querySelectorAll('.mode-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      setMode(btn.dataset.mode);
    });
  });

  /* Load data */
  chrome.storage.session.get('viewerData', function(result) {
    var res = result.viewerData;
    if (!res) {
      document.getElementById('html-out').textContent = 'No data. Click the extension icon on a web page first.';
      document.getElementById('infoText').textContent = '';
      return;
    }

    document.title = 'Source: ' + res.title;
    document.getElementById('topUrl').textContent = res.url;
    document.getElementById('topUrl').title = res.url;

    var badge = document.getElementById('badge');
    badge.textContent = res.isNextJS ? 'Next.js' : 'Not Next.js';
    badge.className = res.isNextJS ? 'badge' : 'badge no';
    if (res.isNextJS && res.routerType) {
      document.getElementById('routerTag').textContent = res.routerType;
    }

    var rawHTML = (res.doctype||'<!DOCTYPE html>')+'\n'+res.html;
    var pretty = prettyHTML(res.html, res.doctype);
    var lineCount = pretty.split('\n').length;

    document.getElementById('infoText').textContent =
      lineCount.toLocaleString()+' lines  |  '+fmtSize(pretty)+' formatted  |  '+fmtSize(rawHTML)+' raw';

    document.getElementById('html-out').innerHTML = renderWithLines(highlightHTML(pretty));
  });
});