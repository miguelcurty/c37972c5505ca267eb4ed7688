(function(d){var r=d.documentElement;if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches){r.className+=" js anim";setTimeout(function(){if(!window.__ci){r.classList.remove("anim","hero-go")}},1500)}})(document)

window.addEventListener('error', function (e) {
  var t = e && e.target;
  if (t && t.tagName === 'SCRIPT' && t.getAttribute('src') === 'script.js') {
    document.documentElement.classList.remove('anim', 'hero-go');
  }
}, true);
