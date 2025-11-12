// index.jsx - podcasts admin
import React, { useState, useEffect } from 'react';
import AddPodcastModal from './AddPodcastModal';
import EditPodcastModal from './EditPodcastModal';
import PodcastDetailModal from './PodcastDetailModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import { getPodcastThumbnail, getApiEndpoint } from './imageUtils';
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

      const res = await fetch(`${API_BASE}/podcasts/admin/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Server error' }));
        throw new Error(err.message || 'Failed to fetch podcasts');
      }

      const data = await res.json();
      setPodcasts(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);

      if (currentPage === 1 && !seasonFilter && !categoryFilter && !publishFilter && !searchQuery) {
        fetchPodcastStats();
      }
    } catch (err) {
      setError(err.message);
      setShowError(true);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPodcastStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_BASE}/podcasts/admin/stats`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error(err);
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
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Podcast Management</h1>
          <br/>
          <p>Welcome to the podcast management panel</p>
        </div>

        <div className={styles.headerActions}>
          {!isMobile && (
            <button className={styles.viewToggleButton} onClick={toggleViewMode}
              title={viewMode === 'grid' ? 'Switch to table view' : 'Switch to grid view'}>
              <i className={`fas fa-${viewMode === 'grid' ? 'list' : 'th'}`}></i>
            </button>
          )}
          <button className={styles.addButton} onClick={() => setAddModalOpen(true)}>
            <i className="fas fa-plus"></i> <span>{isMobile ? 'Add' : 'Add Podcast'}</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><i className="fas fa-podcast"></i></div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.total || 0}</div>
            <div className={styles.statLabel}>Total Podcasts</div>
          </div>
        </div>
        {stats.byCategory && stats.byCategory.slice(0, 2).map((cat, i) => (
          <div className={styles.statCard} key={`cat-${i}`}>
            <div className={styles.statIcon} style={{backgroundColor: getCategoryColor(cat._id)}}><i className="fas fa-tag"></i></div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{cat.count}</div>
              <div className={styles.statLabel}>{cat._id}</div>
            </div>
          </div>
        ))}
        {stats.bySeason && stats.bySeason.slice(0, 1).map((season, i) => (
          <div className={styles.statCard} key={`season-${i}`}>
            <div className={styles.statIcon} style={{backgroundColor: '#fab005'}}><i className="fas fa-bookmark"></i></div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{season.count}</div>
              <div className={styles.statLabel}>Season {season._id}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersTop}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input type="text" placeholder={isMobile ? 'Search...' : 'Search a podcast...'}
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={styles.searchInput}/>
            <button type="submit" className={styles.searchButton}><i className="fas fa-search"></i></button>
          </form>
          <div className={styles.filterButtons}>
            {(searchQuery || seasonFilter || categoryFilter || publishFilter) && (
              <button onClick={handleReset} className={styles.resetButton}>
                <i className="fas fa-times"></i> <span>{isMobile ? 'Clear' : 'Clear filters'}</span>
              </button>
            )}
          </div>
        </div>

        <div className={styles.filtersBottom}>
          <div className={styles.filterGroup}>
            <label htmlFor="seasonFilter" className={styles.filterLabel}>Season:</label>
            <select id="seasonFilter" value={seasonFilter}
              onChange={(e) => { setSeasonFilter(e.target.value); setCurrentPage(1); }}
              className={styles.filterSelect}>
              <option value="">All seasons</option>
              <option value="1">Season 1</option>
              <option value="2">Season 2</option>
              <option value="3">Season 3</option>
              <option value="4">Season 4</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="categoryFilter" className={styles.filterLabel}>Category:</label>
            <select id="categoryFilter" value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className={styles.filterSelect}>
              <option value="">All categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="publishFilter" className={styles.filterLabel}>Status:</label>
            <select id="publishFilter" value={publishFilter}
              onChange={(e) => { setPublishFilter(e.target.value); setCurrentPage(1); }}
              className={styles.filterSelect}>
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </div>

          <div className={styles.resultCount}>
            {podcasts.length > 0 && (
              <>
                <span className={styles.countValue}>{podcasts.length}</span>
                <span className={styles.countLabel}>{podcasts.length === 1 ? 'podcast' : 'podcasts'} {!isMobile && ' found'}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* States & list */}
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

      {/* Pagination */}
      {podcasts.length > 0 && totalPages > 1 && (
        <div className={styles.pagination}>
          <button className={styles.paginationButton} disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>
            <i className="fas fa-chevron-left"></i> {!isMobile && 'Previous'}
          </button>

          <div className={styles.pageNumbers}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              return (
                <button key={pageNum}
                  className={`${styles.pageNumber} ${currentPage === pageNum ? styles.currentPage : ''}`}
                  onClick={() => setCurrentPage(pageNum)}>
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button className={styles.paginationButton} disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>
            {!isMobile && 'Next'} <i className="fas fa-chevron-right"></i>
          </button>
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

// util color (local à ce fichier)
const getCategoryColor = (category) => {
  const colors = {
    'PERSONAL BRANDING': '#4c6ef5',
    'MUSIC BUSINESS': '#40c057',
    'ARTIST INTERVIEW': '#fa5252',
    'INDUSTRY INSIGHTS': '#be4bdb',
    'THROWBACK HISTORY': '#fd7e14',
    'OTHER': '#868e96'
  };
  return colors[category] || '#868e96';
};

export default Podcasts;
