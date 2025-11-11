// utils/imageHelper.js

/**
 * Fonction helper pour construire les URLs d'images depuis le backend
 * @param {string} imagePath - Chemin de l'image (ex: "/uploads/profiles/...")
 * @returns {string} - URL complète de l'image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // Si l'image est déjà une URL complète (http/https), la retourner telle quelle
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Obtenir l'URL de base du backend depuis les variables d'environnement
  const baseURL = process.env.REACT_APP_API_URL || 'https://api.throwback-connect.com';
  
  // Nettoyer les slashes en double
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  const cleanBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  
  return `${cleanBaseURL}${cleanPath}`;
};

/**
 * Fonction pour obtenir l'avatar d'un utilisateur
 * @param {object} user - Objet utilisateur
 * @returns {string|null} - URL de l'avatar ou null
 */
export const getUserAvatarUrl = (user) => {
  if (!user || !user.photo_profil) return null;
  return getImageUrl(user.photo_profil);
};

/**
 * Fonction pour obtenir l'URL d'un média de post
 * @param {string} mediaPath - Chemin du média
 * @returns {string|null} - URL du média ou null
 */
export const getPostMediaUrl = (mediaPath) => {
  if (!mediaPath) return null;
  return getImageUrl(mediaPath);
};

export default {
  getImageUrl,
  getUserAvatarUrl,
  getPostMediaUrl
};