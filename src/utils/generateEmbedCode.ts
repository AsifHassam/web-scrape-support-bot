
/**
 * Generates an HTML script tag to embed the chatbot widget
 * @param botId The unique identifier for the bot to be embedded
 * @returns A string containing the HTML script tag
 */
export const generateEmbedCode = (botId: string): string => {
  // Use the public URL if available, otherwise fall back to origin
  const deployedOrigin = "https://web-scrape-support-bot.lovable.app" || window.location.origin;
  
  // The script tag with the bot ID as a data attribute
  return `<script 
  src="${deployedOrigin}/widget-script.js" 
  data-bot-id="${botId}" 
  async
></script>`;
};
