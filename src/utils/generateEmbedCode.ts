
/**
 * Generates an HTML script tag to embed the chatbot widget
 * @param botId The unique identifier for the bot to be embedded
 * @returns A string containing the HTML script tag
 */
export const generateEmbedCode = (botId: string): string => {
  // Use the fixed production URL
  const deployedOrigin = "https://web-scrape-support-bot.lovable.app";
  
  // The script tag with the bot ID as a data attribute and proper attributes
  return `<!-- Web Scrape Support Bot Widget - Begin -->
<script 
  src="${deployedOrigin}/widget.js" 
  data-bot-id="${botId}" 
  type="text/javascript"
  async
  defer
></script>
<!-- Place this script just before the closing </body> tag for best performance -->
<!-- Web Scrape Support Bot Widget - End -->`;
};
