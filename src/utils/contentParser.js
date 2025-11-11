// utils/contentParser.js

/**
 * Détecte et transforme les URLs en liens cliquables
 * @param {string} text - Texte à analyser
 * @returns {string} - Texte avec URLs transformées en liens HTML
 */
export const parseLinks = (text) => {
  if (!text) return '';
  
  // Regex pour détecter les URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="content-link">${url}</a>`;
  });
};

/**
 * Détecte et transforme les hashtags en liens cliquables
 * @param {string} text - Texte à analyser
 * @returns {string} - Texte avec hashtags transformés en liens HTML
 */
export const parseHashtags = (text) => {
  if (!text) return '';
  
  // Regex pour détecter les hashtags (lettres, chiffres, accents)
  const hashtagRegex = /#([\w\u00C0-\u017F]+)/g;
  
  return text.replace(hashtagRegex, (match, tag) => {
    return `<a href="/dashboard/wall?hashtag=${encodeURIComponent(tag)}" class="content-hashtag">${match}</a>`;
  });
};

/**
 * Détecte et transforme les mentions d'utilisateurs (@username)
 * @param {string} text - Texte à analyser
 * @returns {string} - Texte avec mentions transformées en liens HTML
 */
export const parseMentions = (text) => {
  if (!text) return '';
  
  // Regex pour détecter les mentions
  const mentionRegex = /@([\w\u00C0-\u017F]+)/g;
  
  return text.replace(mentionRegex, (match, username) => {
    return `<a href="/dashboard/profile/${username}" class="content-mention">${match}</a>`;
  });
};

/**
 * Parse le contenu complet : liens, hashtags et mentions
 * @param {string} text - Texte à analyser
 * @param {object} options - Options de parsing
 * @returns {string} - Texte formaté avec tous les éléments cliquables
 */
export const parseContent = (text, options = {}) => {
  if (!text) return '';
  
  const {
    parseUrls = true,
    parseHashtags = true,
    parseMentions = false
  } = options;
  
  let parsedText = text;
  
  // Échapper les caractères HTML dangereux d'abord
  parsedText = parsedText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  // Convertir les retours à la ligne en <br>
  parsedText = parsedText.replace(/\n/g, '<br>');
  
  // Parser les URLs
  if (parseUrls) {
    parsedText = parseLinks(parsedText);
  }
  
  // Parser les hashtags
  if (parseHashtags) {
    parsedText = parseHashtags(parsedText);
  }
  
  // Parser les mentions
  if (parseMentions) {
    parsedText = parseMentions(parsedText);
  }
  
  return parsedText;
};

/**
 * Extraire tous les hashtags d'un texte
 * @param {string} text - Texte à analyser
 * @returns {Array<string>} - Liste des hashtags (sans le #)
 */
export const extractHashtags = (text) => {
  if (!text) return [];
  
  const hashtagRegex = /#([\w\u00C0-\u017F]+)/g;
  const matches = text.match(hashtagRegex) || [];
  
  return matches.map(tag => tag.substring(1)); // Enlever le #
};

/**
 * Extraire toutes les URLs d'un texte
 * @param {string} text - Texte à analyser
 * @returns {Array<string>} - Liste des URLs
 */
export const extractLinks = (text) => {
  if (!text) return [];
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

export default {
  parseLinks,
  parseHashtags,
  parseMentions,
  parseContent,
  extractHashtags,
  extractLinks
};