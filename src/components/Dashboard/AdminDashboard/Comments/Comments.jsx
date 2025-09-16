// components/Dashboard/AdminDashboard/Comments/Comments.jsx
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../../utils/adminAPI';
import styles from './Comments.module.css';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import CommentCard from './CommentCard';
import CommentFilters from './CommentFilters';
import CommentStats from './CommentStats';
import BulkActions from './BulkActions';
import Pagination from '../../../Common/Pagination';

const Comments = () => {
  const [comments, setComments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedComments, setSelectedComments] = useState([]);
  
  // Filtres et pagination
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    status: 'all',
    type: 'all',
    sortBy: 'recent',
    reported: 'all'
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Charger les commentaires
  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.get('/api/admin/comments', { params: filters });
      
      if (response.data.success) {
        setComments(response.data.data);
        setPagination(response.data.pagination);
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
      setError('Erreur lors du chargement des commentaires');
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques
  const loadStats = async () => {
    try {
      const response = await adminAPI.get('/api/admin/comments/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  useEffect(() => {
    loadComments();
  }, [filters]);

  useEffect(() => {
    loadStats();
  }, []);

  // Gérer les changements de filtre
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset page when filters change
    }));
    setSelectedComments([]); // Clear selections
  };

  // Gérer le changement de page
  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
    setSelectedComments([]);
  };

  // Sélection des commentaires
  const handleSelectComment = (commentId) => {
    setSelectedComments(prev => {
      if (prev.includes(commentId)) {
        return prev.filter(id => id !== commentId);
      } else {
        return [...prev, commentId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedComments.length === comments.length) {
      setSelectedComments([]);
    } else {
      setSelectedComments(comments.map(comment => comment._id));
    }
  };

  // Modérer un commentaire
  const handleModerateComment = async (commentId, action, reason = '') => {
    try {
      const response = await adminAPI.put(`/api/admin/comments/${commentId}/moderate`, {
        action,
        reason
      });

      if (response.data.success) {
        // Recharger les commentaires
        await loadComments();
        await loadStats();
        
        // Notification de succès
        console.log(`Commentaire ${action === 'approve' ? 'approuvé' : action === 'reject' ? 'rejeté' : 'supprimé'}`);
      }
    } catch (err) {
      console.error('Error moderating comment:', err);
      setError('Erreur lors de la modération du commentaire');
    }
  };

  // Modération en lot
  const handleBulkModerate = async (action, reason = '') => {
    if (selectedComments.length === 0) return;

    try {
      const response = await adminAPI.put('/api/admin/comments/bulk-moderate', {
        commentIds: selectedComments,
        action,
        reason
      });

      if (response.data.success) {
        setSelectedComments([]);
        await loadComments();
        await loadStats();
        
        console.log(`${response.data.data.modifiedCount} commentaires modérés`);
      }
    } catch (err) {
      console.error('Error bulk moderating:', err);
      setError('Erreur lors de la modération en lot');
    }
  };

  // Répondre à un commentaire
  const handleReplyToComment = async (commentId, content) => {
    try {
      const response = await adminAPI.post(`/api/admin/comments/${commentId}/reply`, {
        contenu: content
      });

      if (response.data.success) {
        await loadComments();
        console.log('Réponse ajoutée avec succès');
      }
    } catch (err) {
      console.error('Error replying to comment:', err);
      setError('Erreur lors de l\'ajout de la réponse');
    }
  };

  if (loading && comments.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Modération des Commentaires</h1>
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
          <h1>Modération des Commentaires</h1>
          <p>
            Gérez tous les commentaires, souvenirs et réponses de la plateforme
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
            Actualiser
          </button>
        </div>
      </div>

      {/* Statistiques */}
      {stats && <CommentStats stats={stats} />}

      {/* Filtres */}
      <CommentFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        totalComments={pagination.total}
      />

      {/* Actions en lot */}
      {selectedComments.length > 0 && (
        <BulkActions
          selectedCount={selectedComments.length}
          onBulkModerate={handleBulkModerate}
          onCancel={() => setSelectedComments([])}
        />
      )}

      {/* Liste des commentaires */}
      <div className={styles.content}>
        {comments.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="fas fa-comments"></i>
            <h3>Aucun commentaire trouvé</h3>
            <p>Aucun commentaire ne correspond aux filtres sélectionnés.</p>
          </div>
        ) : (
          <>
            {/* Header du tableau */}
            <div className={styles.tableHeader}>
              <div className={styles.checkboxColumn}>
                <input
                  type="checkbox"
                  checked={selectedComments.length === comments.length && comments.length > 0}
                  onChange={handleSelectAll}
                />
              </div>
              <div className={styles.contentColumn}>Contenu</div>
              <div className={styles.authorColumn}>Auteur</div>
              <div className={styles.contextColumn}>Contexte</div>
              <div className={styles.statusColumn}>Statut</div>
              <div className={styles.dateColumn}>Date</div>
              <div className={styles.actionsColumn}>Actions</div>
            </div>

            {/* Liste des commentaires */}
            <div className={styles.commentsList}>
              {comments.map(comment => (
                <CommentCard
                  key={comment._id}
                  comment={comment}
                  isSelected={selectedComments.includes(comment._id)}
                  onSelect={() => handleSelectComment(comment._id)}
                  onModerate={handleModerateComment}
                  onReply={handleReplyToComment}
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