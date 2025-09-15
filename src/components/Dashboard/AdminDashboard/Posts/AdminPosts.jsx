// components/Dashboard/AdminDashboard/Posts/AdminPosts.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import styles from './AdminPosts.module.css';
import socialAPI from '../../../../utils/socialAPI';

const AdminPosts = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // États pour stocker les données et gérer l'interface
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
    hasReports: '',
    sortBy: 'newest'
  });
  
  // États pour les actions en masse
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [showBulkModerationModal, setShowBulkModerationModal] = useState(false);
  const [bulkModerationReason, setBulkModerationReason] = useState('');
  const [bulkActionType, setBulkActionType] = useState('');
  
  // États pour les actions individuelles
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [postToModerate, setPostToModerate] = useState(null);
  const [moderationReason, setModerationReason] = useState('');
  
  // Statistiques
  const [stats, setStats] = useState({
    total: 0,
    reported: 0,
    moderated: 0,
    active: 0
  });

  // Références pour optimisation
  const searchTimeoutRef = React.useRef(null);

  // Chargement initial et gestion des effets
  useEffect(() => {
    fetchPosts();
    fetchStats();
  }, [currentPage, filters]);

  // Gestion des messages de succès depuis la navigation
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Nettoyer l'état de navigation
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  // Auto-clear des messages
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

  // Récupérer les statistiques
  const fetchStats = useCallback(async () => {
    try {
      const response = await socialAPI.getModerationStats();
      setStats(response.data || {
        total: 0,
        reported: 0,
        moderated: 0,
        active: 0
      });
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      // Ne pas afficher d'erreur pour les stats, ce n'est pas critique
    }
  }, []);

  // Fonction pour récupérer les posts avec gestion d'erreur améliorée
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construction des paramètres de requête avec isAdmin pour utiliser l'endpoint admin
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm.trim() || undefined,
        visibility: filters.visibility || undefined,
        status: filters.status || undefined,
        hasMedia: filters.hasMedia || undefined,
        hasReports: filters.hasReports === 'true' ? true : undefined,
        sortBy: filters.sortBy || 'newest',
        isAdmin: true // Important: utilise l'endpoint admin
      };
      
      // Appel à l'API
      const response = await socialAPI.getAllPosts(params);
      
      // Mise à jour de l'état avec vérification des données
      setPosts(Array.isArray(response.data) ? response.data : []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalPosts(response.pagination?.total || 0);
      
    } catch (err) {
      console.error('Erreur lors du chargement des posts:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'Une erreur est survenue lors du chargement des posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filters]);

  // Gestionnaire de recherche avec debounce
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Debounce pour éviter trop de requêtes
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      // fetchPosts sera appelé automatiquement via useEffect
    }, 500);
  }, []);

  // Gestionnaire de soumission de recherche
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPosts();
  }, [fetchPosts]);

  // Réinitialiser les filtres
  const resetFilters = useCallback(() => {
    setFilters({
      visibility: '',
      status: '',
      hasMedia: '',
      hasReports: '',
      sortBy: 'newest'
    });
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  // Gestionnaire de changement de filtre
  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1);
  }, []);

  // Gestionnaire de changement de page
  const handlePageChange = useCallback((page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  }, [totalPages, currentPage]);

  // Gestion des sélections
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

  // Préparer l'action en masse
  const prepareBulkAction = useCallback((action) => {
    if (selectedPosts.length === 0) {
      setError('Aucun post sélectionné');
      return;
    }
    
    setBulkActionType(action);
    
    if (action === 'moderate') {
      setShowBulkModerationModal(true);
    } else {
      performBulkAction(action);
    }
  }, [selectedPosts.length]);

  // Actions en masse avec gestion d'erreur améliorée
  const performBulkAction = useCallback(async (action, reason = '') => {
    if (selectedPosts.length === 0) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let response;
      switch (action) {
        case 'moderate':
          response = await socialAPI.bulkActionPosts('moderate', selectedPosts, reason);
          break;
        case 'restore':
          response = await socialAPI.bulkActionPosts('restore', selectedPosts);
          break;
        case 'delete':
          response = await socialAPI.bulkActionPosts('delete', selectedPosts);
          break;
        default:
          throw new Error('Action non reconnue');
      }
      
      // Rafraîchir la liste et les stats
      await Promise.all([fetchPosts(), fetchStats()]);
      
      // Réinitialiser les états
      setSelectedPosts([]);
      setBulkActionOpen(false);
      setShowBulkModerationModal(false);
      setBulkModerationReason('');
      
      // Message de succès
      const actionText = action === 'moderate' ? 'modérés' : 
                        action === 'restore' ? 'restaurés' : 'supprimés';
      setSuccessMessage(`${selectedPosts.length} post(s) ${actionText} avec succès`);
      
    } catch (err) {
      console.error(`Erreur lors de l'action en masse "${action}":`, err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || `Une erreur est survenue lors de l'action en masse`);
    } finally {
      setLoading(false);
    }
  }, [selectedPosts, fetchPosts, fetchStats]);

  // Confirmation de suppression
  const confirmDeletePost = useCallback((postId) => {
    setPostToDelete(postId);
    setConfirmDelete(true);
  }, []);

  // Supprimer un post
  const deletePost = useCallback(async () => {
    if (!postToDelete) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await socialAPI.adminDeletePost(postToDelete);
      
      // Rafraîchir la liste et les stats
      await Promise.all([fetchPosts(), fetchStats()]);
      
      setPostToDelete(null);
      setConfirmDelete(false);
      setSuccessMessage('Post supprimé avec succès');
      
    } catch (err) {
      console.error('Erreur lors de la suppression du post:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'Une erreur est survenue lors de la suppression du post');
    } finally {
      setLoading(false);
    }
  }, [postToDelete, fetchPosts, fetchStats]);

  // Modérer/Restaurer un post individuel
  const togglePostModeration = useCallback(async (postId, isModerated) => {
    if (isModerated) {
      // Restaurer directement
      try {
        setLoading(true);
        await socialAPI.restorePost(postId);
        await Promise.all([fetchPosts(), fetchStats()]);
        setSuccessMessage('Post restauré avec succès');
      } catch (err) {
        console.error('Erreur lors de la restauration:', err);
        const formattedError = socialAPI.formatApiError(err);
        setError(formattedError.message || 'Une erreur est survenue lors de la restauration');
      } finally {
        setLoading(false);
      }
    } else {
      // Demander la raison pour la modération
      setPostToModerate(postId);
      setShowModerationModal(true);
    }
  }, [fetchPosts, fetchStats]);

  // Modérer un post avec raison
  const moderatePost = useCallback(async () => {
    if (!postToModerate || !moderationReason.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await socialAPI.moderatePost(postToModerate, moderationReason);
      
      // Rafraîchir la liste et les stats
      await Promise.all([fetchPosts(), fetchStats()]);
      
      setPostToModerate(null);
      setShowModerationModal(false);
      setModerationReason('');
      setSuccessMessage('Post modéré avec succès');
      
    } catch (err) {
      console.error('Erreur lors de la modération:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'Une erreur est survenue lors de la modération');
    } finally {
      setLoading(false);
    }
  }, [postToModerate, moderationReason, fetchPosts, fetchStats]);

  // Export CSV avec gestion d'erreur
  const handleExportCSV = useCallback(async () => {
    try {
      setLoading(true);
      await socialAPI.exportPostsCSV();
      setSuccessMessage('Export CSV téléchargé avec succès');
    } catch (err) {
      console.error('Erreur lors de l\'export:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'Une erreur est survenue lors de l\'export');
    } finally {
      setLoading(false);
    }
  }, []);

  // Utilitaires de formatage
  const formatDate = useCallback((dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (e) {
      return 'Date inconnue';
    }
  }, []);

  const truncateText = useCallback((text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }, []);

  // Raisons de modération prédéfinies
  const moderationReasons = [
    'Contenu inapproprié',
    'Violation des conditions d\'utilisation',
    'Contenu offensant',
    'Informations erronées',
    'Spam ou contenu indésirable',
    'Contenu dupliqué'
  ];

  return (
    <div className={styles.adminPosts}>
      {/* En-tête avec statistiques */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Gestion des Posts</h1>
          {stats && (
            <div className={styles.quickStats}>
              <span className={styles.statItem}>
                Total: <strong>{stats.total || 0}</strong>
              </span>
              <span className={styles.statItem}>
                Signalés: <strong>{stats.reported || 0}</strong>
              </span>
              <span className={styles.statItem}>
                Modérés: <strong>{stats.moderated || 0}</strong>
              </span>
              <span className={styles.statItem}>
                Actifs: <strong>{stats.active || 0}</strong>
              </span>
            </div>
          )}
        </div>
        <div className={styles.actions}>
          {selectedPosts.length > 0 && (
            <div className={styles.bulkActionContainer}>
              <button 
                className={styles.bulkActionButton}
                onClick={() => setBulkActionOpen(!bulkActionOpen)}
              >
                Actions ({selectedPosts.length})
                <i className={`fas fa-chevron-${bulkActionOpen ? 'up' : 'down'}`}></i>
              </button>
              
              {bulkActionOpen && (
                <div className={styles.bulkActionDropdown}>
                  <button onClick={() => prepareBulkAction('restore')}>
                    <i className="fas fa-check"></i> Restaurer
                  </button>
                  <button onClick={() => prepareBulkAction('moderate')}>
                    <i className="fas fa-shield-alt"></i> Modérer
                  </button>
                  <button onClick={() => prepareBulkAction('delete')}>
                    <i className="fas fa-trash"></i> Supprimer
                  </button>
                </div>
              )}
            </div>
          )}
          <button 
            className={styles.exportButton}
            onClick={handleExportCSV}
            disabled={loading}
            title="Exporter en CSV"
          >
            <i className="fas fa-download"></i>
            Export CSV
          </button>
          <button 
            className={styles.moderationButton}
            onClick={() => navigate('/admin/posts/moderation')}
            title="Page de modération"
          >
            <i className="fas fa-shield-alt"></i>
            Modération
          </button>
          <button 
            className={styles.refreshButton}
            onClick={() => {
              fetchPosts();
              fetchStats();
            }}
            disabled={loading}
            title="Rafraîchir"
          >
            <i className={`fas fa-sync ${loading ? styles.spinning : ''}`}></i>
            Rafraîchir
          </button>
        </div>
      </div>

      {/* Messages de succès et d'erreur */}
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

      {/* Filtres et recherche */}
      <div className={styles.filters}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchInputContainer}>
            <input 
              type="text" 
              placeholder="Rechercher par contenu, auteur..." 
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
            <option value="">Tous les types de visibilité</option>
            <option value="PUBLIC">Public</option>
            <option value="FRIENDS">Amis uniquement</option>
            <option value="PRIVATE">Privé</option>
          </select>
          
          <select 
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="moderated">Modéré</option>
            <option value="reported">Signalé</option>
          </select>
          
          <select 
            value={filters.hasMedia}
            onChange={(e) => handleFilterChange('hasMedia', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">Tous les médias</option>
            <option value="true">Avec média</option>
            <option value="false">Sans média</option>
          </select>
          
          <select 
            value={filters.hasReports}
            onChange={(e) => handleFilterChange('hasReports', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">Tous les signalements</option>
            <option value="true">Avec signalements</option>
            <option value="false">Sans signalement</option>
          </select>
          
          <select 
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="newest">Plus récents</option>
            <option value="oldest">Plus anciens</option>
            <option value="most_liked">Plus likés</option>
            <option value="most_commented">Plus commentés</option>
            <option value="most_reported">Plus signalés</option>
          </select>
          
          <button 
            onClick={resetFilters}
            className={styles.resetButton}
            title="Réinitialiser les filtres"
          >
            <i className="fas fa-times"></i>
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Tableau des posts */}
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
              <th>Contenu</th>
              <th>Auteur</th>
              <th>Visibilité</th>
              <th>Date</th>
              <th>Likes</th>
              <th>Commentaires</th>
              <th>Signalements</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !posts.length ? (
              <tr>
                <td colSpan="11" className={styles.loadingCell}>
                  <div className={styles.loadingSpinner}></div>
                  Chargement des posts...
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan="11" className={styles.noDataCell}>
                  {searchTerm || Object.values(filters).some(f => f) ? 
                    'Aucun post trouvé avec ces critères' : 
                    'Aucun post trouvé'
                  }
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
                          <i className={`fas ${
                            post.type_media === 'IMAGE' ? 'fa-image' : 
                            post.type_media === 'VIDEO' ? 'fa-video' : 
                            post.type_media === 'AUDIO' ? 'fa-music' : 'fa-file'
                          }`}></i>
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
                              src={post.auteur.photo_profil}
                              alt={`${post.auteur.prenom} ${post.auteur.nom}`}
                            />
                          ) : (
                            <div className={styles.defaultAvatar}>
                              {post.auteur.prenom?.[0] || ''}{post.auteur.nom?.[0] || ''}
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
                      <span className={styles.unknownAuthor}>Utilisateur inconnu</span>
                    )}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[`badge_${post.visibilite?.toLowerCase()}`]}`}>
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
                  <td className={styles.reportsCell}>
                    <div className={`${styles.statBadge} ${post.signalements?.length > 0 ? styles.hasReports : ''}`}>
                      <i className="fas fa-flag"></i>
                      {post.signalements?.length || 0}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[`status_${post.modere ? 'moderated' : 'active'}`]}`}>
                      {post.modere ? 'Modéré' : 'Actif'}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <div className={styles.actionButtons}>
                      <Link 
                        to={`/admin/posts/${post._id}`} 
                        className={styles.actionButton}
                        title="Voir détails"
                      >
                        <i className="fas fa-eye"></i>
                      </Link>
                      <button 
                        className={styles.actionButton}
                        title={post.modere ? 'Restaurer' : 'Modérer'}
                        onClick={() => togglePostModeration(post._id, post.modere)}
                        disabled={loading}
                      >
                        <i className={`fas ${post.modere ? 'fa-check' : 'fa-shield-alt'}`}></i>
                      </button>
                      <button 
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        title="Supprimer"
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
            Page {currentPage} sur {totalPages} ({totalPosts} posts)
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

      {/* Modale de confirmation de suppression */}
      {confirmDelete && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Confirmer la suppression</h3>
            <p>Êtes-vous sûr de vouloir supprimer ce post ? Cette action est irréversible.</p>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setConfirmDelete(false);
                  setPostToDelete(null);
                }}
              >
                Annuler
              </button>
              <button 
                className={styles.deleteConfirmButton}
                onClick={deletePost}
                disabled={loading}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de modération individuelle */}
      {showModerationModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Modérer le post</h3>
            <p>Veuillez indiquer la raison de la modération :</p>
            <textarea
              className={styles.moderationTextarea}
              placeholder="Raison de la modération..."
              value={moderationReason}
              onChange={(e) => setModerationReason(e.target.value)}
            />
            <div className={styles.reasonTemplates}>
              {moderationReasons.map((reason, index) => (
                <button 
                  key={index}
                  onClick={() => setModerationReason(reason)}
                  type="button"
                >
                  {reason}
                </button>
              ))}
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setShowModerationModal(false);
                  setPostToModerate(null);
                  setModerationReason('');
                }}
              >
                Annuler
              </button>
              <button 
                className={styles.deleteConfirmButton}
                onClick={moderatePost}
                disabled={!moderationReason.trim() || loading}
              >
                Modérer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de modération en masse */}
      {showBulkModerationModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Modération en masse</h3>
            <p>Vous allez modérer {selectedPosts.length} post(s). Veuillez indiquer la raison :</p>
            <textarea
              className={styles.moderationTextarea}
              placeholder="Raison de la modération..."
              value={bulkModerationReason}
              onChange={(e) => setBulkModerationReason(e.target.value)}
            />
            <div className={styles.reasonTemplates}>
              {moderationReasons.map((reason, index) => (
                <button 
                  key={index}
                  onClick={() => setBulkModerationReason(reason)}
                  type="button"
                >
                  {reason}
                </button>
              ))}
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setShowBulkModerationModal(false);
                  setBulkModerationReason('');
                }}
              >
                Annuler
              </button>
              <button 
                className={styles.deleteConfirmButton}
                onClick={() => performBulkAction('moderate', bulkModerationReason)}
                disabled={!bulkModerationReason.trim() || loading}
              >
                Modérer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPosts;