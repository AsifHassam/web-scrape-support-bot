/**
 * Normalizes a URL by ensuring it has the proper protocol prefix (http:// or https://)
 */
export const normalizeUrl = (url: string): string => {
  if (!url) return '';
  
  // If the URL already has a protocol, return it as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Otherwise, add https:// as the default protocol
  return `https://${url}`;
};

/**
 * Validates if a string is a valid URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    // Normalize the URL first
    const normalizedUrl = normalizeUrl(url);
    // Try to create a URL object
    new URL(normalizedUrl);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Extracts the domain name from a URL
 */
export const getDomainFromUrl = (url: string): string => {
  try {
    const normalizedUrl = normalizeUrl(url);
    const hostname = new URL(normalizedUrl).hostname;
    return hostname.replace('www.', '');
  } catch (e) {
    return '';
  }
};
