/**
 * Removes HTML tags from a string and truncates it to a specified length.
 * Useful for generating SEO meta descriptions from rich text content.
 */
export function truncateHtmlToText(html: string | null | undefined, maxLength: number = 160): string {
    if (!html) return '';
    
    // 1. Remove all HTML tags
    const textOnly = html.replace(/<[^>]*>?/gm, ' ');
    
    // 2. Decode common HTML entities
    const decodedText = textOnly
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    // 3. Remove extra whitespaces/newlines
    const cleanText = decodedText.replace(/\s+/g, ' ').trim();
    
    // 4. Truncate if necessary
    if (cleanText.length <= maxLength) return cleanText;
    
    // Truncate and add ellipsis, trying not to cut off in the middle of a word
    const truncated = cleanText.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > 0) {
        return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
}
