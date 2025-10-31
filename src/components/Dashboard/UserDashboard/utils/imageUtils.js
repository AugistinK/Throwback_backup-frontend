// file_create: /home/claude/imageUtils.js
/**
 * Utilitaires pour gérer les images des podcasts
 */

// Configuration de base avec l'URL du backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.throwback-connect.com';

/**
 * Récupère l'URL de l'image du podcast à partir des données du podcast
 * @param {Object} podcast - Données du podcast
 * @returns {string} URL de l'image
 */
export const getPodcastImageUrl = (podcast) => {
  if (!podcast) {
    return null;
  }

  // Priorité des sources d'images:
  // 1. coverImage (si ce n'est pas l'image par défaut)
  // 2. thumbnailUrl (venant de la plateforme vidéo)
  // 3. URL d'image construite avec l'ID du podcast

  // Vérifier si une image de couverture personnalisée existe
  if (podcast.coverImage && 
      !podcast.coverImage.includes('default') && 
      !podcast.coverImage.includes('podcast-default.jpg')) {
    
    // Si l'image est une URL complète (http/https)
    if (podcast.coverImage.startsWith('http')) {
      return podcast.coverImage;
    }
    
    // Si c'est un chemin relatif commençant par /
    if (podcast.coverImage.startsWith('/')) {
      return `${API_BASE_URL}${podcast.coverImage}`;
    }
    
    // Autre format de chemin
    return `${API_BASE_URL}/${podcast.coverImage}`;
  }
  
  // Utiliser l'URL de thumbnail de la plateforme vidéo si disponible
  if (podcast.thumbnailUrl) {
    return podcast.thumbnailUrl;
  }
  
  // Construire une URL d'image pour la vidéo basée sur la plateforme
  if (podcast.videoId && podcast.platform) {
    switch (podcast.platform) {
      case 'YOUTUBE':
        return `https://img.youtube.com/vi/${podcast.videoId}/maxresdefault.jpg`;
      case 'VIMEO':
        // Idéalement, on devrait utiliser l'API Vimeo pour obtenir l'image
        // Mais pour le moment, on renvoie null pour utiliser l'image du backend
        return null;
      case 'DAILYMOTION':
        return `https://www.dailymotion.com/thumbnail/video/${podcast.videoId}`;
      default:
        // Pour les autres plateformes, on laisse le backend gérer
        return null;
    }
  }

  // Si aucune image n'est disponible, on demande au backend
  if (podcast._id) {
    return `${API_BASE_URL}/api/podcasts/thumbnail/${podcast._id}`;
  }
  
  // Dans le pire des cas, on retourne null et laisse le backend gérer
  return null;
};

/**
 * Gère les erreurs de chargement d'images
 * Remplace l'image par une URL de fallback du backend
 * @param {Event} event - Événement d'erreur
 */
export const handlePodcastImageError = (event) => {
  const podcastId = event.target.getAttribute('data-podcast-id');
  
  if (podcastId) {
    // Utiliser une URL de fallback du backend
    event.target.src = `${API_BASE_URL}/api/podcasts/thumbnail/${podcastId}`;
  } else {
    // Si même l'ID du podcast n'est pas disponible, laisser le backend servir une image par défaut
    event.target.src = `${API_BASE_URL}/images/podcast-placeholder.jpg`;
  }
  
  // Éviter les boucles d'erreur infinies
  event.target.onerror = null;
};