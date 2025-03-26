
export const generateEmbedCode = (botId: string) => {
  return `<script>
  (function(w, d, s, o, f, js, fjs) {
    w['ChatwiseWidget'] = o;
    w[o] = w[o] || function() {
      (w[o].q = w[o].q || []).push(arguments)
    };
    js = d.createElement(s), fjs = d.getElementsByTagName(s)[0];
    js.id = o;
    js.src = f;
    js.async = 1;
    fjs.parentNode.insertBefore(js, fjs);
  }(window, document, 'script', 'cw', 'https://web-scrape-support-bot.lovable.app/widget.js'));
  cw('init', { botId: '${botId}' });
</script>`;
};

export default generateEmbedCode;
