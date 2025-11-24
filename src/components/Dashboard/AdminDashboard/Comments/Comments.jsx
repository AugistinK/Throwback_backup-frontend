// components/Dashboard/AdminDashboard/Comments/Comments.jsx
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../../utils/adminAPI';
import styles from './Comments.module.css';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import CommentCard from './CommentCard';
import CommentFilters from './CommentFilters';
import CommentStats from './CommentStats';
import Pagination from '../../../Common/Pagination';

const Comments = () => {
  const [comments, setComments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtres + pagination
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    status: 'all',
    type: 'all',
    sortBy: 'recent',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Charger les commentaires
  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminAPI.getComments(filters);

      if (response.success) {
        setComments(response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        } else {
          setPagination((prev) => ({
            ...prev,
            page: filters.page,
            limit: filters.limit,
            total: response.data ? response.data.length : 0,
            totalPages: 1,
          }));
        }
        if (response.stats && !stats) {
          setStats(response.stats);
        }
      } else {
        setError('Error while loading comments');
      }
    } catch (err) {
      console.error('Error loading comments:', err);
      setError('Error while loading comments');
    } finally {
      setLoading(false);
    }
  };

  // Charger les stats globales
  const loadStats = async () => {
    try {
      const response = await adminAPI.getCommentsStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    loadStats();
  }, []);

  // Changement des filtres
  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // reset page
    }));
  };

  // Changement de page
  const handlePageChange = (page) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  // Action essentielle : suppression d’un commentaire
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Do you really want to delete this comment?')) return;

    try {
      setLoading(true);
      setError(null);

      // On réutilise l’endpoint de modération côté backend uniquement pour l’action "delete"
      const response = await adminAPI.moderateComment(commentId, 'delete');

      if (response.success) {
        await loadComments();
        await loadStats();
        console.log('Comment deleted successfully');
      } else {
        setError('Error while deleting comment');
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Error while deleting comment');
    } finally {
      setLoading(false);
    }
  };

  if (loading && comments.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Comments</h1>
            <p>View all comments, memories, and replies on the platform</p>
          </div>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.error}>
          <div>
            <i className="fas fa-exclamation-triangle" /> {error}
          </div>
          <button onClick={() => setError(null)}>
            <i className="fas fa-times" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Comments</h1>
          <p>View all comments, memories, and replies on the platform</p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.refreshBtn}
            onClick={() => {
              loadComments();
              loadStats();
            }}
            disabled={loading}
          >
            <i
              className={`fas fa-sync-alt ${
                loading ? styles.spinning : ''
              }`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && <CommentStats stats={stats} />}

      {/* Filtres */}
      <CommentFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        totalComments={pagination.total}
      />

      {/* Liste des commentaires */}
      <div className={styles.content}>
        {comments.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="fas fa-comments" />
            <h3>No comments found</h3>
            <p>No comments match the selected filters.</p>
          </div>
        ) : (
          <>
            {/* En-tête de table */}
            <div className={styles.tableHeader}>
              <div className={styles.contentColumn}>Content</div>
              <div className={styles.authorColumn}>Author</div>
              <div className={styles.contextColumn}>Context</div>
              <div className={styles.dateColumn}>Date</div>
              <div className={styles.actionsColumn}>Actions</div>
            </div>

            {/* Lignes */}
            <div className={styles.commentsList}>
              {comments.map((comment) => (
                <div
                  key={comment._id}
                  className={styles.commentRow}
                >
                  {/* Contenu principal */}
                  <CommentCard comment={comment} />

                  {/* Colonne Actions essentielles */}
                  <div className={styles.rowActions}>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteComment(comment._id)}
                    >
                      <i className="fas fa-trash-alt" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
              />
            )}
          </>
        )}
      </div>

      {loading && comments.length > 0 && (
        <div className={styles.loadingOverlay}>
          <LoadingSpinner size="small" />
        </div>
      )}
    </div>
  );
};

export default Comments;
