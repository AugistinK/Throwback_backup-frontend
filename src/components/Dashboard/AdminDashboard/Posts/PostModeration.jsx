// components/Dashboard/AdminDashboard/Posts/PostModeration.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import styles from './PostModeration.module.css';
import socialAPI from '../../../../utils/socialAPI';

const PostModeration = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // États principaux
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Pagination et filtres
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [selectedTab, setSelectedTab] = useState('reported');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // États pour les actions
  const [showReason, setShowReason] = useState(false);
  const [moderationReason, setModerationReason] = useState('');
  const [postToModerate, setPostToModerate] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Actions en masse
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionType, setBulkActionType] = useState('');
  const [showBulkModerationModal, setShowBulkModerationModal] = useState(false);
  const [bulkModerationReason, setBulkModerationReason] = useState('');
  
  // Statistiques détaillées
  const [stats, setStats] = useState({
    total: 0,
    reported: 0,
    moderated: 0,
    recent: 0,
    pending: 0,
    autoModerated: 0,
    dismissed: 0
  });

  // Chargement initial
  useEffect(() => {
    fetchModerationStats();
    fetchPostsToModerate();
  }, [currentPage, selectedTab, searchTerm, sortBy]);

  // Gestion des messages de succès depuis la navigation
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
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

  // Récupérer les statistiques de modération
  const fetchModerationStats = useCallback(async () => {
    try {
      const response = await socialAPI.getModerationStats();
      setStats(response.data || {
        total: 0,
        reported: 0,
        moderated: 0,
        recent: 0,
        pending: 0,
        autoModerated: 0,
        dismissed: 0
      });
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      // Les stats ne sont pas critiques, on ne bloque pas l'interface
    }
  }, []);

  // Récupérer les posts à modérer avec gestion d'erreur améliorée
  const fetchPostsToModerate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construire les paramètres selon l'onglet sélectionné
      const params = {
        page: currentPage,
        limit: 12,
        search: searchTerm.trim() || undefined,
        sortBy: sortBy,
        isAdmin: true
      };
      
      switch (selectedTab) {
        case 'reported':
          params.hasReports = true;
          params.status = 'active';
          params.sortBy = 'most_reported';
          break;
        case 'recent':
          params.sortBy = 'newest';
          params.status = 'active';
          break;
        case 'moderated':
          params.status = 'moderated';
          break;
        case 'pending':
          params.hasReports = true;
          params.status = 'active';
          params.sortBy = 'oldest';
          break;
        case 'auto':
          params.status = 'auto_moderated';
          break;
        case 'dismissed':
          params.reportStatus = 'dismissed';
          break;
        default:
          break;
      }
      
      // Appel API pour récupérer les posts
      const response = await socialAPI.getAllPosts(params);
      
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
  }, [currentPage, selectedTab, searchTerm, sortBy]);

  // Fonction pour modérer un post
  const moderatePost = useCallback(async () => {
    if (!postToModerate || !moderationReason.trim()) return;
    
    try {
      setActionLoading(true);
      setError(null);
      
      await socialAPI.moderatePost(postToModerate, moderationReason);
      
      // Réinitialiser l'état et rafraîchir
      setShowReason(false);
      setModerationReason('');
      setPostToModerate(null);
      setSuccessMessage('Post modéré avec succès');
      
      await Promise.all([fetchPostsToModerate(), fetchModerationStats()]);
    } catch (err) {
      console.error('Erreur lors de la modération du post:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'Une erreur est survenue lors de la modération du post');
    } finally {
      setActionLoading(false);
    }
  }, [postToModerate, moderationReason, fetchPostsToModerate, fetchModerationStats]);

  // Fonction pour restaurer un post modéré
  const restorePost = useCallback(async (postId) => {
    try {
      setActionLoading(true);
      setError(null);
      
      await socialAPI.restorePost(postId);
      setSuccessMessage('Post restauré avec succès');
      
      await Promise.all([fetchPostsToModerate(), fetchModerationStats()]);
    } catch (err) {
      console.error('Erreur lors de la restauration du post:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'Une erreur est survenue lors de la restauration du post');
    } finally {
      setActionLoading(false);
    }
  }, [fetchPostsToModerate, fetchModerationStats]);

  // Fonction pour supprimer un post
  const deletePost = useCallback(async (postId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce post ? Cette action est irréversible.')) {
      return;
    }
    
    try {
      setActionLoading(true);
      setError(null);
      
      await socialAPI.adminDeletePost(postId);
      setSuccessMessage('Post supprimé avec succès');
      
      await Promise.all([fetchPostsToModerate(), fetchModerationStats()]);
    } catch (err) {
      console.error('Erreur lors de la suppression du post:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'Une erreur est survenue lors de la suppression du post');
    } finally {
      setActionLoading(false);
    }
  }, [fetchPostsToModerate, fetchModerationStats]);

  // Rejeter les signalements d'un post
  const dismissReports = useCallback(async (postId) => {
    try {
      setActionLoading(true);
      setError(null);
      
      await socialAPI.dismissPostReports(postId);
      setSuccessMessage('Signalements rejetés avec succès');
      
      await Promise.all([fetchPostsToModerate(), fetchModerationStats()]);
    } catch (err) {
      console.error('Erreur lors du rejet des signalements:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'Une erreur est survenue lors du rejet des signalements');
    } finally {
      setActionLoading(false);
    }
  }, [fetchPostsToModerate, fetchModerationStats]);

  // Actions en masse
  const performBulkAction = useCallback(async (action, reason = '') => {
    if (selectedPosts.length === 0) {
      setError('Aucun post sélectionné');
      return;
    }
    
    try {
      setActionLoading(true);
      setError(null);
      
      await socialAPI.bulkActionPosts(action, selectedPosts, reason);
      
      // Réinitialiser les sélections et rafraîchir
      setSelectedPosts([]);
      setShowBulkActions(false);
      setShowBulkModerationModal(false);
      setBulkModerationReason('');
      
      const actionText = action === 'moderate' ? 'modérés' : 
                        action === 'restore' ? 'restaurés' : 
                        action === 'delete' ? 'supprimés' : 'traités';
      setSuccessMessage(`${selectedPosts.length} post(s) ${actionText} avec succès`);
      
      await Promise.all([fetchPostsToModerate(), fetchModerationStats()]);
    } catch (err) {
      console.error(`Erreur lors de l'action en masse "${action}":`, err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || `Une erreur est survenue lors de l'action en masse`);
    } finally {
      setActionLoading(false);
    }
  }, [selectedPosts, fetchPostsToModerate, fetchModerationStats]);

  // Préparer une action en masse
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
  }, [selectedPosts.length, performBulkAction]);

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

  // Fonction pour changer d'onglet
  const handleTabChange = useCallback((tab) => {
    setSelectedTab(tab);
    setCurrentPage(1);
    setSelectedPosts([]);
    setShowBulkActions(false);
  }, []);

  // Fonction pour changer de page
  const handlePageChange = useCallback((page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }, [totalPages]);

  // Recherche avec debounce
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  // Fonctions utilitaires pour le formatage
  const formatDate = useCallback((dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (e) {
      return 'Date inconnue';
    }
  }, []);

  const truncateText = useCallback((text, maxLength = 150) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }, []);

  // Fonction pour obtenir le badge de statut d'un post
  const getStatusBadge = useCallback((post) => {
    if (post.modere) {
      return <span className={`${styles.statusBadge} ${styles.moderated}`}>
        <i className="fas fa-shield-alt"></i>
        Modéré
      </span>;
    } else if (post.signalements && post.signalements.length > 0) {
      return <span className={`${styles.statusBadge} ${styles.reported}`}>
        <i className="fas fa-flag"></i>
        Signalé ({post.signalements.length})
      </span>;
    } else if (post.autoModerated) {
      return <span className={`${styles.statusBadge} ${styles.autoModerated}`}>
        <i className="fas fa-robot"></i>
        Auto-modéré
      </span>;
    } else {
      return <span className={`${styles.statusBadge} ${styles.active}`}>
        <i className="fas fa-check-circle"></i>
        Actif
      </span>;
    }
  }, []);

  // Obtenir la priorité d'un post
  const getPostPriority = useCallback((post) => {
    const reportCount = post.signalements?.length || 0;
    if (reportCount >= 5) return 'high';
    if (reportCount >= 2) return 'medium';
    return 'low';
  }, []);

  // Raisons de modération prédéfinies
  const moderationReasons = [
    'Contenu inapproprié',
    'Violation des conditions d\'utilisation',
    'Contenu offensant',
    'Informations erronées',
    'Spam ou contenu indésirable',
    'Contenu dupliqué',
    'Harcèlement',
    'Contenu violent'
  ];

  return (
    <div className={styles.moderationPage}>
      {/* En-tête */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Centre de Modération</h1>
          <p className={styles.subtitle}>
            Gérez et modérez le contenu de la plateforme ThrowBack
          </p>
        </div>
        <div className={styles.actions}>
          {selectedPosts.length > 0 && (
            <div className={styles.bulkActionContainer}>
              <button 
                className={styles.bulkActionButton}
                onClick={() => setShowBulkActions(!showBulkActions)}
              >
                <i className="fas fa-list-check"></i>
                Actions ({selectedPosts.length})
                <i className={`fas fa-chevron-${showBulkActions ? 'up' : 'down'}`}></i>
              </button>
              
              {showBulkActions && (
                <div className={styles.bulkActionDropdown}>
                  <button onClick={() => prepareBulkAction('restore')}>
                    <i className="fas fa-check"></i> Approuver
                  </button>
                  <button onClick={() => prepareBulkAction('moderate')}>
                    <i className="fas fa-shield-alt"></i> Modérer
                  </button>
                  <button onClick={() => prepareBulkAction('delete')}>
                    <i className="fas fa-trash"></i> Supprimer
                  </button>
                  <button onClick={() => prepareBulkAction('dismiss')}>
                    <i className="fas fa-times"></i> Rejeter signalements
                  </button>
                </div>
              )}
            </div>
          )}
          <button 
            className={styles.refreshButton}
            onClick={() => {
              fetchModerationStats();
              fetchPostsToModerate();
            }}
            disabled={loading || actionLoading}
          >
            <i className={`fas fa-sync ${(loading || actionLoading) ? styles.spinning : ''}`}></i>
            Rafraîchir
          </button>
          <button 
            className={styles.backButton}
            onClick={() => navigate('/admin/posts')}
          >
            <i className="fas fa-list"></i>
            Liste des posts
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

      {/* Statistiques de modération */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statTotal}`}>
          <div className={styles.statIcon}>
            <i className="fas fa-file-alt"></i>
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.total}</h3>
            <p>Total des posts</p>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.statReported}`}>
          <div className={styles.statIcon}>
            <i className="fas fa-flag"></i>
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.reported}</h3>
            <p>Posts signalés</p>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.statModerated}`}>
          <div className={styles.statIcon}>
            <i className="fas fa-shield-alt"></i>
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.moderated}</h3>
            <p>Posts modérés</p>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.statPending}`}>
          <div className={styles.statIcon}>
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.pending}</h3>
            <p>En attente</p>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.statRecent}`}>
          <div className={styles.statIcon}>
            <i className="fas fa-clock"></i>
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.recent}</h3>
            <p>Dernières 24h</p>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.statAuto}`}>
          <div className={styles.statIcon}>
            <i className="fas fa-robot"></i>
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.autoModerated || 0}</h3>
            <p>Auto-modérés</p>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className={styles.filtersSection}>
        <div className={styles.searchContainer}>
          <div className={styles.searchInputContainer}>
            <input 
              type="text"
              placeholder="Rechercher par contenu, auteur..."
              value={searchTerm}
              onChange={handleSearchChange}
              className={styles.searchInput}
            />
            <i className="fas fa-search"></i>
          </div>
        </div>
        
        <div className={styles.filterControls}>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.sortSelect}
          >
            <option value="newest">Plus récents</option>
            <option value="oldest">Plus anciens</option>
            <option value="most_reported">Plus signalés</option>
            <option value="most_liked">Plus likés</option>
            <option value="most_commented">Plus commentés</option>
          </select>
          
          {selectedPosts.length > 0 && (
            <div className={styles.selectionInfo}>
              <span>{selectedPosts.length} post(s) sélectionné(s)</span>
              <button onClick={() => setSelectedPosts([])}>
                <i className="fas fa-times"></i>
                Désélectionner
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Onglets de modération */}
      <div className={styles.moderationTabs}>
        <button 
          className={`${styles.tabButton} ${selectedTab === 'reported' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('reported')}
        >
          <i className="fas fa-flag"></i>
          Signalés
          {stats.reported > 0 && <span className={styles.tabBadge}>{stats.reported}</span>}
        </button>
        <button 
          className={`${styles.tabButton} ${selectedTab === 'pending' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('pending')}
        >
          <i className="fas fa-exclamation-triangle"></i>
          En attente
          {stats.pending > 0 && <span className={styles.tabBadge}>{stats.pending}</span>}
        </button>
        <button 
          className={`${styles.tabButton} ${selectedTab === 'recent' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('recent')}
        >
          <i className="fas fa-clock"></i>
          Récents
        </button>
        <button 
          className={`${styles.tabButton} ${selectedTab === 'moderated' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('moderated')}
        >
          <i className="fas fa-shield-alt"></i>
          Modérés
        </button>
        <button 
          className={`${styles.tabButton} ${selectedTab === 'auto' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('auto')}
        >
          <i className="fas fa-robot"></i>
          Auto-modérés
        </button>
        <button 
          className={`${styles.tabButton} ${selectedTab === 'dismissed' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('dismissed')}
        >
          <i className="fas fa-check"></i>
          Signalements rejetés
        </button>
      </div>

      {/* Liste des posts à modérer */}
      <div className={styles.moderationContent}>
        {loading && !posts.length ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <h3>Chargement des posts...</h3>
            <p>Veuillez patienter pendant que nous récupérons les données</p>
          </div>
        ) : posts.length === 0 ? (
          <div className={styles.emptyContainer}>
            <div className={styles.emptyIcon}>
              <i className="fas fa-check-circle"></i>
            </div>
            <h3>Aucun post à modérer</h3>
            <p>Il n'y a actuellement aucun post nécessitant votre attention dans cette catégorie.</p>
            <button 
              className={styles.emptyAction}
              onClick={() => handleTabChange('recent')}
            >
              Voir les posts récents
            </button>
          </div>
        ) : (
          <>
            {/* Options de sélection en masse */}
            <div className={styles.bulkSelectionBar}>
              <label className={styles.selectAllLabel}>
                <input 
                  type="checkbox"
                  checked={selectedPosts.length === posts.length && posts.length > 0}
                  onChange={handleSelectAll}
                />
                Sélectionner tout
              </label>
              <span className={styles.resultCount}>
                {totalPosts} post(s) au total
              </span>
            </div>

            {/* Grille des posts */}
            <div className={styles.moderationCards}>
              {posts.map(post => (
                <div 
                  key={post._id} 
                  className={`${styles.moderationCard} ${styles[`priority_${getPostPriority(post)}`]}`}
                >
                  <div className={styles.cardHeader}>
                    <label className={styles.cardCheckbox}>
                      <input 
                        type="checkbox"
                        checked={selectedPosts.includes(post._id)}
                        onChange={(e) => handleSelectPost(e, post._id)}
                      />
                    </label>
                    <div className={styles.authorInfo}>
                      <div className={styles.authorAvatar}>
                        {post.auteur?.photo_profil ? (
                          <img 
                            src={post.auteur.photo_profil}
                            alt={`${post.auteur.prenom} ${post.auteur.nom}`}
                          />
                        ) : (
                          <div className={styles.defaultAvatar}>
                            {post.auteur?.prenom?.[0] || ''}{post.auteur?.nom?.[0] || ''}
                          </div>
                        )}
                      </div>
                      <div className={styles.authorDetails}>
                        <Link 
                          to={`/admin/users/${post.auteur?._id}`}
                          className={styles.authorName}
                        >
                          {post.auteur?.prenom} {post.auteur?.nom}
                        </Link>
                        <span className={styles.postDate}>{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                    <div className={styles.cardStatus}>
                      {getStatusBadge(post)}
                    </div>
                  </div>
                  
                  <div className={styles.cardContent}>
                    <p className={styles.postText}>{truncateText(post.contenu, 200)}</p>
                    
                    {post.media && (
                      <div className={styles.mediaPreview}>
                        <div className={styles.mediaType}>
                          <i className={`fas ${
                            post.type_media === 'IMAGE' ? 'fa-image' : 
                            post.type_media === 'VIDEO' ? 'fa-video' : 
                            post.type_media === 'AUDIO' ? 'fa-music' : 'fa-file'
                          }`}></i>
                          <span>{post.type_media}</span>
                        </div>
                        {post.type_media === 'IMAGE' && (
                          <img 
                            src={post.media.startsWith('/') ? `${process.env.REACT_APP_API_URL || ''}${post.media}` : post.media}
                            alt="Contenu du post" 
                            className={styles.previewImage}
                          />
                        )}
                      </div>
                    )}
                    
                    {/* Résumé des signalements */}
                    {post.signalements && post.signalements.length > 0 && (
                      <div className={styles.reportsSection}>
                        <h4>
                          <i className="fas fa-flag"></i>
                          {post.signalements.length} signalement{post.signalements.length > 1 ? 's' : ''}
                        </h4>
                        <div className={styles.reportsList}>
                          {post.signalements.slice(0, 3).map((report, index) => (
                            <div key={index} className={styles.reportItem}>
                              <div className={styles.reportUser}>
                                <Link to={`/admin/users/${report.utilisateur?._id}`}>
                                  {report.utilisateur?.prenom} {report.utilisateur?.nom}:
                                </Link>
                              </div>
                              <div className={styles.reportReason}>
                                "{truncateText(report.raison, 60)}"
                              </div>
                              <div className={styles.reportDate}>
                                {formatDate(report.date)}
                              </div>
                            </div>
                          ))}
                          {post.signalements.length > 3 && (
                            <div className={styles.moreReports}>
                              + {post.signalements.length - 3} autre{post.signalements.length - 3 > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Info de modération si modéré */}
                    {post.modere && (
                      <div className={styles.moderationInfo}>
                        <div className={styles.moderationHeader}>
                          <i className="fas fa-shield-alt"></i>
                          <span>Modéré {post.date_moderation ? `le ${formatDate(post.date_moderation)}` : ''}</span>
                        </div>
                        {post.raison_moderation && (
                          <div className={styles.moderationReason}>
                            <span>Raison:</span> {post.raison_moderation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.cardFooter}>
                    <div className={styles.postStats}>
                      <div className={styles.statItem}>
                        <i className="fas fa-heart"></i>
                        <span>{post.likes?.length || 0}</span>
                      </div>
                      <div className={styles.statItem}>
                        <i className="fas fa-comment"></i>
                        <span>{post.commentaires?.length || 0}</span>
                      </div>
                      <div className={styles.statItem}>
                        <i className="fas fa-share"></i>
                        <span>{post.partages || 0}</span>
                      </div>
                      <div className={styles.statItem}>
                        <i className="fas fa-eye"></i>
                        <span>{post.vues || 0}</span>
                      </div>
                    </div>
                    
                    <div className={styles.cardActions}>
                      <Link 
                        to={`/admin/posts/${post._id}`} 
                        className={styles.actionButton}
                        title="Voir détails"
                      >
                        <i className="fas fa-eye"></i>
                      </Link>
                      
                      {post.signalements && post.signalements.length > 0 && (
                        <button 
                          className={`${styles.actionButton} ${styles.dismissButton}`}
                          title="Rejeter signalements"
                          onClick={() => dismissReports(post._id)}
                          disabled={actionLoading}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                      
                      {post.modere ? (
                        <button 
                          className={`${styles.actionButton} ${styles.restoreButton}`}
                          title="Restaurer"
                          onClick={() => restorePost(post._id)}
                          disabled={actionLoading}
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      ) : (
                        <button 
                          className={`${styles.actionButton} ${styles.moderateButton}`}
                          title="Modérer"
                          onClick={() => {
                            setPostToModerate(post._id);
                            setShowReason(true);
                          }}
                          disabled={actionLoading}
                        >
                          <i className="fas fa-shield-alt"></i>
                        </button>
                      )}
                      
                      <button 
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        title="Supprimer"
                        onClick={() => deletePost(post._id)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
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

      {/* Modale de modération individuelle */}
      {showReason && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Modérer le post</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={() => {
                  setShowReason(false);
                  setPostToModerate(null);
                  setModerationReason('');
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Veuillez indiquer la raison de la modération:</p>
              <textarea 
                className={styles.reasonTextarea}
                placeholder="Raison de la modération..."
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
              ></textarea>
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
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setShowReason(false);
                  setPostToModerate(null);
                  setModerationReason('');
                }}
              >
                Annuler
              </button>
              <button 
                className={styles.moderateButton}
                onClick={moderatePost}
                disabled={!moderationReason.trim() || actionLoading}
              >
                {actionLoading ? 'Modération...' : 'Modérer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de modération en masse */}
      {showBulkModerationModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Modération en masse</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={() => {
                  setShowBulkModerationModal(false);
                  setBulkModerationReason('');
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Vous allez modérer {selectedPosts.length} post(s). Veuillez indiquer la raison :</p>
              <textarea
                className={styles.reasonTextarea}
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
            </div>
            <div className={styles.modalFooter}>
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
                className={styles.moderateButton}
                onClick={() => performBulkAction('moderate', bulkModerationReason)}
                disabled={!bulkModerationReason.trim() || actionLoading}
              >
                {actionLoading ? 'Modération...' : 'Modérer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostModeration;