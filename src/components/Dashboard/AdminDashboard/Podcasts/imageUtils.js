/**
 * Utilitaire pour gérer les URLs d'images des podcasts
 * Gère à la fois les chemins relatifs du backend et les URLs complètes
 */

// L'URL de base de l'API (sans le /api à la fin)
const getApiBaseUrl = () => {
  // Enlever /api à la fin si présent
  const apiUrl = process.env.REACT_APP_API_URL || 'https://api.throwback-connect.com';
  return apiUrl.replace(/\/api\/?$/, '');
};

/**
 * Construit l'URL complète d'une image
 * @param {string} imagePath - Le chemin de l'image (peut être relatif ou absolu)
 * @returns {string} - L'URL complète de l'image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return '/images/podcast-default.jpg';
  }

  // Si l'image est déjà une URL complète (http:// ou https://), la retourner telle quelle
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Si c'est un chemin local relatif sans domaine (commence par /images/, /assets/, etc.)
  if (imagePath.startsWith('/images/') || imagePath.startsWith('/assets/')) {
    return imagePath;
  }

  // Si c'est un chemin d'upload du backend (commence par /uploads/)
  if (imagePath.startsWith('/uploads/')) {
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}${imagePath}`;
  }

  // Si le chemin ne commence pas par /, l'ajouter
  if (!imagePath.startsWith('/')) {
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}/uploads/podcasts/${imagePath}`;
  }

  // Par défaut, préfixer avec l'URL de base
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${imagePath}`;
};

/**
 * Obtient l'URL de la thumbnail d'un podcast
 * Gère la priorité: coverImage > thumbnailUrl > thumbnail auto de la plateforme > image par défaut
 * @param {Object} podcast - L'objet podcast
 * @returns {string} - L'URL de la thumbnail
 */
export const getPodcastThumbnail = (podcast) => {
  // 1. Si une image de couverture personnalisée existe et n'est pas l'image par défaut
  if (podcast.coverImage && !podcast.coverImage.includes('podcast-default.jpg')) {
    return getImageUrl(podcast.coverImage);
  }
  
  // 2. Si une URL de thumbnail a été récupérée du backend
  if (podcast.thumbnailUrl) {
    return getImageUrl(podcast.thumbnailUrl);
  }
  
  // 3. Si la plateforme et l'ID vidéo sont disponibles, générer l'URL de la thumbnail
  if (podcast.platform && podcast.videoId) {
    switch(podcast.platform.toUpperCase()) {
      case 'YOUTUBE':
        return `https://img.youtube.com/vi/${podcast.videoId}/maxresdefault.jpg`;
      case 'VIMEO':
        // Pour Vimeo, il faudrait idéalement utiliser l'API
        return '/images/vimeo-placeholder.jpg';
      case 'DAILYMOTION':
        return `https://www.dailymotion.com/thumbnail/video/${podcast.videoId}`;
      default:
        return '/images/podcast-default.jpg';
    }
  }
  
  // 4. Si on a l'URL de la vidéo, essayer d'extraire l'ID
  if (podcast.videoUrl) {
    const { platform, videoId } = detectVideoSource(podcast.videoUrl);
    if (platform === 'YOUTUBE' && videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    } else if (platform === 'DAILYMOTION' && videoId) {
      return `https://www.dailymotion.com/thumbnail/video/${videoId}`;
    }
  }
  
  // 5. Fallback sur l'image par défaut
  return '/images/podcast-default.jpg';
};

/**
 * Détecte la source vidéo (plateforme et ID) à partir d'une URL
 * @param {string} url - L'URL de la vidéo
 * @returns {Object} - { platform: string, videoId: string|null }
 */
export const detectVideoSource = (url) => {
  try {
    if (!url) return { platform: '', videoId: null };
    
    const videoUrl = new URL(url);
    const hostname = videoUrl.hostname.toLowerCase();
    
    // YouTube
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      let videoId;
      if (hostname.includes('youtu.be')) {
        videoId = videoUrl.pathname.substring(1);
      } else if (videoUrl.pathname.includes('/embed/')) {
        videoId = videoUrl.pathname.split('/embed/')[1];
      } else if (videoUrl.pathname.includes('/shorts/')) {
        videoId = videoUrl.pathname.split('/shorts/')[1];
      } else {
        videoId = videoUrl.searchParams.get('v');
      }
      return { platform: 'YOUTUBE', videoId };
    }
    
    // Vimeo
    else if (hostname.includes('vimeo.com')) {
      const pathParts = videoUrl.pathname.split('/').filter(Boolean);
      return { platform: 'VIMEO', videoId: pathParts[0] };
    }
    
    // Dailymotion
    else if (hostname.includes('dailymotion.com')) {
      const pathParts = videoUrl.pathname.split('/').filter(Boolean);
      let videoId = pathParts[pathParts.length - 1];
      if (videoId.includes('video/')) {
        videoId = videoId.split('video/')[1];
      }
      return { platform: 'DAILYMOTION', videoId };
    }
    
    // Autre
    return { platform: 'OTHER', videoId: null };
  } catch (error) {
    console.error('Error detecting video platform:', error);
    return { platform: '', videoId: null };
  }
};

/**
 * Obtient l'URL de la thumbnail automatique pour une vidéo
 * @param {string} platform - La plateforme vidéo (YOUTUBE, VIMEO, DAILYMOTION)
 * @param {string} videoId - L'ID de la vidéo
 * @returns {string} - L'URL de la thumbnail
 */
export const getVideoThumbnailUrl = (platform, videoId) => {
  if (!platform || !videoId) {
    return '/images/podcast-default.jpg';
  }

  switch (platform.toUpperCase()) {
    case 'YOUTUBE':
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    case 'VIMEO':
      // Pour Vimeo, idéalement utiliser l'API
      return '/images/vimeo-placeholder.jpg';
    case 'DAILYMOTION':
      return `https://www.dailymotion.com/thumbnail/video/${videoId}`;
    default:
      return '/images/podcast-default.jpg';
  }
};