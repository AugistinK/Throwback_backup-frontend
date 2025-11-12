/**
 * Utilitaire pour gérer les URLs d'images et l'endpoint API
 * - Normalise REACT_APP_API_URL
 * - Construit des URLs absolues pour /uploads/*
 */

// Normalise REACT_APP_API_URL en une base SANS /api (ex: https://api.throwback-connect.com)
const getApiBaseUrl = () => {
  let apiUrl = process.env.REACT_APP_API_URL || 'https://api.throwback-connect.com';
  // Ajoute https:// si manquant
  if (!/^https?:\/\//i.test(apiUrl)) apiUrl = `https://${apiUrl}`;
  // Supprime /api final
  apiUrl = apiUrl.replace(/\/api\/?$/i, '');
  // Supprime un / final
  apiUrl = apiUrl.replace(/\/$/, '');
  return apiUrl;
};

// Base AVEC /api (ex: https://api.throwback-connect.com/api)
export const getApiEndpoint = () => `${getApiBaseUrl()}/api`;

/**
 * Construit l'URL complète d'une image
 * @param {string} imagePath - relatif (/uploads/...) ou absolu
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '/images/podcast-default.jpg';

  // Déjà absolue
  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  // Assets locaux du front
  if (imagePath.startsWith('/images/') || imagePath.startsWith('/assets/')) {
    return imagePath;
  }

  // Chemin d'upload backend (/uploads/...)
  if (imagePath.startsWith('/uploads/')) {
    return `${getApiBaseUrl()}${imagePath}`;
  }

  // Nom de fichier simple
  if (!imagePath.startsWith('/')) {
    return `${getApiBaseUrl()}/uploads/podcasts/${imagePath}`;
  }

  // Par défaut
  return `${getApiBaseUrl()}${imagePath}`;
};

/**
 * Détecte la plateforme vidéo & ID
 */
export const detectVideoSource = (url) => {
  try {
    if (!url) return { platform: '', videoId: null };
    const u = new URL(url);
    const host = u.hostname.toLowerCase();

    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      let videoId;
      if (host.includes('youtu.be')) videoId = u.pathname.substring(1);
      else if (u.pathname.includes('/embed/')) videoId = u.pathname.split('/embed/')[1];
      else if (u.pathname.includes('/shorts/')) videoId = u.pathname.split('/shorts/')[1];
      else videoId = u.searchParams.get('v');
      return { platform: 'YOUTUBE', videoId };
    }

    if (host.includes('vimeo.com')) {
      const parts = u.pathname.split('/').filter(Boolean);
      return { platform: 'VIMEO', videoId: parts[0] };
    }

    if (host.includes('dailymotion.com')) {
      const parts = u.pathname.split('/').filter(Boolean);
      let videoId = parts[parts.length - 1];
      if (videoId.includes('video/')) videoId = videoId.split('video/')[1];
      return { platform: 'DAILYMOTION', videoId };
    }

    return { platform: 'OTHER', videoId: null };
  } catch {
    return { platform: '', videoId: null };
  }
};

/**
 * URL de miniature automatique pour une vidéo
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
 * Meilleure miniature à afficher pour un podcast
 * Priorité: coverImage > thumbnailUrl > auto(videoUrl) > défaut
 */
export const getPodcastThumbnail = (podcast) => {
  if (podcast?.coverImage && !podcast.coverImage.includes('podcast-default.jpg')) {
    return getImageUrl(podcast.coverImage);
  }
  if (podcast?.thumbnailUrl) {
    return getImageUrl(podcast.thumbnailUrl);
  }
  if (podcast?.platform && podcast?.videoId) {
    return getVideoThumbnailUrl(podcast.platform, podcast.videoId);
  }
  if (podcast?.videoUrl) {
    const { platform, videoId } = detectVideoSource(podcast.videoUrl);
    return getVideoThumbnailUrl(platform, videoId);
  }
  return '/images/podcast-default.jpg';
};
