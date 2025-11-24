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
  
  // Filters and pagination
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    status: 'all',
    type: 'all',
    sortBy: 'recent'
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Load comments
  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getComments(filters);
      
      if (response.success) {
        setComments(response.data);
        setPagination(response.pagination);
        setStats(response.stats || stats);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
      setError('Error while loading comments');
    } finally {
      setLoading(false);
    }
  };

  // Load stats
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

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset page when filters change
    }));
  };

  // Handle page change
  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  if (loading && comments.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Comments</h1>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.error}>
          <i className="fas fa-exclamation-triangle"></i>
          {error}
          <button onClick={() => setError(null)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Comments</h1>
          <p>
            View all comments, memories, and replies on the platform
          </p>
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
            <i className={`fas fa-sync-alt ${loading ? styles.spinning : ''}`}></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && <CommentStats stats={stats} />}

      {/* Filters */}
      <CommentFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        totalComments={pagination.total}
      />

      {/* Comments list */}
      <div className={styles.content}>
        {comments.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="fas fa-comments"></i>
            <h3>No comments found</h3>
            <p>No comments match the selected filters.</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className={styles.tableHeader}>
              <div className={styles.contentColumn}>Content</div>
              <div className={styles.authorColumn}>Author</div>
              <div className={styles.contextColumn}>Context</div>
              <div className={styles.dateColumn}>Date</div>
            </div>

            {/* Comments list */}
            <div className={styles.commentsList}>
              {comments.map(comment => (
                <CommentCard
                  key={comment._id}
                  comment={comment}
                />
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
