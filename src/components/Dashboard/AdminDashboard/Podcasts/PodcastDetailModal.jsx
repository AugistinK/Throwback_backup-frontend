// PodcastDetailModal.jsx - VERSION CORRIGÉE
import React from 'react';
import { getImageUrl, getPodcastThumbnail } from './imageUtils.js'; // Import des fonctions utilitaires
import styles from './Podcasts.module.css';

const PodcastDetailModal = ({ isOpen, onClose, podcast }) => {
  if (!isOpen || !podcast) return null;

  // Fonction pour extraire l'URL d'embed à partir de l'URL de la vidéo
  const getVideoEmbedUrl = (url, platform, videoId) => {
    try {
      if (!url) return null;
      
      // Si nous avons déjà la plateforme et l'ID vidéo
      if (platform && videoId) {
        switch (platform) {
          case 'YOUTUBE':
            return `https://www.youtube.com/embed/${videoId}`;
          case 'VIMEO':
            return `https://player.vimeo.com/video/${videoId}`;
          case 'DAILYMOTION':
            return `https://www.dailymotion.com/embed/video/${videoId}`;
          default:
            // Essayer d'extraire l'URL manuellement
            break;
        }
      }
      
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
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }
      
      // Vimeo
      else if (hostname.includes('vimeo.com')) {
        const pathParts = videoUrl.pathname.split('/').filter(Boolean);
        const vimeoId = pathParts[0];
        return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : null;
      }
      
      // Dailymotion
      else if (hostname.includes('dailymotion.com')) {
        const pathParts = videoUrl.pathname.split('/').filter(Boolean);
        let videoId = pathParts[pathParts.length - 1];
        if (videoId.includes('video/')) {
          videoId = videoId.split('video/')[1];
        }
        return videoId ? `https://www.dailymotion.com/embed/video/${videoId}` : null;
      }
      
      // Si l'URL est déjà au format d'embed
      if (
        url.includes('youtube.com/embed/') || 
        url.includes('player.vimeo.com/video/') ||
        url.includes('dailymotion.com/embed/video/')
      ) {
        return url;
      }
      
      // URL non reconnue
      return null;
    } catch (error) {
      console.error('Error extracting video embed URL:', error);
      return null;
    }
  };

  // Format episode (EP.01)
  const formatEpisode = (episode) => {
    return `EP.${episode.toString().padStart(2, '0')}`;
  };

  // Obtenir l'URL d'embed
  const embedUrl = podcast.videoId && podcast.platform 
    ? getVideoEmbedUrl(podcast.videoUrl, podcast.platform, podcast.videoId)
    : getVideoEmbedUrl(podcast.videoUrl);
  
  // Dates
  const formattedDate = podcast.publishDate ? new Date(podcast.publishDate).toLocaleDateString() : 'Not set';
  const createdDate = podcast.createdAt ? new Date(podcast.createdAt).toLocaleDateString() : 'Not set';

  // Get a color for a category
  const getCategoryColor = (category) => {
    const categoryColors = {
      'PERSONAL BRANDING': '#4c6ef5',
      'MUSIC BUSINESS': '#40c057',
      'ARTIST INTERVIEW': '#fa5252',
      'INDUSTRY INSIGHTS': '#be4bdb',
      'THROWBACK HISTORY': '#fd7e14',
      'OTHER': '#868e96'
    };
    
    return categoryColors[category] || '#868e96';
  };

  // Get platform icon
  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'YOUTUBE':
        return 'fab fa-youtube';
      case 'VIMEO':
        return 'fab fa-vimeo';
      case 'DAILYMOTION':
        return 'fas fa-video';
      default:
        return 'fas fa-video';
    }
  };

  // Formatage de la plateforme
  const formatPlatform = (platform) => {
    if (!platform) return 'Unknown';
    
    const platformMap = {
      'YOUTUBE': 'YouTube',
      'VIMEO': 'Vimeo',
      'DAILYMOTION': 'Dailymotion',
      'OTHER': 'Other'
    };
    
    return platformMap[platform] || platform;
  };

  // URL visible
  const displayUrl = podcast.videoUrl.length > 50 
    ? podcast.videoUrl.substring(0, 47) + '...' 
    : podcast.videoUrl;

  // CORRECTION: Utiliser getImageUrl pour les URLs d'images
  const coverImageUrl = podcast.coverImage ? getImageUrl(podcast.coverImage) : null;
  const thumbnailUrlFull = podcast.thumbnailUrl ? getImageUrl(podcast.thumbnailUrl) : null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>{podcast.title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className={styles.podcastDetailContent}>
          {embedUrl ? (
            <div className={styles.podcastEmbed}>
              <iframe
                src={embedUrl}
                title={podcast.title}
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <div className={styles.podcastUnavailable}>
              <i className={podcast.platform ? getPlatformIcon(podcast.platform) : "fas fa-podcast"}></i>
              <p>Podcast preview unavailable</p>
              {podcast.videoUrl && (
                <a 
                  href={podcast.videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.externalLink}
                >
                  Open on {formatPlatform(podcast.platform)} <i className="fas fa-external-link-alt"></i>
                </a>
              )}
            </div>
          )}
          
          <div className={styles.podcastDetails}>
            <div className={styles.detailHeader}>
              <div className={styles.podcastTypeBadges}>
                <div 
                  className={styles.podcastCategory}
                  style={{ backgroundColor: getCategoryColor(podcast.category) }}
                >
                  {podcast.category}
                </div>
                <div className={styles.podcastEpisode}>
                  {formatEpisode(podcast.episode)}
                </div>
                <div className={styles.podcastSeason}>
                  Season {podcast.season}
                </div>
                {podcast.platform && (
                  <div className={styles.platformBadge}>
                    <i className={getPlatformIcon(podcast.platform)}></i> {formatPlatform(podcast.platform)}
                  </div>
                )}
                {!podcast.isPublished && (
                  <div className={styles.unpublishedBadge}>
                    <i className="fas fa-eye-slash"></i> Unpublished
                  </div>
                )}
              </div>
              <div className={styles.podcastAddedOn}>
                Published on {formattedDate}
              </div>
            </div>
            
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <h4>Title</h4>
                <p>{podcast.title}</p>
              </div>

              <div className={styles.detailItem}>
                <h4>Episode</h4>
                <p>{formatEpisode(podcast.episode)}</p>
              </div>
              
              <div className={styles.detailItem}>
                <h4>Season</h4>
                <p>{podcast.season}</p>
              </div>
              
              <div className={styles.detailItem}>
                <h4>Guest</h4>
                <p>{podcast.guestName || '—'}</p>
              </div>

              <div className={styles.detailItem}>
                <h4>Host</h4>
                <p>{podcast.hostName || 'Mike Levis'}</p>
              </div>

              <div className={styles.detailItem}>
                <h4>Duration</h4>
                <p>{podcast.duration} minutes</p>
              </div>

              <div className={styles.detailItem}>
                <h4>Category</h4>
                <p>
                  <span 
                    style={{ 
                      color: getCategoryColor(podcast.category),
                      fontWeight: '600'
                    }}
                  >
                    {podcast.category}
                  </span>
                </p>
              </div>

              <div className={styles.detailItem}>
                <h4>Platform</h4>
                <p>
                  <i className={getPlatformIcon(podcast.platform)}></i> {formatPlatform(podcast.platform)}
                </p>
              </div>

              <div className={styles.detailItem}>
                <h4>Publish Date</h4>
                <p>{formattedDate}</p>
              </div>

              <div className={styles.detailItem}>
                <h4>Created Date</h4>
                <p>{createdDate}</p>
              </div>

              <div className={styles.detailItem}>
                <h4>Status</h4>
                <p>
                  {podcast.isPublished ? (
                    <span style={{ color: '#4caf50' }}>
                      <i className="fas fa-check-circle"></i> Published
                    </span>
                  ) : (
                    <span style={{ color: '#f44336' }}>
                      <i className="fas fa-eye-slash"></i> Unpublished
                    </span>
                  )}
                </p>
              </div>

              <div className={styles.detailItem}>
                <h4>Views</h4>
                <p>{podcast.viewCount || 0}</p>
              </div>

              <div className={styles.detailItem}>
                <h4>Likes</h4>
                <p>{podcast.likeCount || 0}</p>
              </div>

              {podcast.topics && podcast.topics.length > 0 && (
                <div className={styles.detailItem}>
                  <h4>Topics</h4>
                  <div className={styles.topicsList}>
                    {podcast.topics.map((topic, index) => (
                      <span key={index} className={styles.topicTag}>
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className={styles.detailItem} style={{ gridColumn: "1 / -1" }}>
                <h4>Description</h4>
                <p className={styles.description}>
                  {podcast.description || '—'}
                </p>
              </div>
              
              <div className={styles.detailItem}>
                <h4>Video URL</h4>
                <p className={styles.videoUrl}>
                  <a 
                    href={podcast.videoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    title={podcast.videoUrl}
                  >
                    {displayUrl} <i className="fas fa-external-link-alt"></i>
                  </a>
                </p>
              </div>
              
              <div className={styles.detailItem}>
                <h4>ID</h4>
                <p className={styles.podcastId}>{podcast._id}</p>
              </div>
              
              <div className={styles.detailItem}>
                <h4>Created by</h4>
                <p>
                  {podcast.author ? (
                    podcast.author.nom && podcast.author.prenom ? (
                      `${podcast.author.prenom} ${podcast.author.nom}`
                    ) : (
                      podcast.author._id || podcast.author
                    )
                  ) : '—'}
                </p>
              </div>
              
              {/* CORRECTION: Utiliser l'URL complète pour thumbnailUrl */}
              {thumbnailUrlFull && (
                <div className={styles.detailItem}>
                  <h4>Thumbnail URL</h4>
                  <p className={styles.thumbnailUrl}>
                    <a 
                      href={thumbnailUrlFull} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title={thumbnailUrlFull}
                    >
                      {thumbnailUrlFull.substring(0, 30)}... <i className="fas fa-external-link-alt"></i>
                    </a>
                  </p>
                  <div className={styles.thumbnailPreview}>
                    <img 
                      src={thumbnailUrlFull} 
                      alt="Thumbnail preview"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* CORRECTION: Utiliser l'URL complète pour coverImage */}
              {coverImageUrl && (
                <div className={styles.detailItem}>
                  <h4>Cover Image</h4>
                  <p className={styles.coverImage}>
                    <a 
                      href={coverImageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title={coverImageUrl}
                    >
                      {coverImageUrl.includes('podcast-default.jpg') 
                        ? 'Default Image' 
                        : coverImageUrl.substring(0, 30) + '...'
                      } <i className="fas fa-image"></i>
                    </a>
                  </p>
                  {/* Afficher un aperçu de l'image de couverture */}
                  {!coverImageUrl.includes('podcast-default.jpg') && (
                    <div className={styles.thumbnailPreview}>
                      <img 
                        src={coverImageUrl} 
                        alt="Cover preview"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className={styles.modalFooter}>
          <button 
            className={styles.closeModalButton}
            onClick={onClose}
          >
            <i className="fas fa-times"></i> Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PodcastDetailModal;