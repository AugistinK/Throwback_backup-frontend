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
      setError(null);
      const response = await adminAPI.getComments(filters);

      if (response?.success) {
        setComments(Array.isArray(response.data) ? response.data : []);
        setPagination(response.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
        // Certaines réponses renvoient aussi un bloc stats
        if (response.stats) setStats(response.stats);
      } else {
        setComments([]);
        setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } catch (err) {
      console.error('Error loading comments:', err);
      setError('Erreur lors du chargement des commentaires');
      setComments([]);
      setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques
  const loadStats = async () => {
    try {
      const response = await adminAPI.getCommentsStats();
      if (response?.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
      // on laisse l’UI continuer sans planter
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    loadStats();
  }, []);

  // Gérer les changements de filtre
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset page on filter change
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
    setSelectedComments(prev =>
      prev.includes(commentId) ? prev.filter(id => id !== commentId) : [...prev, commentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedComments.length === comments.length) {
      setSelectedComments([]);
    } else {
      setSelectedComments(comments.map(c => c._id));
    }
  };

  // Modérer un commentaire
  const handleModerateComment = async (commentId, action, reason = '') => {
    try {
      const response = await adminAPI.moderateComment(commentId, action, reason);
      if (response?.success) {
        await loadComments();
        await loadStats();
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
      const response = await adminAPI.bulkModerateComments(selectedComments, action, reason);
      if (response?.success) {
        setSelectedComments([]);
        await loadComments();
        await loadStats();
        console.log(`${response.data?.modifiedCount || 0} commentaires modérés`);
      }
    } catch (err) {
      console.error('Error bulk moderating:', err);
      setError('Erreur lors de la modération en lot');
    }
  };

  // Répondre à un commentaire
  const handleReplyToComment = async (commentId, content) => {
    try {
      const response = await adminAPI.replyToComment(commentId, content);
      if (response?.success) {
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
          <p>Gérez tous les commentaires, souvenirs et réponses de la plateforme</p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.refreshBtn}
            onClick={() => { loadComments(); loadStats(); }}
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
        totalComments={pagination.total || 0}
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

            {/* Liste */}
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
                currentPage={pagination.page || 1}
                totalPages={pagination.totalPages || 1}
                onPageChange={handlePageChange}
                totalItems={pagination.total || 0}
                itemsPerPage={pagination.limit || 20}
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
