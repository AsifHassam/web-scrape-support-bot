
export function generateEmbedCode(botId: string): string {
  const scriptUrl = `${window.location.origin}/widget-script.js?botId=${botId}`;
  
  return `<!-- Support Bot Widget -->
<script>
  (function(w, d, s, o) {
    var js, fjs = d.getElementsByTagName(s)[0];
    w.__supportBot = o || {};
    js = d.createElement(s);
    js.id = 'support-bot-widget-script';
    js.src = "${scriptUrl}";
    js.async = 1;
    fjs.parentNode.insertBefore(js, fjs);
  }(window, document, 'script', { botId: "${botId}" }));
</script>`;
}
