/**
 * Utilitaire pour gérer les URLs d'images des podcasts
 * Gère à la fois les chemins relatifs du backend et les URLs complètes
 */

// Normalise REACT_APP_API_URL en une base SANS /api (ex: https://api.throwback-connect.com)
const getApiBaseUrl = () => {
  let apiUrl = process.env.REACT_APP_API_URL || 'https://api.throwback-connect.com';
  // Ajoute le protocole si manquant
  if (!/^https?:\/\//i.test(apiUrl)) {
    apiUrl = `https://${apiUrl}`;
  }
  // Supprime un éventuel suffixe /api ou /api/
  apiUrl = apiUrl.replace(/\/api\/?$/i, '');
  // Supprime le / final
  apiUrl = apiUrl.replace(/\/$/, '');
  return apiUrl;
};

// Retourne la base AVEC /api (ex: https://api.throwback-connect.com/api)
export const getApiEndpoint = () => `${getApiBaseUrl()}/api`;

/**
 * Construit l'URL complète d'une image
 * @param {string} imagePath - Le chemin de l'image (peut être relatif ou absolu)
 * @returns {string} - L'URL complète de l'image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return '/images/podcast-default.jpg';
  }

  // Déjà absolue
  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  // Chemins locaux de build
  if (imagePath.startsWith('/images/') || imagePath.startsWith('/assets/')) {
    return imagePath;
  }

  // Chemin d'upload backend
  if (imagePath.startsWith('/uploads/')) {
    return `${getApiBaseUrl()}${imagePath}`;
  }

  // Fichier stocké sans /uploads/ (ex: nomDeFichier.jpg)
  if (!imagePath.startsWith('/')) {
    return `${getApiBaseUrl()}/uploads/podcasts/${imagePath}`;
  }

  // Par défaut
  return `${getApiBaseUrl()}${imagePath}`;
};

/**
 * Détecte la source vidéo (plateforme et ID) à partir d'une URL
 * @param {string} url
 * @returns {{platform:string, videoId:string|null}}
 */
export const detectVideoSource = (url) => {
  try {
    if (!url) return { platform: '', videoId: null };
    const videoUrl = new URL(url);
    const hostname = videoUrl.hostname.toLowerCase();

    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      let videoId;
      if (hostname.includes('youtu.be')) videoId = videoUrl.pathname.substring(1);
      else if (videoUrl.pathname.includes('/embed/')) videoId = videoUrl.pathname.split('/embed/')[1];
      else if (videoUrl.pathname.includes('/shorts/')) videoId = videoUrl.pathname.split('/shorts/')[1];
      else videoId = videoUrl.searchParams.get('v');
      return { platform: 'YOUTUBE', videoId };
    } else if (hostname.includes('vimeo.com')) {
      const pathParts = videoUrl.pathname.split('/').filter(Boolean);
      return { platform: 'VIMEO', videoId: pathParts[0] };
    } else if (hostname.includes('dailymotion.com')) {
      const pathParts = videoUrl.pathname.split('/').filter(Boolean);
      let videoId = pathParts[pathParts.length - 1];
      if (videoId.includes('video/')) videoId = videoId.split('video/')[1];
      return { platform: 'DAILYMOTION', videoId };
    }

    return { platform: 'OTHER', videoId: null };
  } catch {
    return { platform: '', videoId: null };
  }
};

/**
 * Obtient l'URL de la thumbnail automatique pour une vidéo
 */
export const getVideoThumbnailUrl = (platform, videoId) => {
  if (!platform || !videoId) return '/images/podcast-default.jpg';
  switch ((platform || '').toUpperCase()) {
    case 'YOUTUBE':
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    case 'VIMEO':
      return '/images/vimeo-placeholder.jpg';
    case 'DAILYMOTION':
      return `https://www.dailymotion.com/thumbnail/video/${videoId}`;
    default:
      return '/images/podcast-default.jpg';
  }
};

/**
 * Obtient la meilleure thumbnail à afficher pour un podcast
 */
export const getPodcastThumbnail = (podcast) => {
  if (podcast.coverImage && !podcast.coverImage.includes('podcast-default.jpg')) {
    return getImageUrl(podcast.coverImage);
  }
  if (podcast.thumbnailUrl) {
    return getImageUrl(podcast.thumbnailUrl);
  }
  if (podcast.platform && podcast.videoId) {
    return getVideoThumbnailUrl(podcast.platform, podcast.videoId);
  }
  if (podcast.videoUrl) {
    const { platform, videoId } = detectVideoSource(podcast.videoUrl);
    return getVideoThumbnailUrl(platform, videoId);
  }
  return '/images/podcast-default.jpg';
};
