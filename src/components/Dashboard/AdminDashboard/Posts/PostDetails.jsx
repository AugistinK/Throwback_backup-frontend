// components/Dashboard/AdminDashboard/Posts/PostDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import styles from './PostDetails.module.css';
import { socialAPI } from '../../../../utils/socialAPI';

const PostDetails = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  
  // États
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('details');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmModerate, setConfirmModerate] = useState(false);
  const [moderationReason, setModerationReason] = useState('');
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Charger les données du post
  useEffect(() => {
    fetchPostDetails();
  }, [postId]);

  // Charger les commentaires quand on change d'onglet
  useEffect(() => {
    if (tab === 'comments') {
      fetchComments();
    }
  }, [tab, currentPage]);

  // Récupérer les détails du post
  const fetchPostDetails = async () => {
    try {
      setLoading(true);
      const response = await socialAPI.getPostById(postId);
      setPost(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement du post:', err);
      setError("Impossible de charger les détails du post. Vérifiez l'ID ou réessayez plus tard.");
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les commentaires du post
  const fetchComments = async () => {
    try {
      setCommentLoading(true);
      const response = await socialAPI.getPostComments(postId, {
        page: currentPage,
        limit: 10
      });
      setComments(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Erreur lors du chargement des commentaires:', err);
    } finally {
      setCommentLoading(false);
    }
  };

  // Supprimer le post
  const deletePost = async () => {
    try {
      setLoading(true);
      await socialAPI.deletePost(postId);
      navigate('/admin/posts', { 
        state: { message: 'Post supprimé avec succès' } 
      });
    } catch (err) {
      console.error('Erreur lors de la suppression du post:', err);
      setError('Une erreur est survenue lors de la suppression du post');
      setConfirmDelete(false);
    } finally {
      setLoading(false);
    }
  };

  // Modérer le post
  const moderatePost = async () => {
    try {
      setLoading(true);
      await socialAPI.updatePost(postId, { 
        modere: true,
        raison_moderation: moderationReason
      });
      setConfirmModerate(false);
      fetchPostDetails();
    } catch (err) {
      console.error('Erreur lors de la modération du post:', err);
      setError('Une erreur est survenue lors de la modération du post');
      setConfirmModerate(false);
    } finally {
      setLoading(false);
    }
  };

  // Restaurer le post (retirer la modération)
  const restorePost = async () => {
    try {
      setLoading(true);
      await socialAPI.updatePost(postId, { 
        modere: false,
        raison_moderation: ''
      });
      setConfirmRestore(false);
      fetchPostDetails();
    } catch (err) {
      console.error('Erreur lors de la restauration du post:', err);
      setError('Une erreur est survenue lors de la restauration du post');
      setConfirmRestore(false);
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un commentaire
  const deleteComment = async (commentId) => {
    try {
      await socialAPI.deleteComment(commentId);
      fetchComments();
    } catch (err) {
      console.error('Erreur lors de la suppression du commentaire:', err);
    }
  };

  // Formatter la date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss');
    } catch (e) {
      return 'Date inconnue';
    }
  };

  // Formater les hashtags
  const renderHashtags = (hashtags) => {
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
  };

  // Affichage du média
  const renderMedia = (media, type) => {
    if (!media) return null;
    
    return (
      <div className={styles.mediaContainer}>
        {type === 'IMAGE' ? (
          <img 
            src={media.startsWith('/') ? `${process.env.REACT_APP_API_URL || ''}${media}` : media} 
            alt="Contenu du post" 
            className={styles.mediaImage}
          />
        ) : type === 'VIDEO' ? (
          <video 
            src={media.startsWith('/') ? `${process.env.REACT_APP_API_URL || ''}${media}` : media}
            controls
            className={styles.mediaVideo}
          />
        ) : type === 'AUDIO' ? (
          <audio 
            src={media.startsWith('/') ? `${process.env.REACT_APP_API_URL || ''}${media}` : media}
            controls
            className={styles.mediaAudio}
          />
        ) : (
          <div className={styles.unknownMedia}>
            <i className="fas fa-file"></i>
            <span>Média non pris en charge</span>
          </div>
        )}
      </div>
    );
  };

  // Si chargement
  if (loading && !post) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Chargement des détails du post...</p>
      </div>
    );
  }

  // Si erreur
  if (error) {
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
          {post.modere ? (
            <button 
              className={styles.restoreButton}
              onClick={() => setConfirmRestore(true)}
            >
              <i className="fas fa-check"></i>
              Rétablir
            </button>
          ) : (
            <button 
              className={styles.moderateButton}
              onClick={() => setConfirmModerate(true)}
            >
              <i className="fas fa-shield-alt"></i>
              Modérer
            </button>
          )}
          <button 
            className={styles.deleteButton}
            onClick={() => setConfirmDelete(true)}
          >
            <i className="fas fa-trash"></i>
            Supprimer
          </button>
        </div>
      </div>

      {/* Titre et info post */}
      <div className={styles.postHeader}>
        <div className={styles.postId}>
          <span>ID:</span> {post._id}
        </div>
        <div className={styles.postStatus}>
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
                        <button 
                          className={styles.commentActionButton}
                          title="Supprimer le commentaire"
                          onClick={() => deleteComment(comment._id)}
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
                                onClick={() => deleteComment(reply._id)}
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
              >
                Supprimer
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
                disabled={!moderationReason.trim()}
              >
                Modérer
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
              >
                Rétablir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetails;