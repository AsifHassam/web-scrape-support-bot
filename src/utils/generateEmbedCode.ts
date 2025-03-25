
/**
 * Generates an HTML script tag to embed the chatbot widget
 * @param botId The unique identifier for the bot to be embedded
 * @returns A string containing the HTML script tag
 */
export const generateEmbedCode = (botId: string): string => {
  // Get the origin from the environment if available, or use a default
  const deployedOrigin = window.location.origin;
  
  // The script tag with the bot ID as a data attribute
  return `<script 
  src="${deployedOrigin}/widget-script.js" 
  data-bot-id="${botId}" 
  defer
></script>`;
};
