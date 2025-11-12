// Podcast/PodcastDetailModal.jsx
import React from 'react';
import styles from './Podcasts.module.css';
import { getImageUrl } from './imageUtils';

const PodcastDetailModal = ({ isOpen, onClose, podcast }) => {
  if (!isOpen || !podcast) return null;

  const getVideoEmbedUrl = (url, platform, videoId) => {
    try {
      if (!url) return null;
      if (platform && videoId) {
        switch (platform) {
          case 'YOUTUBE': return `https://www.youtube.com/embed/${videoId}`;
          case 'VIMEO': return `https://player.vimeo.com/video/${videoId}`;
          case 'DAILYMOTION': return `https://www.dailymotion.com/embed/video/${videoId}`;
          default: break;
        }
      }
      const videoUrl = new URL(url);
      const hostname = videoUrl.hostname.toLowerCase();

      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        let vid;
        if (hostname.includes('youtu.be')) vid = videoUrl.pathname.substring(1);
        else if (videoUrl.pathname.includes('/embed/')) vid = videoUrl.pathname.split('/embed/')[1];
        else if (videoUrl.pathname.includes('/shorts/')) vid = videoUrl.pathname.split('/shorts/')[1];
        else vid = videoUrl.searchParams.get('v');
        return vid ? `https://www.youtube.com/embed/${vid}` : null;
      } else if (hostname.includes('vimeo.com')) {
        const pathParts = videoUrl.pathname.split('/').filter(Boolean);
        const vimeoId = pathParts[0];
        return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : null;
      } else if (hostname.includes('dailymotion.com')) {
        const pathParts = videoUrl.pathname.split('/').filter(Boolean);
        let vid = pathParts[pathParts.length - 1];
        if (vid.includes('video/')) vid = vid.split('video/')[1];
        return vid ? `https://www.dailymotion.com/embed/video/${vid}` : null;
      }

      if (
        url.includes('youtube.com/embed/') ||
        url.includes('player.vimeo.com/video/') ||
        url.includes('dailymotion.com/embed/video/')
      ) return url;

      return null;
    } catch {
      return null;
    }
  };

  const formatEpisode = (episode) => `EP.${episode.toString().padStart(2, '0')}`;

  const embedUrl = podcast.videoId && podcast.platform
    ? getVideoEmbedUrl(podcast.videoUrl, podcast.platform, podcast.videoId)
    : getVideoEmbedUrl(podcast.videoUrl);

  const formattedDate = podcast.publishDate ? new Date(podcast.publishDate).toLocaleDateString() : 'Not set';
  const createdDate = podcast.createdAt ? new Date(podcast.createdAt).toLocaleDateString() : 'Not set';

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

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'YOUTUBE': return 'fab fa-youtube';
      case 'VIMEO': return 'fab fa-vimeo';
      case 'DAILYMOTION': return 'fas fa-video';
      default: return 'fas fa-video';
    }
  };

  const formatPlatform = (platform) => {
    if (!platform) return 'Unknown';
    const map = { YOUTUBE: 'YouTube', VIMEO: 'Vimeo', DAILYMOTION: 'Dailymotion', OTHER: 'Other' };
    return map[platform] || platform;
  };

  const displayUrl = podcast.videoUrl.length > 50
    ? podcast.videoUrl.substring(0, 47) + '...'
    : podcast.videoUrl;

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
                <a href={podcast.videoUrl} target="_blank" rel="noopener noreferrer" className={styles.externalLink}>
                  Open on {formatPlatform(podcast.platform)} <i className="fas fa-external-link-alt"></i>
                </a>
              )}
            </div>
          )}

          <div className={styles.podcastDetails}>
            <div className={styles.detailHeader}>
              <div className={styles.podcastTypeBadges}>
                <div className={styles.podcastCategory} style={{ backgroundColor: getCategoryColor(podcast.category) }}>
                  {podcast.category}
                </div>
                <div className={styles.podcastEpisode}>{formatEpisode(podcast.episode)}</div>
                <div className={styles.podcastSeason}>Season {podcast.season}</div>
                {podcast.platform && <div className={styles.platformBadge}><i className={getPlatformIcon(podcast.platform)}></i> {formatPlatform(podcast.platform)}</div>}
                {!podcast.isPublished && <div className={styles.unpublishedBadge}><i className="fas fa-eye-slash"></i> Unpublished</div>}
              </div>
              <div className={styles.podcastAddedOn}>Published on {formattedDate}</div>
            </div>

            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}><h4>Title</h4><p>{podcast.title}</p></div>
              <div className={styles.detailItem}><h4>Episode</h4><p>{formatEpisode(podcast.episode)}</p></div>
              <div className={styles.detailItem}><h4>Season</h4><p>{podcast.season}</p></div>
              <div className={styles.detailItem}><h4>Guest</h4><p>{podcast.guestName || '—'}</p></div>
              <div className={styles.detailItem}><h4>Host</h4><p>{podcast.hostName || 'Mike Levis'}</p></div>
              <div className={styles.detailItem}><h4>Duration</h4><p>{podcast.duration} minutes</p></div>
              <div className={styles.detailItem}><h4>Category</h4><p><span style={{ color: getCategoryColor(podcast.category), fontWeight: '600' }}>{podcast.category}</span></p></div>
              <div className={styles.detailItem}><h4>Platform</h4><p><i className={getPlatformIcon(podcast.platform)}></i> {formatPlatform(podcast.platform)}</p></div>
              <div className={styles.detailItem}><h4>Publish Date</h4><p>{formattedDate}</p></div>
              <div className={styles.detailItem}><h4>Created Date</h4><p>{createdDate}</p></div>
              <div className={styles.detailItem}>
                <h4>Status</h4>
                <p>{podcast.isPublished ? (<span style={{ color: '#4caf50' }}><i className="fas fa-check-circle"></i> Published</span>) : (<span style={{ color: '#f44336' }}><i className="fas fa-eye-slash"></i> Unpublished</span>)}</p>
              </div>
              <div className={styles.detailItem}><h4>Views</h4><p>{podcast.viewCount || 0}</p></div>
              <div className={styles.detailItem}><h4>Likes</h4><p>{podcast.likeCount || 0}</p></div>

              {podcast.topics && podcast.topics.length > 0 && (
                <div className={styles.detailItem}>
                  <h4>Topics</h4>
                  <div className={styles.topicsList}>
                    {podcast.topics.map((t, i) => (<span key={i} className={styles.topicTag}>{t}</span>))}
                  </div>
                </div>
              )}

              <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
                <h4>Description</h4>
                <p className={styles.description}>{podcast.description || '—'}</p>
              </div>

              <div className={styles.detailItem}>
                <h4>Video URL</h4>
                <p className={styles.videoUrl}>
                  <a href={podcast.videoUrl} target="_blank" rel="noopener noreferrer" title={podcast.videoUrl}>
                    {displayUrl} <i className="fas fa-external-link-alt"></i>
                  </a>
                </p>
              </div>

              <div className={styles.detailItem}><h4>ID</h4><p className={styles.podcastId}>{podcast._id}</p></div>

              <div className={styles.detailItem}>
                <h4>Created by</h4>
                <p>{podcast.author ? (podcast.author.nom && podcast.author.prenom ? `${podcast.author.prenom} ${podcast.author.nom}` : (podcast.author._id || podcast.author)) : '—'}</p>
              </div>

              {podcast.thumbnailUrl && (
                <div className={styles.detailItem}>
                  <h4>Thumbnail URL</h4>
                  <p className={styles.thumbnailUrl}>
                    <a href={getImageUrl(podcast.thumbnailUrl)} target="_blank" rel="noopener noreferrer" title={podcast.thumbnailUrl}>
                      {getImageUrl(podcast.thumbnailUrl).substring(0, 30)}... <i className="fas fa-external-link-alt"></i>
                    </a>
                  </p>
                </div>
              )}

              {podcast.coverImage && (
                <div className={styles.detailItem}>
                  <h4>Cover Image</h4>
                  <p className={styles.coverImage}>
                    <a href={getImageUrl(podcast.coverImage)} target="_blank" rel="noopener noreferrer" title={podcast.coverImage}>
                      {podcast.coverImage.includes('podcast-default.jpg') ? 'Default Image' : getImageUrl(podcast.coverImage).substring(0, 30) + '...'} <i className="fas fa-image"></i>
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.closeModalButton} onClick={onClose}>
            <i className="fas fa-times"></i> Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PodcastDetailModal;
