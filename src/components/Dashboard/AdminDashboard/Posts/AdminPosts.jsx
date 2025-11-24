// components/Dashboard/AdminDashboard/Posts/AdminPosts.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import styles from './AdminPosts.module.css';
import socialAPI from '../../../../utils/socialAPI';

const apiBase = process.env.REACT_APP_API_URL || '';

/**
 * Transforme une valeur (string ou objet) en URL absolue.
 * Gère les chemins relatifs type "/uploads/..."
 */
const toAbsoluteUrl = (value) => {
  if (!value) return null;

  let s = null;
  if (typeof value === 'string') {
    s = value;
  } else if (typeof value === 'object') {
    s =
      value.url ??
      value.path ??
      value.secure_url ??
      value.Location ??
      value.location ??
      value.href ??
      value.src ??
      null;
  }

  if (!s) return null;
  s = String(s);

  try {
    // Chemin relatif API (ex: /uploads/...)
    return s.startsWith('/') ? `${apiBase}${s}` : s;
  } catch {
    return null;
  }
};

const AdminPosts = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // UI state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    visibility: '',
    status: '',
    hasMedia: '',
    sortBy: 'newest'
  });

  // Sélections
  const [selectedPosts, setSelectedPosts] = useState([]);

  // Suppression simple
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);

  const searchTimeoutRef = React.useRef(null);

  useEffect(() => {
    fetchPosts();
  }, [currentPage, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm.trim() || undefined,
        visibility: filters.visibility || undefined,
        status: filters.status || undefined,
        hasMedia: filters.hasMedia || undefined,
        sortBy: filters.sortBy || 'newest',
        isAdmin: true
      };

      const response = await socialAPI.getAllPosts(params);

      setPosts(Array.isArray(response.data) ? response.data : []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalPosts(response.pagination?.total || 0);
    } catch (err) {
      console.error('Error loading posts:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'An error occurred while loading posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filters]);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
    }, 500);
  }, []);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPosts();
  }, [fetchPosts]);

  const resetFilters = useCallback(() => {
    setFilters({
      visibility: '',
      status: '',
      hasMedia: '',
      sortBy: 'newest'
    });
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  }, [totalPages, currentPage]);

  const handleSelectAll = useCallback((e) => {
    if (e.target.checked) {
      setSelectedPosts(posts.map(post => post._id));
    } else {
      setSelectedPosts([]);
    }
  }, [posts]);

  const handleSelectPost = useCallback((e, postId) => {
    if (e.target.checked) {
      setSelectedPosts(prev => [...prev, postId]);
    } else {
      setSelectedPosts(prev => prev.filter(id => id !== postId));
    }
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (!selectedPosts.length) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedPosts.length} post(s)? This action is irreversible.`
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      setError(null);

      await socialAPI.bulkActionPosts('delete', selectedPosts);

      await fetchPosts();
      setSelectedPosts([]);
      setSuccessMessage(`${selectedPosts.length} post(s) deleted successfully`);
    } catch (err) {
      console.error('Error during bulk delete:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'An error occurred during the bulk delete');
    } finally {
      setLoading(false);
    }
  }, [selectedPosts, fetchPosts]);

  const confirmDeletePost = useCallback((postId) => {
    setPostToDelete(postId);
    setConfirmDelete(true);
  }, []);

  const deletePost = useCallback(async () => {
    if (!postToDelete) return;

    try {
      setLoading(true);
      setError(null);

      await socialAPI.adminDeletePost(postToDelete);

      await fetchPosts();

      setPostToDelete(null);
      setConfirmDelete(false);
      setSuccessMessage('Post deleted successfully');
    } catch (err) {
      console.error('Error deleting post:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'An error occurred while deleting the post');
    } finally {
      setLoading(false);
    }
  }, [postToDelete, fetchPosts]);

  const formatDate = useCallback((dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (e) {
      return 'Unknown date';
    }
  }, []);

  const truncateText = useCallback((text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }, []);

  return (
    <div className={styles.adminPosts}>
      {/* Header simple (sans modération / reports) */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Posts Management</h1>
          <div className={styles.quickStats}>
            <span className={styles.statItem}>
              Total posts: <strong>{totalPosts || 0}</strong>
            </span>
            <span className={styles.statItem}>
              Posts with media (this page):{' '}
              <strong>{posts.filter(p => p.media).length}</strong>
            </span>
          </div>
        </div>
        <div className={styles.actions}>
          {selectedPosts.length > 0 && (
            <button
              className={styles.bulkActionButton}
              onClick={handleBulkDelete}
              disabled={loading}
            >
              <i className="fas fa-trash"></i>
              Delete selected ({selectedPosts.length})
            </button>
          )}

          <button
            className={styles.refreshButton}
            onClick={() => {
              fetchPosts();
            }}
            disabled={loading}
            title="Refresh"
          >
            <i className={`fas fa-sync ${loading ? styles.spinning : ''}`}></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className={styles.successMessage}>
          <i className="fas fa-check-circle"></i>
          {successMessage}
          <button onClick={() => setSuccessMessage('')}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          <i className="fas fa-exclamation-circle"></i>
          {error}
          <button onClick={() => setError(null)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Filters & search */}
      <div className={styles.filters}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchInputContainer}>
            <input
              type="text"
              placeholder="Search by content, author..."
              value={searchTerm}
              onChange={handleSearchChange}
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>
              <i className="fas fa-search"></i>
            </button>
          </div>
        </form>

        <div className={styles.filterControls}>
          <select
            value={filters.visibility}
            onChange={(e) => handleFilterChange('visibility', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All visibility types</option>
            <option value="PUBLIC">Public</option>
            <option value="FRIENDS">Friends only</option>
            <option value="PRIVATE">Private</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
          </select>

          <select
            value={filters.hasMedia}
            onChange={(e) => handleFilterChange('hasMedia', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All media</option>
            <option value="true">With media</option>
            <option value="false">Without media</option>
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="most_liked">Most liked</option>
            <option value="most_commented">Most commented</option>
          </select>

          <button
            onClick={resetFilters}
            className={styles.resetButton}
            title="Reset filters"
          >
            <i className="fas fa-times"></i>
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.postsTable}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedPosts.length === posts.length && posts.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>ID</th>
              <th>Content</th>
              <th>Author</th>
              <th>Visibility</th>
              <th>Date</th>
              <th>Likes</th>
              <th>Comments</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !posts.length ? (
              <tr>
                <td colSpan="10" className={styles.loadingCell}>
                  <div className={styles.loadingSpinner}></div>
                  Loading posts...
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan="10" className={styles.noDataCell}>
                  {searchTerm || Object.values(filters).some(f => f)
                    ? 'No posts found with these criteria'
                    : 'No posts found'}
                </td>
              </tr>
            ) : (
              posts.map(post => (
                <tr key={post._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedPosts.includes(post._id)}
                      onChange={(e) => handleSelectPost(e, post._id)}
                    />
                  </td>
                  <td className={styles.idCell}>{post._id}</td>
                  <td className={styles.contentCell}>
                    <div className={styles.contentPreview}>
                      {post.media && (
                        <div className={styles.mediaIndicator}>
                          <i
                            className={`fas ${
                              post.type_media === 'IMAGE'
                                ? 'fa-image'
                                : post.type_media === 'VIDEO'
                                ? 'fa-video'
                                : post.type_media === 'AUDIO'
                                ? 'fa-music'
                                : 'fa-file'
                            }`}
                          ></i>
                        </div>
                      )}
                      <span>{truncateText(post.contenu)}</span>
                    </div>
                  </td>
                  <td className={styles.authorCell}>
                    {post.auteur ? (
                      <div className={styles.authorInfo}>
                        <div className={styles.authorAvatar}>
                          {post.auteur.photo_profil ? (
                            <img
                              src={toAbsoluteUrl(post.auteur.photo_profil) || undefined}
                              alt={`${post.auteur.prenom || ''} ${post.auteur.nom || ''}`}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className={styles.defaultAvatar}>
                              {post.auteur.prenom?.[0] || ''}
                              {post.auteur.nom?.[0] || ''}
                            </div>
                          )}
                        </div>
                        <Link
                          to={`/admin/users/${post.auteur._id}`}
                          className={styles.authorName}
                        >
                          {post.auteur.prenom} {post.auteur.nom}
                        </Link>
                      </div>
                    ) : (
                      <span className={styles.unknownAuthor}>Unknown user</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        styles[`badge_${post.visibilite?.toLowerCase()}`]
                      }`}
                    >
                      {post.visibilite}
                    </span>
                  </td>
                  <td>{formatDate(post.createdAt)}</td>
                  <td className={styles.likesCell}>
                    <div className={styles.statBadge}>
                      <i className="fas fa-heart"></i>
                      {post.likes?.length || 0}
                    </div>
                  </td>
                  <td className={styles.commentsCell}>
                    <div className={styles.statBadge}>
                      <i className="fas fa-comment"></i>
                      {post.commentaires?.length || post.commentCount || 0}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        styles[`status_${post.modere ? 'moderated' : 'active'}`]
                      }`}
                    >
                      {post.modere ? 'Hidden' : 'Active'}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <div className={styles.actionButtons}>
                      <Link
                        to={`/admin/posts/${post._id}`}
                        className={styles.actionButton}
                        title="View details"
                      >
                        <i className="fas fa-eye"></i>
                      </Link>
                      <button
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        title="Delete"
                        onClick={() => confirmDeletePost(post._id)}
                        disabled={loading}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageButton}
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            <i className="fas fa-angle-double-left"></i>
          </button>
          <button
            className={styles.pageButton}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <i className="fas fa-angle-left"></i>
          </button>

          <div className={styles.pageInfo}>
            Page {currentPage} of {totalPages} ({totalPosts} posts)
          </div>

          <button
            className={styles.pageButton}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <i className="fas fa-angle-right"></i>
          </button>
          <button
            className={styles.pageButton}
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <i className="fas fa-angle-double-right"></i>
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Confirm deletion</h3>
            <p>Are you sure you want to delete this post? This action is irreversible.</p>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setConfirmDelete(false);
                  setPostToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className={styles.deleteConfirmButton}
                onClick={deletePost}
                disabled={loading}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPosts;
