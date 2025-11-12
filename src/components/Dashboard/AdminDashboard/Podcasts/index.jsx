// index.jsx - VERSION CORRIGÉE
import React, { useState, useEffect } from 'react';
import AddPodcastModal from './AddPodcastModal';
import EditPodcastModal from './EditPodcastModal';
import PodcastDetailModal from './PodcastDetailModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import { getPodcastThumbnail, getApiEndpoint } from './imageUtils.js';
import styles from './Podcasts.module.css';

const CATEGORIES = [
  'PERSONAL BRANDING',
  'MUSIC BUSINESS',
  'ARTIST INTERVIEW',
  'INDUSTRY INSIGHTS',
  'THROWBACK HISTORY',
  'OTHER'
];

const Podcasts = () => {
  const API_BASE = getApiEndpoint();

  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [publishFilter, setPublishFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [stats, setStats] = useState({ total: 0, byCategory: [], bySeason: [] });
  const [viewMode, setViewMode] = useState('grid');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768 && viewMode === 'table') setViewMode('grid');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  const fetchPodcasts = async () => {
    try {
      setLoading(true);
      setShowError(false);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('You are not authenticated. Please log in again.');

      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (seasonFilter) params.append('season', seasonFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (publishFilter) params.append('publishStatus', publishFilter);
      params.append('page', currentPage);
      params.append('limit', 12);

      const response = await fetch(`${API_BASE}/podcasts/admin/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || 'Failed to fetch podcasts');
      }

      const data = await response.json();
      setPodcasts(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);

      if (currentPage === 1 && !seasonFilter && !categoryFilter && !publishFilter && !searchQuery) {
        fetchPodcastStats();
      }
    } catch (err) {
      setError(err.message);
      setShowError(true);
      console.error('Error fetching podcasts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPodcastStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${API_BASE}/podcasts/admin/stats`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error('Error fetching podcast statistics:', err);
    }
  };

  useEffect(() => { fetchPodcasts(); }, [seasonFilter, categoryFilter, publishFilter, currentPage]);

  const handleSearch = (e) => { e.preventDefault(); setCurrentPage(1); fetchPodcasts(); };
  const handleReset = () => { setSearchQuery(''); setSeasonFilter(''); setCategoryFilter(''); setPublishFilter(''); setCurrentPage(1); };
  const toggleViewMode = () => { if (!isMobile) setViewMode(prev => (prev === 'grid' ? 'table' : 'grid')); };

  const handlePodcastCreated = (newPodcast) => { setPodcasts(prev => [newPodcast, ...prev]); setAddModalOpen(false); fetchPodcastStats(); };
  const handlePodcastUpdated = (updatedPodcast) => {
    setPodcasts(prev => prev.map(p => (p._id === updatedPodcast._id ? updatedPodcast : p)));
    setEditModalOpen(false); setSelectedPodcast(null);
  };
  const handleDeleteClick = (podcast) => { setSelectedPodcast(podcast); setDeleteModalOpen(true); };
  const handlePodcastDeleted = (deletedId) => {
    setPodcasts(prev => prev.filter(p => p._id !== deletedId));
    setDeleteModalOpen(false); setSelectedPodcast(null); fetchPodcastStats();
  };
  const handleViewDetails = (podcast) => { setSelectedPodcast(podcast); setDetailModalOpen(true); };
  const handleEditClick = (podcast) => { setSelectedPodcast(podcast); setEditModalOpen(true); };

  const formatEpisode = (episode) => `EP.${episode.toString().padStart(2, '0')}`;

  const renderPodcastGridItem = (podcast) => (
    <div key={podcast._id} className={styles.podcastCard}>
      <div className={styles.podcastCategory}>{podcast.category}</div>
      <div className={styles.podcastThumbnail} onClick={() => handleViewDetails(podcast)}>
        <img
          src={getPodcastThumbnail(podcast)}
          alt={podcast.title}
          onError={(e) => { e.target.onerror = null; e.target.src = '/images/podcast-default.jpg'; }}
        />
        <div className={styles.podcastEpisode}>{formatEpisode(podcast.episode)}</div>
        {podcast.season > 1 && <div className={styles.podcastSeason}>Season {podcast.season}</div>}
        <div className={styles.podcastDuration}>{podcast.duration} min</div>
      </div>

      <div className={styles.podcastInfo}>
        <h3 className={styles.podcastTitle} title={podcast.title}>{podcast.title}</h3>
        <div className={styles.podcastMeta}>
          <div className={styles.podcastHost}>
            {podcast.guestName ? `Guest: ${podcast.guestName}` : `Host: ${podcast.hostName || 'Mike Levis'}`}
          </div>
          <div className={styles.podcastDate}>{new Date(podcast.publishDate).toLocaleDateString()}</div>
        </div>
      </div>

      {!podcast.isPublished && (
        <div className={styles.unpublishedBadge}>
          <i className="fas fa-eye-slash"></i> Unpublished
        </div>
      )}

      <div className={styles.podcastActions}>
        <button className={styles.actionButton} onClick={() => handleViewDetails(podcast)} title="View details">
          <i className="fas fa-eye"></i>
        </button>
        <button className={styles.actionButton} onClick={() => handleEditClick(podcast)} title="Edit podcast">
          <i className="fas fa-edit"></i>
        </button>
        <button className={styles.actionButton} onClick={() => handleDeleteClick(podcast)} title="Delete podcast">
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );

  const renderPodcastTableRow = (podcast) => (
    <tr key={podcast._id} className={styles.podcastTableRow}>
      <td className={styles.thumbnailCell}>
        <img
          src={getPodcastThumbnail(podcast)}
          alt={podcast.title}
          className={styles.tableThumbnail}
          onError={(e) => { e.target.onerror = null; e.target.src = '/images/podcast-default.jpg'; }}
        />
      </td>
      <td>
        {!podcast.isPublished && <span className={styles.unpublishedIcon}><i className="fas fa-eye-slash"></i></span>}
        {podcast.title}
      </td>
      <td>{formatEpisode(podcast.episode)}</td>
      <td>Season {podcast.season}</td>
      <td>{podcast.guestName || '-'}</td>
      <td><span className={styles.categoryTag}>{podcast.category}</span></td>
      <td>{podcast.duration} min</td>
      <td>{new Date(podcast.publishDate).toLocaleDateString()}</td>
      <td className={styles.tableActions}>
        <button className={styles.actionButton} onClick={() => handleViewDetails(podcast)} title="View details">
          <i className="fas fa-eye"></i>
        </button>
        <button className={styles.actionButton} onClick={() => handleEditClick(podcast)} title="Edit podcast">
          <i className="fas fa-edit"></i>
        </button>
        <button className={styles.actionButton} onClick={() => handleDeleteClick(podcast)} title="Delete podcast">
          <i className="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  );

  return (
    <div className={styles.podcastsContainer}>
      {/* stats, header, filters, states ... (inchangés) */}
      {/* ... */}
      {/* Loading state */}
      {loading && podcasts.length === 0 && (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}><i className="fas fa-spinner fa-spin"></i></div>
          <div className={styles.loadingText}>Loading podcasts...</div>
        </div>
      )}

      {showError && error && (
        <div className={styles.errorState}>
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
          <button className={styles.retryButton} onClick={() => fetchPodcasts()}>
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      )}

      {!loading && podcasts.length === 0 && !showError ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><i className="fas fa-podcast"></i></div>
          <h3 className={styles.emptyTitle}>No podcast found</h3>
          <p className={styles.emptyMessage}>
            {searchQuery || seasonFilter || categoryFilter || publishFilter
              ? 'Try adjusting your filters or search'
              : 'Add your first podcast to get started'}
          </p>
          <button onClick={() => setAddModalOpen(true)} className={styles.addEmptyButton}>
            <i className="fas fa-plus"></i> Add your first podcast
          </button>
        </div>
      ) : viewMode === 'grid' || isMobile ? (
        <div className={styles.podcastGrid}>
          {podcasts.map(podcast => renderPodcastGridItem(podcast))}
        </div>
      ) : (
        <div className={styles.podcastTableContainer}>
          <table className={styles.podcastTable}>
            <thead>
              <tr>
                <th className={styles.thumbnailHeader}>Thumbnail</th>
                <th>Title</th>
                <th>Episode</th>
                <th>Season</th>
                <th>Guest</th>
                <th>Category</th>
                <th>Duration</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>{podcasts.map(podcast => renderPodcastTableRow(podcast))}</tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <AddPodcastModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onPodcastCreated={handlePodcastCreated} />
      {selectedPodcast && (
        <>
          <EditPodcastModal
            isOpen={editModalOpen}
            onClose={() => { setEditModalOpen(false); setSelectedPodcast(null); }}
            podcast={selectedPodcast}
            onPodcastUpdated={handlePodcastUpdated}
          />
          <PodcastDetailModal
            isOpen={detailModalOpen}
            onClose={() => { setDetailModalOpen(false); setSelectedPodcast(null); }}
            podcast={selectedPodcast}
          />
          <DeleteConfirmModal
            isOpen={deleteModalOpen}
            onClose={() => { setDeleteModalOpen(false); setSelectedPodcast(null); }}
            podcastId={selectedPodcast._id}
            podcastTitle={selectedPodcast.title}
            onPodcastDeleted={handlePodcastDeleted}
          />
        </>
      )}
    </div>
  );
};

export default Podcasts;
