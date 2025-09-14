// components/Dashboard/AdminDashboard/Posts/PostModeration.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import styles from './PostModeration.module.css';
import socialAPI from '../../../../utils/socialAPI';

const PostModeration = () => {
  // États
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [showReason, setShowReason] = useState(false);
  const [moderationReason, setModerationReason] = useState('');
  const [postToModerate, setPostToModerate] = useState(null);
  const [selectedTab, setSelectedTab] = useState('reported');
  const [stats, setStats] = useState({
    total: 0,
    reported: 0,
    moderated: 0,
    recent: 0,
    pending: 0
  });
  
  const navigate = useNavigate();

  // Chargement des posts à modérer lors du chargement initial
  useEffect(() => {
    fetchModerationStats();
    fetchPostsToModerate();
  }, [currentPage, selectedTab]);

  // Récupérer les statistiques de modération
  const fetchModerationStats = async () => {
    try {
      // Dans une implémentation réelle, cela ferait appel à l'API
      // Ici, nous simulons des données de statistiques
      setStats({
        total: 1247,
        reported: 58,
        moderated: 342,
        recent: 125,
        pending: 36
      });
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  };

  // Récupérer les posts à modérer
  const fetchPostsToModerate = async () => {
    try {
      setLoading(true);
      
      // Construire les paramètres selon l'onglet sélectionné
      const params = {
        page: currentPage,
        limit: 10
      };
      
      switch (selectedTab) {
        case 'reported':
          params.hasReports = true;
          params.sortBy = 'most_reported';
          break;
        case 'recent':
          params.sortBy = 'newest';
          break;
        case 'moderated':
          params.status = 'moderated';
          break;
        case 'pending':
          params.hasReports = true;
          params.status = 'active';
          break;
        default:
          break;
      }
      
      // Appel API pour récupérer les posts
      const response = await socialAPI.getAllPosts(params);
      
      setPosts(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalPosts(response.pagination?.total || 0);
    } catch (err) {
      console.error('Erreur lors du chargement des posts:', err);
      setError('Une erreur est survenue lors du chargement des posts');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour modérer un post
  const moderatePost = async () => {
    if (!postToModerate) return;
    
    try {
      setLoading(true);
      
      await socialAPI.updatePost(postToModerate, {
        modere: true,
        raison_moderation: moderationReason
      });
      
      // Réinitialiser l'état et rafraîchir la liste
      setShowReason(false);
      setModerationReason('');
      setPostToModerate(null);
      fetchPostsToModerate();
      fetchModerationStats();
    } catch (err) {
      console.error('Erreur lors de la modération du post:', err);
      setError('Une erreur est survenue lors de la modération du post');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour restaurer un post modéré
  const restorePost = async (postId) => {
    try {
      setLoading(true);
      
      await socialAPI.updatePost(postId, {
        modere: false,
        raison_moderation: ''
      });
      
      // Rafraîchir la liste
      fetchPostsToModerate();
      fetchModerationStats();
    } catch (err) {
      console.error('Erreur lors de la restauration du post:', err);
      setError('Une erreur est survenue lors de la restauration du post');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour supprimer un post
  const deletePost = async (postId) => {
    try {
      setLoading(true);
      
      await socialAPI.deletePost(postId);
      
      // Rafraîchir la liste
      fetchPostsToModerate();
      fetchModerationStats();
    } catch (err) {
      console.error('Erreur lors de la suppression du post:', err);
      setError('Une erreur est survenue lors de la suppression du post');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour changer d'onglet
  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    setCurrentPage(1);
  };

  // Fonction pour changer de page
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Fonctions utilitaires pour le formatage
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (e) {
      return 'Date inconnue';
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Fonction pour obtenir le badge de statut d'un post
  const getStatusBadge = (post) => {
    if (post.modere) {
      return <span className={`${styles.statusBadge} ${styles.moderated}`}>Modéré</span>;
    } else if (post.signalements && post.signalements.length > 0) {
      return <span className={`${styles.statusBadge} ${styles.reported}`}>Signalé ({post.signalements.length})</span>;
    } else {
      return <span className={`${styles.statusBadge} ${styles.active}`}>Actif</span>;
    }
  };

  return (
    <div className={styles.moderationPage}>
      {/* En-tête */}
      <div className={styles.header}>
        <h1 className={styles.title}>Modération des Posts</h1>
        <div className={styles.actions}>
          <button 
            className={styles.refreshButton}
            onClick={() => {
              fetchModerationStats();
              fetchPostsToModerate();
            }}
            disabled={loading}
          >
            <i className={`fas fa-sync ${loading ? styles.spinning : ''}`}></i>
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

      {/* Statistiques de modération */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
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
        
        <div className={`${styles.statCard} ${styles.statRecent}`}>
          <div className={styles.statIcon}>
            <i className="fas fa-clock"></i>
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.recent}</h3>
            <p>Dernières 24h</p>
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
      </div>

      {/* Onglets de modération */}
      <div className={styles.moderationTabs}>
        <button 
          className={`${styles.tabButton} ${selectedTab === 'reported' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('reported')}
        >
          <i className="fas fa-flag"></i>
          Signalés
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
          className={`${styles.tabButton} ${selectedTab === 'pending' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('pending')}
        >
          <i className="fas fa-exclamation-triangle"></i>
          En attente
        </button>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className={styles.errorMessage}>
          <i className="fas fa-exclamation-circle"></i>
          {error}
          <button onClick={() => setError(null)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Liste des posts à modérer */}
      <div className={styles.moderationCards}>
        {loading && !posts.length ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Chargement des posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className={styles.emptyContainer}>
            <div className={styles.emptyIcon}>
              <i className="fas fa-check-circle"></i>
            </div>
            <h3>Aucun post à modérer</h3>
            <p>Il n'y a actuellement aucun post nécessitant votre attention dans cette catégorie.</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post._id} className={styles.moderationCard}>
              <div className={styles.cardHeader}>
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
                  <div className={styles.authorName}>
                    <span>{post.auteur?.prenom} {post.auteur?.nom}</span>
                    <span className={styles.postDate}>{formatDate(post.createdAt)}</span>
                  </div>
                </div>
                {getStatusBadge(post)}
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
                      {post.signalements.slice(0, 2).map((report, index) => (
                        <div key={index} className={styles.reportItem}>
                          <span className={styles.reportUser}>
                            {report.utilisateur?.prenom} {report.utilisateur?.nom}:
                          </span>
                          <span className={styles.reportReason}>
                            "{truncateText(report.raison, 50)}"
                          </span>
                        </div>
                      ))}
                      {post.signalements.length > 2 && (
                        <div className={styles.moreReports}>
                          + {post.signalements.length - 2} autre{post.signalements.length - 2 > 1 ? 's' : ''}
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
                </div>
                
                <div className={styles.cardActions}>
                  <Link 
                    to={`/admin/posts/${post._id}`} 
                    className={styles.actionButton}
                    title="Voir détails"
                  >
                    <i className="fas fa-eye"></i>
                  </Link>
                  
                  {post.modere ? (
                    <button 
                      className={styles.actionButton}
                      title="Rétablir"
                      onClick={() => restorePost(post._id)}
                    >
                      <i className="fas fa-check"></i>
                    </button>
                  ) : (
                    <button 
                      className={styles.actionButton}
                      title="Modérer"
                      onClick={() => {
                        setPostToModerate(post._id);
                        setShowReason(true);
                      }}
                    >
                      <i className="fas fa-shield-alt"></i>
                    </button>
                  )}
                  
                  <button 
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    title="Supprimer"
                    onClick={() => deletePost(post._id)}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))
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

      {/* Modale de modération */}
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
                <button onClick={() => setModerationReason('Contenu inapproprié')}>
                  Contenu inapproprié
                </button>
                <button onClick={() => setModerationReason('Violation des conditions d\'utilisation')}>
                  Violation des CGU
                </button>
                <button onClick={() => setModerationReason('Contenu offensant')}>
                  Contenu offensant
                </button>
                <button onClick={() => setModerationReason('Informations erronées')}>
                  Informations erronées
                </button>
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
                disabled={!moderationReason.trim()}
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

export default PostModeration;