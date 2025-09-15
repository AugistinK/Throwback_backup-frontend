// components/Dashboard/AdminDashboard/Posts/PostDetails.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import styles from './PostDetails.module.css';
import socialAPI from '../../../../utils/socialAPI';

const PostDetails = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  
  // États principaux
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // États pour les onglets
  const [tab, setTab] = useState('details');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // États pour les actions
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmModerate, setConfirmModerate] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [moderationReason, setModerationReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // États pour les commentaires
  const [selectedComments, setSelectedComments] = useState([]);
  const [showCommentActions, setShowCommentActions] = useState(false);

  // Charger les données du post au montage et lors du changement d'ID
  useEffect(() => {
    if (postId) {
      fetchPostDetails();
    }
  }, [postId]);

  // Charger les commentaires quand on change d'onglet ou de page
  useEffect(() => {
    if (tab === 'comments' && post) {
      fetchComments();
    }
  }, [tab, currentPage, post]);

  // Charger les analytics quand on change d'onglet
  useEffect(() => {
    if (tab === 'analytics' && post) {
      fetchAnalytics();
    }
  }, [tab, post]);

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

  // Récupérer les détails du post avec gestion d'erreur améliorée
  const fetchPostDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Utiliser l'endpoint admin pour avoir plus de détails
      const response = await socialAPI.getPostById(postId, true);
      setPost(response.data);
      
    } catch (err) {
      console.error('Erreur lors du chargement du post:', err);
      const formattedError = socialAPI.formatApiError(err);
      
      if (formattedError.status === 404) {
        setError("Post non trouvé. Il a peut-être été supprimé.");
      } else {
        setError(formattedError.message || "Impossible de charger les détails du post.");
      }
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // Récupérer les commentaires du post
  const fetchComments = useCallback(async () => {
    try {
      setCommentLoading(true);
      const response = await socialAPI.getPostComments(postId, {
        page: currentPage,
        limit: 10,
        includeReplies: true
      });
      
      setComments(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Erreur lors du chargement des commentaires:', err);
      // Ne pas afficher d'erreur pour les commentaires, ce n'est pas critique
    } finally {
      setCommentLoading(false);
    }
  }, [postId, currentPage]);

  // Récupérer les analytics du post
  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const response = await socialAPI.getPostAnalytics(postId, '30d');
      setAnalytics(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des analytics:', err);
      // Ne pas afficher d'erreur pour les analytics
    } finally {
      setAnalyticsLoading(false);
    }
  }, [postId]);

  // Supprimer le post
  const deletePost = useCallback(async () => {
    try {
      setActionLoading(true);
      setError(null);
      
      await socialAPI.adminDeletePost(postId);
      
      navigate('/admin/posts', { 
        state: { message: 'Post supprimé avec succès' } 
      });
    } catch (err) {
      console.error('Erreur lors de la suppression du post:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'Une erreur est survenue lors de la suppression du post');
      setConfirmDelete(false);
    } finally {
      setActionLoading(false);
    }
  }, [postId, navigate]);

  // Modérer le post
  const moderatePost = useCallback(async () => {
    try {
      setActionLoading(true);
      setError(null);
      
      await socialAPI.moderatePost(postId, moderationReason);
      
      setConfirmModerate(false);
      setModerationReason('');
      setSuccessMessage('Post modéré avec succès');
      
      // Rafraîchir les détails du post
      await fetchPostDetails();
    } catch (err) {
      console.error('Erreur lors de la modération du post:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'Une erreur est survenue lors de la modération du post');
      setConfirmModerate(false);
    } finally {
      setActionLoading(false);
    }
  }, [postId, moderationReason, fetchPostDetails]);

  // Restaurer le post (retirer la modération)
  const restorePost = useCallback(async () => {
    try {
      setActionLoading(true);
      setError(null);
      
      await socialAPI.restorePost(postId);
      
      setConfirmRestore(false);
      setSuccessMessage('Post restauré avec succès');
      
      // Rafraîchir les détails du post
      await fetchPostDetails();
    } catch (err) {
      console.error('Erreur lors de la restauration du post:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'Une erreur est survenue lors de la restauration du post');
      setConfirmRestore(false);
    } finally {
      setActionLoading(false);
    }
  }, [postId, fetchPostDetails]);

  // // Épingler/Désépingler le post
  // const togglePinPost = useCallback(async () => {
  //   try {
  //     setActionLoading(true);
  //     setError(null);
      
  //     const newPinStatus = !post.epingle;
  //     await socialAPI.togglePinPost(postId, newPinStatus);
      
  //     setSuccessMessage(`Post ${newPinStatus ? 'épinglé' : 'désépinglé'} avec succès`);
      
  //     // Rafraîchir les détails du post
  //     await fetchPostDetails();
  //   } catch (err) {
  //     console.error('Erreur lors de l\'épinglage du post:', err);
  //     const formattedError = socialAPI.formatApiError(err);
  //     setError(formattedError.message || 'Une erreur est survenue lors de l\'épinglage');
  //   } finally {
  //     setActionLoading(false);
  //   }
  // }, [postId, post?.epingle, fetchPostDetails]);

  // Rejeter les signalements
  // const dismissReports = useCallback(async () => {
  //   try {
  //     setActionLoading(true);
  //     setError(null);
      
  //     await socialAPI.dismissPostReports(postId);
      
  //     setSuccessMessage('Signalements rejetés avec succès');
      
  //     // Rafraîchir les détails du post
  //     await fetchPostDetails();
  //   } catch (err) {
  //     console.error('Erreur lors du rejet des signalements:', err);
  //     const formattedError = socialAPI.formatApiError(err);
  //     setError(formattedError.message || 'Une erreur est survenue lors du rejet des signalements');
  //   } finally {
  //     setActionLoading(false);
  //   }
  // }, [postId, fetchPostDetails]);

  // Supprimer un commentaire
  const deleteComment = useCallback(async (commentId) => {
    try {
      await socialAPI.deleteComment(commentId);
      setSuccessMessage('Commentaire supprimé avec succès');
      fetchComments();
    } catch (err) {
      console.error('Erreur lors de la suppression du commentaire:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'Une erreur est survenue lors de la suppression du commentaire');
    }
  }, [fetchComments]);

  // Modérer un commentaire
  const moderateComment = useCallback(async (commentId, raison) => {
    try {
      await socialAPI.moderateComment(postId, commentId, raison);
      setSuccessMessage('Commentaire modéré avec succès');
      fetchComments();
    } catch (err) {
      console.error('Erreur lors de la modération du commentaire:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'Une erreur est survenue lors de la modération du commentaire');
    }
  }, [postId, fetchComments]);

  // Restaurer un commentaire
  const restoreComment = useCallback(async (commentId) => {
    try {
      await socialAPI.restoreComment(postId, commentId);
      setSuccessMessage('Commentaire restauré avec succès');
      fetchComments();
    } catch (err) {
      console.error('Erreur lors de la restauration du commentaire:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'Une erreur est survenue lors de la restauration du commentaire');
    }
  }, [postId, fetchComments]);

  // Exporter les données du post
  const exportPostData = useCallback(async () => {
    try {
      // Créer un objet avec toutes les données du post
      const exportData = {
        post: post,
        comments: comments,
        analytics: analytics,
        exportDate: new Date().toISOString()
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `post_${postId}_export_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccessMessage('Données exportées avec succès');
    } catch (err) {
      console.error('Erreur lors de l\'export:', err);
      setError('Une erreur est survenue lors de l\'export');
    }
  }, [post, comments, analytics, postId]);

  // Formatter la date
  const formatDate = useCallback((dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss');
    } catch (e) {
      return 'Date inconnue';
    }
  }, []);

  // Formater les hashtags
  const renderHashtags = useCallback((hashtags) => {
    if (!hashtags || !hashtags.length) return null;
    
    return (
      <div className={styles.hashtagsContainer}>
        {hashtags.map((tag, index) => (
          <span key={index} className={styles.hashtag}>
            #{tag}
          </span>
        ))}
      </div>
    );
  }, []);

  // Affichage du média
  const renderMedia = useCallback((media, type) => {
    if (!media) return null;
    
    const mediaUrl = media.startsWith('/') ? `${process.env.REACT_APP_API_URL || ''}${media}` : media;
    
    return (
      <div className={styles.mediaContainer}>
        {type === 'IMAGE' ? (
          <img 
            src={mediaUrl} 
            alt="Contenu du post" 
            className={styles.mediaImage}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : type === 'VIDEO' ? (
          <video 
            src={mediaUrl}
            controls
            className={styles.mediaVideo}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : type === 'AUDIO' ? (
          <audio 
            src={mediaUrl}
            controls
            className={styles.mediaAudio}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className={styles.unknownMedia}>
            <i className="fas fa-file"></i>
            <span>Média non pris en charge</span>
          </div>
        )}
      </div>
    );
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

  // Si chargement initial
  if (loading && !post) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Chargement des détails du post...</p>
      </div>
    );
  }

  // Si erreur critique
  if (error && !post) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <h2>Une erreur est survenue</h2>
        <p>{error}</p>
        <div className={styles.errorActions}>
          <button 
            onClick={() => navigate('/admin/posts')}
            className={styles.errorButton}
          >
            Retour à la liste
          </button>
          <button 
            onClick={fetchPostDetails}
            className={styles.errorButton}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Si aucun post trouvé
  if (!post) {
    return (
      <div className={styles.notFoundContainer}>
        <div className={styles.notFoundIcon}>
          <i className="fas fa-search"></i>
        </div>
        <h2>Post non trouvé</h2>
        <p>Le post que vous recherchez n'existe pas ou a été supprimé.</p>
        <Link to="/admin/posts" className={styles.backButton}>
          Retour à la liste des posts
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.postDetails}>
      {/* En-tête */}
      <div className={styles.header}>
        <div className={styles.breadcrumbs}>
          <Link to="/admin/posts">Posts</Link>
          <i className="fas fa-chevron-right"></i>
          <span>Détails</span>
        </div>
        <div className={styles.actions}>
          <button 
            className={styles.backButton}
            onClick={() => navigate('/admin/posts')}
          >
            <i className="fas fa-arrow-left"></i>
            Retour
          </button>
          <button 
            className={styles.exportButton}
            onClick={exportPostData}
            disabled={actionLoading}
          >
            <i className="fas fa-download"></i>
            Exporter
          </button>
          {/* <button 
            className={styles.pinButton}
            onClick={togglePinPost}
            disabled={actionLoading}
            title={post.epingle ? 'Désépingler' : 'Épingler'}
          >
            <i className={`fas ${post.epingle ? 'fa-thumbtack' : 'fa-thumbtack'}`}></i>
            {post.epingle ? 'Désépingler' : 'Épingler'}
          </button> */}
          {/* {post.signalements && post.signalements.length > 0 && (
            <button 
              className={styles.dismissButton}
              onClick={dismissReports}
              disabled={actionLoading}
            >
              <i className="fas fa-times"></i>
              Rejeter signalements
            </button>
          )} */}
          {post.modere ? (
            <button 
              className={styles.restoreButton}
              onClick={() => setConfirmRestore(true)}
              disabled={actionLoading}
            >
              <i className="fas fa-check"></i>
              Rétablir
            </button>
          ) : (
            <button 
              className={styles.moderateButton}
              onClick={() => setConfirmModerate(true)}
              disabled={actionLoading}
            >
              <i className="fas fa-shield-alt"></i>
              Modérer
            </button>
          )}
          <button 
            className={styles.deleteButton}
            onClick={() => setConfirmDelete(true)}
            disabled={actionLoading}
          >
            <i className="fas fa-trash"></i>
            Supprimer
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

      {/* Titre et info post */}
      <div className={styles.postHeader}>
        <div className={styles.postId}>
          <span>ID:</span> {post._id}
        </div>
        <div className={styles.postStatus}>
          {post.epingle && (
            <span className={`${styles.statusBadge} ${styles.status_pinned}`}>
              <i className="fas fa-thumbtack"></i>
              Épinglé
            </span>
          )}
          <span className={`${styles.statusBadge} ${styles[`status_${post.modere ? 'moderated' : 'active'}`]}`}>
            {post.modere ? 'Modéré' : 'Actif'}
          </span>
          <span className={`${styles.visibilityBadge} ${styles[`visibility_${post.visibilite?.toLowerCase()}`]}`}>
            {post.visibilite}
          </span>
        </div>
      </div>

      {/* Onglets */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tabButton} ${tab === 'details' ? styles.activeTab : ''}`}
          onClick={() => setTab('details')}
        >
          Détails
        </button>
        <button 
          className={`${styles.tabButton} ${tab === 'comments' ? styles.activeTab : ''}`}
          onClick={() => setTab('comments')}
        >
          Commentaires ({post.commentaires?.length || 0})
        </button>
        <button 
          className={`${styles.tabButton} ${tab === 'reports' ? styles.activeTab : ''}`}
          onClick={() => setTab('reports')}
        >
          Signalements ({post.signalements?.length || 0})
        </button>
        <button 
          className={`${styles.tabButton} ${tab === 'analytics' ? styles.activeTab : ''}`}
          onClick={() => setTab('analytics')}
        >
          Analytics
        </button>
      </div>

      {/* Contenu des onglets */}
      <div className={styles.tabContent}>
        {/* Onglet Détails */}
        {tab === 'details' && (
          <div className={styles.detailsTab}>
            <div className={styles.postContent}>
              {/* Auteur */}
              <div className={styles.authorSection}>
                <div className={styles.authorInfo}>
                  <div className={styles.authorAvatar}>
                    {post.auteur?.photo_profil ? (
                      <img 
                        src={post.auteur.photo_profil.startsWith('/') 
                          ? `${process.env.REACT_APP_API_URL || ''}${post.auteur.photo_profil}` 
                          : post.auteur.photo_profil} 
                        alt={`${post.auteur.prenom} ${post.auteur.nom}`} 
                      />
                    ) : (
                      <div className={styles.defaultAvatar}>
                        {post.auteur?.prenom?.[0] || ''}{post.auteur?.nom?.[0] || ''}
                      </div>
                    )}
                  </div>
                  <div className={styles.authorName}>
                    <h3>{post.auteur?.prenom} {post.auteur?.nom}</h3>
                    <Link to={`/admin/users/${post.auteur?._id}`} className={styles.authorLink}>
                      Voir profil
                    </Link>
                  </div>
                </div>
                <div className={styles.postDate}>
                  <div className={styles.dateItem}>
                    <i className="fas fa-calendar-alt"></i>
                    <span>Créé le: {formatDate(post.createdAt)}</span>
                  </div>
                  {post.updatedAt && post.updatedAt !== post.createdAt && (
                    <div className={styles.dateItem}>
                      <i className="fas fa-edit"></i>
                      <span>Modifié le: {formatDate(post.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contenu principal */}
              <div className={styles.mainContent}>
                <div className={styles.postText}>
                  {post.contenu}
                </div>
                
                {/* Hashtags */}
                {renderHashtags(post.hashtags)}
                
                {/* Média */}
                {renderMedia(post.media, post.type_media)}
              </div>

              {/* Statistiques */}
              <div className={styles.statsSection}>
                <div className={styles.statsItem}>
                  <div className={styles.statIcon}>
                    <i className="fas fa-heart"></i>
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statCount}>{post.likes?.length || 0}</span>
                    <span className={styles.statLabel}>Likes</span>
                  </div>
                </div>
                <div className={styles.statsItem}>
                  <div className={styles.statIcon}>
                    <i className="fas fa-comment"></i>
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statCount}>{post.commentaires?.length || 0}</span>
                    <span className={styles.statLabel}>Commentaires</span>
                  </div>
                </div>
                <div className={styles.statsItem}>
                  <div className={styles.statIcon}>
                    <i className="fas fa-share"></i>
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statCount}>{post.partages || 0}</span>
                    <span className={styles.statLabel}>Partages</span>
                  </div>
                </div>
                <div className={styles.statsItem}>
                  <div className={styles.statIcon}>
                    <i className="fas fa-flag"></i>
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statCount}>{post.signalements?.length || 0}</span>
                    <span className={styles.statLabel}>Signalements</span>
                  </div>
                </div>
                <div className={styles.statsItem}>
                  <div className={styles.statIcon}>
                    <i className="fas fa-eye"></i>
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statCount}>{post.vues || 0}</span>
                    <span className={styles.statLabel}>Vues</span>
                  </div>
                </div>
              </div>

              {/* Mentions */}
              {post.mentions && post.mentions.length > 0 && (
                <div className={styles.mentionsSection}>
                  <h3>Mentions</h3>
                  <div className={styles.mentionsList}>
                    {post.mentions.map((mention, index) => (
                      <Link 
                        key={index} 
                        to={`/admin/users/${mention._id}`}
                        className={styles.mentionItem}
                      >
                        <div className={styles.mentionAvatar}>
                          {mention.photo_profil ? (
                            <img 
                              src={mention.photo_profil.startsWith('/') 
                                ? `${process.env.REACT_APP_API_URL || ''}${mention.photo_profil}` 
                                : mention.photo_profil} 
                              alt={`${mention.prenom} ${mention.nom}`} 
                            />
                          ) : (
                            <div className={styles.defaultAvatar}>
                              {mention.prenom?.[0] || ''}{mention.nom?.[0] || ''}
                            </div>
                          )}
                        </div>
                        <span>{mention.prenom} {mention.nom}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Informations de modération */}
              {post.modere && (
                <div className={styles.moderationSection}>
                  <h3>Informations de modération</h3>
                  <div className={styles.moderationInfo}>
                    <div className={styles.moderationItem}>
                      <span className={styles.moderationLabel}>Modéré le:</span>
                      <span>{formatDate(post.date_moderation || post.updatedAt)}</span>
                    </div>
                    {post.modere_par && (
                      <div className={styles.moderationItem}>
                        <span className={styles.moderationLabel}>Modéré par:</span>
                        <Link to={`/admin/users/${post.modere_par}`} className={styles.moderatorLink}>
                          {post.modere_par_nom || 'Administrateur'}
                        </Link>
                      </div>
                    )}
                    {post.raison_moderation && (
                      <div className={styles.moderationItem}>
                        <span className={styles.moderationLabel}>Raison:</span>
                        <span className={styles.moderationReason}>{post.raison_moderation}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Onglet Commentaires */}
        {tab === 'comments' && (
          <div className={styles.commentsTab}>
            {commentLoading ? (
              <div className={styles.loadingCommentsContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Chargement des commentaires...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className={styles.noCommentsContainer}>
                <div className={styles.noCommentsIcon}>
                  <i className="fas fa-comments"></i>
                </div>
                <p>Aucun commentaire sur ce post</p>
              </div>
            ) : (
              <div className={styles.commentsList}>
                {comments.map(comment => (
                  <div key={comment._id} className={styles.commentItem}>
                    <div className={styles.commentHeader}>
                      <div className={styles.commentAuthor}>
                        <div className={styles.authorAvatar}>
                          {comment.auteur?.photo_profil ? (
                            <img 
                              src={comment.auteur.photo_profil.startsWith('/') 
                                ? `${process.env.REACT_APP_API_URL || ''}${comment.auteur.photo_profil}` 
                                : comment.auteur.photo_profil} 
                              alt={`${comment.auteur.prenom} ${comment.auteur.nom}`} 
                            />
                          ) : (
                            <div className={styles.defaultAvatar}>
                              {comment.auteur?.prenom?.[0] || ''}{comment.auteur?.nom?.[0] || ''}
                            </div>
                          )}
                        </div>
                        <div className={styles.authorInfo}>
                          <span className={styles.authorName}>
                            {comment.auteur?.prenom} {comment.auteur?.nom}
                          </span>
                          <span className={styles.commentDate}>
                            {formatDate(comment.creation_date)}
                          </span>
                        </div>
                      </div>
                      <div className={styles.commentActions}>
                        {comment.statut === 'MODERE' ? (
                          <button 
                            className={styles.commentActionButton}
                            title="Restaurer le commentaire"
                            onClick={() => restoreComment(comment._id)}
                          >
                            <i className="fas fa-check"></i>
                          </button>
                        ) : (
                          <button 
                            className={styles.commentActionButton}
                            title="Modérer le commentaire"
                            onClick={() => {
                              const reason = prompt('Raison de la modération:');
                              if (reason) moderateComment(comment._id, reason);
                            }}
                          >
                            <i className="fas fa-shield-alt"></i>
                          </button>
                        )}
                        <button 
                          className={styles.commentActionButton}
                          title="Supprimer le commentaire"
                          onClick={() => {
                            if (window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
                              deleteComment(comment._id);
                            }
                          }}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                        <Link 
                          to={`/admin/users/${comment.auteur?._id}`}
                          className={styles.commentActionButton}
                          title="Voir le profil"
                        >
                          <i className="fas fa-user"></i>
                        </Link>
                      </div>
                    </div>
                    <div className={styles.commentContent}>
                      {comment.contenu}
                    </div>
                    <div className={styles.commentFooter}>
                      <div className={styles.commentStats}>
                        <span className={styles.commentStat}>
                          <i className="fas fa-heart"></i>
                          {comment.likes || 0}
                        </span>
                        <span className={styles.commentStat}>
                          <i className="fas fa-thumbs-down"></i>
                          {comment.dislikes || 0}
                        </span>
                        <span className={styles.commentStat}>
                          <i className="fas fa-reply"></i>
                          {comment.totalReplies || 0}
                        </span>
                      </div>
                      <span className={`${styles.commentStatus} ${comment.statut !== 'ACTIF' ? styles.commentModerated : ''}`}>
                        {comment.statut === 'ACTIF' ? 'Actif' : 
                         comment.statut === 'MODERE' ? 'Modéré' : 
                         comment.statut === 'SUPPRIME' ? 'Supprimé' : 
                         comment.statut}
                      </span>
                    </div>

                    {/* Réponses au commentaire */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className={styles.commentReplies}>
                        {comment.replies.map(reply => (
                          <div key={reply._id} className={styles.replyItem}>
                            <div className={styles.replyHeader}>
                              <div className={styles.replyAuthor}>
                                <div className={styles.authorAvatar}>
                                  {reply.auteur?.photo_profil ? (
                                    <img 
                                      src={reply.auteur.photo_profil.startsWith('/') 
                                        ? `${process.env.REACT_APP_API_URL || ''}${reply.auteur.photo_profil}` 
                                        : reply.auteur.photo_profil} 
                                      alt={`${reply.auteur.prenom} ${reply.auteur.nom}`} 
                                    />
                                  ) : (
                                    <div className={styles.defaultAvatar}>
                                      {reply.auteur?.prenom?.[0] || ''}{reply.auteur?.nom?.[0] || ''}
                                    </div>
                                  )}
                                </div>
                                <div className={styles.authorInfo}>
                                  <span className={styles.authorName}>
                                    {reply.auteur?.prenom} {reply.auteur?.nom}
                                  </span>
                                  <span className={styles.commentDate}>
                                    {formatDate(reply.creation_date)}
                                  </span>
                                </div>
                              </div>
                              <button 
                                className={styles.commentActionButton}
                                title="Supprimer la réponse"
                                onClick={() => {
                                  if (window.confirm('Êtes-vous sûr de vouloir supprimer cette réponse ?')) {
                                    deleteComment(reply._id);
                                  }
                                }}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                            <div className={styles.replyContent}>
                              {reply.contenu}
                            </div>
                          </div>
                        ))}
                        
                        {comment.hasMoreReplies && (
                          <button className={styles.loadMoreReplies}>
                            Voir plus de réponses ({comment.totalReplies - comment.replies.length})
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination des commentaires */}
            {totalPages > 1 && (
              <div className={styles.commentsPagination}>
                <button 
                  className={styles.paginationButton}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <span className={styles.paginationInfo}>
                  Page {currentPage} sur {totalPages}
                </span>
                <button 
                  className={styles.paginationButton}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Onglet Signalements */}
        {tab === 'reports' && (
          <div className={styles.reportsTab}>
            {post.signalements && post.signalements.length > 0 ? (
              <div className={styles.reportsList}>
                {post.signalements.map((report, index) => (
                  <div key={index} className={styles.reportItem}>
                    <div className={styles.reportHeader}>
                      <div className={styles.reportUser}>
                        <div className={styles.authorAvatar}>
                          {report.utilisateur?.photo_profil ? (
                            <img 
                              src={report.utilisateur.photo_profil.startsWith('/') 
                                ? `${process.env.REACT_APP_API_URL || ''}${report.utilisateur.photo_profil}` 
                                : report.utilisateur.photo_profil} 
                              alt={`${report.utilisateur.prenom} ${report.utilisateur.nom}`} 
                            />
                          ) : (
                            <div className={styles.defaultAvatar}>
                              {report.utilisateur?.prenom?.[0] || ''}{report.utilisateur?.nom?.[0] || ''}
                            </div>
                          )}
                        </div>
                        <div className={styles.reportUserInfo}>
                          <span className={styles.userName}>
                            {report.utilisateur?.prenom} {report.utilisateur?.nom}
                          </span>
                          <span className={styles.reportDate}>
                            {formatDate(report.date)}
                          </span>
                        </div>
                      </div>
                      <Link 
                        to={`/admin/users/${report.utilisateur?._id}`}
                        className={styles.viewUserButton}
                      >
                        <i className="fas fa-user"></i>
                        Voir profil
                      </Link>
                    </div>
                    <div className={styles.reportReason}>
                      <span className={styles.reasonLabel}>Motif:</span>
                      <span className={styles.reasonText}>{report.raison}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noReportsContainer}>
                <div className={styles.noReportsIcon}>
                  <i className="fas fa-flag"></i>
                </div>
                <p>Aucun signalement pour ce post</p>
              </div>
            )}
          </div>
        )}

        {/* Onglet Analytics */}
        {tab === 'analytics' && (
          <div className={styles.analyticsTab}>
            {analyticsLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Chargement des analytics...</p>
              </div>
            ) : analytics ? (
              <div className={styles.analyticsContent}>
                <div className={styles.analyticsGrid}>
                  <div className={styles.analyticsCard}>
                    <h4>Vues</h4>
                    <div className={styles.analyticsValue}>{analytics.vues || 0}</div>
                  </div>
                  <div className={styles.analyticsCard}>
                    <h4>Engagements</h4>
                    <div className={styles.analyticsValue}>{analytics.engagements || 0}</div>
                  </div>
                  <div className={styles.analyticsCard}>
                    <h4>Portée</h4>
                    <div className={styles.analyticsValue}>{analytics.portee || 0}</div>
                  </div>
                  <div className={styles.analyticsCard}>
                    <h4>Taux d'engagement</h4>
                    <div className={styles.analyticsValue}>{analytics.tauxEngagement || 0}%</div>
                  </div>
                </div>
                
                {analytics.graphiques && (
                  <div className={styles.chartsSection}>
                    <h4>Évolution des performances</h4>
                    {/* Ici on pourrait intégrer Chart.js ou une autre librairie */}
                    <div className={styles.chartPlaceholder}>
                      <p>Graphiques des performances sur 30 jours</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.noAnalyticsContainer}>
                <div className={styles.noAnalyticsIcon}>
                  <i className="fas fa-chart-bar"></i>
                </div>
                <p>Aucune donnée d'analytics disponible</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      {/* Modale de confirmation de suppression */}
      {confirmDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Confirmer la suppression</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={() => setConfirmDelete(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Êtes-vous sûr de vouloir supprimer ce post ? Cette action est irréversible.</p>
              <p>Tous les commentaires associés seront également supprimés.</p>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => setConfirmDelete(false)}
              >
                Annuler
              </button>
              <button 
                className={styles.deleteConfirmButton}
                onClick={deletePost}
                disabled={actionLoading}
              >
                {actionLoading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de modération */}
      {confirmModerate && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Modérer le post</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={() => setConfirmModerate(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Veuillez indiquer la raison de la modération de ce post.</p>
              <textarea 
                className={styles.moderationTextarea}
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
                onClick={() => setConfirmModerate(false)}
              >
                Annuler
              </button>
              <button 
                className={styles.moderateConfirmButton}
                onClick={moderatePost}
                disabled={!moderationReason.trim() || actionLoading}
              >
                {actionLoading ? 'Modération...' : 'Modérer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de restauration */}
      {confirmRestore && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Rétablir le post</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={() => setConfirmRestore(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Êtes-vous sûr de vouloir rétablir ce post ?</p>
              <p>Le post sera à nouveau visible pour tous les utilisateurs.</p>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => setConfirmRestore(false)}
              >
                Annuler
              </button>
              <button 
                className={styles.restoreConfirmButton}
                onClick={restorePost}
                disabled={actionLoading}
              >
                {actionLoading ? 'Rétablissement...' : 'Rétablir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetails;