// Fichier: components/Dashboard/UserDashboard/Wall/PostItem.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHeart, 
  faComment, 
  faShare, 
  faEllipsisV,
  faEdit,
  faTrash,
  faGlobe,
  faUserFriends,
  faLock,
  faTimes,
  faSave
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../utils/api';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { fr } from 'date-fns/locale';
import CommentList from './CommentList';
import AvatarInitials from '../../../Common/AvatarInitials';
import { errorMessages } from '../../../../utils/errorMessages';
import styles from './PostItem.module.css';

const PostItem = ({ post, onUpdatePost, onDeletePost }) => {
  const { user } = useAuth();
  
  // EXTRACTION ROBUSTE DES IDs
  const getUserId = () => {
    if (!user) return null;
    return user.id || user._id?.toString() || user._id;
  };
  
  const getPostAuthorId = () => {
    if (!post?.auteur) return null;
    return post.auteur._id?.toString() || post.auteur._id || post.auteur.id;
  };
  
  const currentUserId = getUserId();
  const postAuthorId = getPostAuthorId();
  
  // LOGS DE DIAGNOSTIC (à retirer en production)
  useEffect(() => {
    console.group(` POST ITEM - ${post._id}`);
    console.log(" User:", user);
    console.log(" Post:", post);
    console.log(" Current User ID:", currentUserId);
    console.log(" Post Author ID:", postAuthorId);
    console.log(" IDs Match:", currentUserId === postAuthorId);
    console.groupEnd();
  }, [user, post, currentUserId, postAuthorId]);
  
  // Vérification stricte de l'auteur avec conversion en string
  const isAuthor = currentUserId && postAuthorId && 
                  currentUserId.toString() === postAuthorId.toString();
  
  // Vérification admin robuste
  const isAdmin = user && (
    user.role === 'admin' || 
    user.role === 'superadmin' ||
    (Array.isArray(user.roles) && user.roles.some(r => 
      (typeof r === 'string' && ['admin', 'superadmin'].includes(r)) ||
      (r?.libelle_role && ['admin', 'superadmin'].includes(r.libelle_role.toLowerCase()))
    ))
  );

  // Permissions claires
  const canEdit = isAuthor;
  const canDelete = isAuthor || isAdmin;
  
  console.log("🔐 Permissions:", { isAuthor, isAdmin, canEdit, canDelete });
  
  const [liked, setLiked] = useState(post.likes?.includes(currentUserId));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [commentCount, setCommentCount] = useState(post.commentaires?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  
  // États spécifiques pour l'édition
  const [editContent, setEditContent] = useState(post.contenu || '');
  const [editVisibility, setEditVisibility] = useState(post.visibilite || 'PUBLIC');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  // Fermer le dropdown au clic en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fonction pour liker/unliker un post
  const handleLikeClick = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post(`/api/posts/${post._id}/like`);
      
      setLiked(response.data.liked);
      setLikeCount(response.data.likeCount);
      
      if (onUpdatePost) {
        const updatedPost = {
          ...post,
          likes: response.data.liked 
            ? [...(post.likes || []), currentUserId]
            : (post.likes || []).filter(id => id !== currentUserId)
        };
        onUpdatePost(updatedPost);
      }
    } catch (err) {
      console.error('Erreur lors du like/unlike:', err);
      setError(errorMessages.postLike?.error || "Erreur lors du like");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour partager un post
  const handleShareClick = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await api.post(`/api/posts/${post._id}/share`);
      
      const updatedPost = {
        ...post,
        partages: (post.partages || 0) + 1
      };
      
      if (onUpdatePost) {
        onUpdatePost(updatedPost);
      }
      
      const shareUrl = `${window.location.origin}/dashboard/wall/post/${post._id}`;
      await navigator.clipboard.writeText(shareUrl);
      
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Erreur lors du partage:', err);
      setError(errorMessages.postShare?.error || "Erreur lors du partage");
    } finally {
      setLoading(false);
    }
  };

  // FONCTION INTÉGRÉE: Mise à jour du post
  const handleUpdatePost = async (e) => {
    e.preventDefault();
    
    if (!editContent.trim()) {
      setEditError("Le contenu ne peut pas être vide");
      return;
    }
    
    try {
      setEditLoading(true);
      setEditError(null);
      
      const response = await api.put(`/api/posts/${post._id}`, {
        contenu: editContent,
        visibilite: editVisibility
      });
      
      // Mise à jour réussie, on sort du mode édition
      setIsEditing(false);
      
      // On met à jour le post dans le parent
      if (onUpdatePost && response.data.post) {
        onUpdatePost(response.data.post);
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du post:', err);
      setEditError(err.response?.data?.message || 
                  errorMessages.postUpdate?.error || 
                  "Erreur lors de la mise à jour du post");
    } finally {
      setEditLoading(false);
    }
  };
  
  // FONCTION INTÉGRÉE: Suppression du post
  const handleDeletePost = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await api.delete(`/api/posts/${post._id}`);
      
      // Notification au parent de la suppression
      if (onDeletePost) {
        onDeletePost(post._id);
      }
    } catch (err) {
      console.error('Erreur lors de la suppression du post:', err);
      setError(err.response?.data?.message || 
              errorMessages.postDelete?.error || 
              "Erreur lors de la suppression du post");
    } finally {
      setLoading(false);
      setShowDropdown(false);
    }
  };

  // Fonction pour afficher l'icône de visibilité
  const renderVisibilityIcon = (visibility) => {
    switch (visibility) {
      case 'PUBLIC':
        return <FontAwesomeIcon icon={faGlobe} />;
      case 'FRIENDS':
        return <FontAwesomeIcon icon={faUserFriends} />;
      case 'PRIVATE':
        return <FontAwesomeIcon icon={faLock} />;
      default:
        return <FontAwesomeIcon icon={faGlobe} />;
    }
  };

  // Formater la date
  const formattedDate = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: fr
  });

  // Afficher le contenu avec les hashtags cliquables
  const renderContent = (content) => {
    const contentWithHashtags = content.replace(
      /#[\w\u00C0-\u017F]+/g, 
      match => `<a href="/dashboard/wall?hashtag=${encodeURIComponent(match.substring(1))}" class="${styles.hashtag}">${match}</a>`
    );
    
    return <div dangerouslySetInnerHTML={{ __html: contentWithHashtags }} />;
  };

  // Si le mode édition est actif
  if (isEditing) {
    return (
      <div className={styles.postItem}>
        <div className={styles.postHeader}>
          <div className={styles.userInfo}>
            {post.auteur?.photo_profil ? (
              <img 
                src={post.auteur.photo_profil} 
                alt={`${post.auteur.prenom} ${post.auteur.nom}`} 
                className={styles.userAvatar}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : (
              <AvatarInitials 
                user={post.auteur} 
                className={styles.userAvatar} 
              />
            )}
            <div className={styles.userDetails}>
              <div className={styles.userName}>
                {post.auteur?.prenom} {post.auteur?.nom}
              </div>
              <div className={styles.postMetadata}>
                <span className={styles.postDate}>{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleUpdatePost} className={styles.editForm}>
          <div className={styles.editControls}>
            <button 
              type="button" 
              className={styles.visibilityButton}
              onClick={() => {
                const visibilities = ['PUBLIC', 'FRIENDS', 'PRIVATE'];
                const currentIndex = visibilities.indexOf(editVisibility);
                const nextIndex = (currentIndex + 1) % visibilities.length;
                setEditVisibility(visibilities[nextIndex]);
              }}
            >
              {renderVisibilityIcon(editVisibility)}
              <span>
                {editVisibility === 'PUBLIC' ? 'Public' : 
                 editVisibility === 'FRIENDS' ? 'Amis' : 'Privé'}
              </span>
            </button>
          </div>
          
          <textarea
            className={styles.editTextarea}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={5}
            placeholder="Partagez vos souvenirs..."
            required
          />
          
          {editError && (
            <div className={styles.errorMessage}>{editError}</div>
          )}
          
          <div className={styles.editActions}>
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={() => {
                setIsEditing(false);
                setEditContent(post.contenu || '');
                setEditVisibility(post.visibilite || 'PUBLIC');
                setEditError(null);
              }}
              disabled={editLoading}
            >
              <FontAwesomeIcon icon={faTimes} />
              <span>Annuler</span>
            </button>
            
            <button 
              type="submit" 
              className={styles.saveButton}
              disabled={editLoading || !editContent.trim()}
            >
              <FontAwesomeIcon icon={faSave} />
              <span>{editLoading ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.postItem}>
      <div className={styles.postHeader}>
        <div className={styles.userInfo}>
          {post.auteur?.photo_profil ? (
            <img 
              src={post.auteur.photo_profil} 
              alt={`${post.auteur.prenom} ${post.auteur.nom}`} 
              className={styles.userAvatar}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : (
            <AvatarInitials 
              user={post.auteur} 
              className={styles.userAvatar} 
            />
          )}
          <div className={styles.userDetails}>
            <div className={styles.userName}>
              {post.auteur?.prenom} {post.auteur?.nom}
            </div>
            <div className={styles.postMetadata}>
              <span className={styles.postDate}>{formattedDate}</span>
              <span className={styles.postVisibility}>
                {renderVisibilityIcon(post.visibilite)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Menu conditionnel - sans option de report */}
        {user && (canEdit || canDelete) && (
          <div className={styles.postActions} ref={dropdownRef}>
            <button 
              className={styles.actionButton}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <FontAwesomeIcon icon={faEllipsisV} />
            </button>
            
            {showDropdown && (
              <div className={styles.actionsDropdown}>
                {/* Edit - Seulement pour l'auteur */}
                {canEdit && (
                  <button onClick={() => {
                    setIsEditing(true);
                    setEditContent(post.contenu || '');
                    setEditVisibility(post.visibilite || 'PUBLIC');
                    setShowDropdown(false);
                  }}>
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Modifier</span>
                  </button>
                )}
                
                {/* Delete - Pour l'auteur ou admin */}
                {canDelete && (
                  <button onClick={handleDeletePost}>
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Supprimer</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className={styles.postContent}>
        <div className={styles.contentText}>
          {renderContent(post.contenu)}
        </div>
        
        {post.media && (
          <div className={styles.mediaContainer}>
            {post.type_media === 'IMAGE' ? (
              <img 
                src={`${process.env.REACT_APP_API_URL || ''}${post.media}`} 
                alt="Media" 
                className={styles.postImage}
                loading="lazy"
              />
            ) : post.type_media === 'VIDEO' ? (
              <video 
                src={`${process.env.REACT_APP_API_URL || ''}${post.media}`}
                controls
                className={styles.postVideo}
              />
            ) : post.type_media === 'AUDIO' ? (
              <audio 
                src={`${process.env.REACT_APP_API_URL || ''}${post.media}`}
                controls
                className={styles.postAudio}
              />
            ) : null}
          </div>
        )}
      </div>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      <div className={styles.postStats}>
        <div className={styles.statItem}>
          <FontAwesomeIcon icon={faHeart} className={liked ? styles.liked : ''} />
          <span>{likeCount || 0} likes</span>
        </div>
        <div className={styles.statItem}>
          <FontAwesomeIcon icon={faComment} />
          <span>{commentCount || 0} comments</span>
        </div>
        <div className={styles.statItem}>
          <FontAwesomeIcon icon={faShare} />
          <span>{post.partages || 0} shares</span>
        </div>
      </div>
      
      <div className={styles.postInteraction}>
        <button 
          className={`${styles.interactionButton} ${liked ? styles.likedButton : ''}`}
          onClick={handleLikeClick}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faHeart} />
          <span>{liked ? 'Liked' : 'Like'}</span>
        </button>
        
        <button 
          className={styles.interactionButton}
          onClick={() => setShowComments(!showComments)}
        >
          <FontAwesomeIcon icon={faComment} />
          <span>Comment</span>
        </button>
        
        <button 
          className={styles.interactionButton}
          onClick={handleShareClick}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faShare} />
          <span>Share</span>
        </button>
      </div>
      
      {showComments && (
        <CommentList 
          postId={post._id} 
          onCommentCountChange={setCommentCount}
        />
      )}
    </div>
  );
};

export default PostItem;