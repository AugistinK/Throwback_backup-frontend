// components/Dashboard/UserDashboard/Wall/PostItem.jsx
import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHeart, 
  faComment, 
  faShare, 
  faEllipsisV,
  faFlag,
  faEdit,
  faTrash,
  faSave,
  faTimes,
  faGlobe,
  faUserFriends,
  faLock
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../utils/api';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { fr } from 'date-fns/locale';
import CommentList from './CommentList';
import styles from './PostItem.module.css';

const PostItem = ({ post, onUpdatePost, onDeletePost }) => {
  const [liked, setLiked] = useState(post.likes?.includes(user?.id));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [commentCount, setCommentCount] = useState(post.commentaires?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.contenu);
  const [editVisibility, setEditVisibility] = useState(post.visibilite);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  const { user } = useAuth();

  // Fermer le dropdown au clic en dehors
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  // Fonction pour liker/unliker un post
  const handleLikeClick = async () => {
    try {
      setLoading(true);
      
      const response = await api.post(`/api/posts/${post._id}/like`);
      
      setLiked(response.data.liked);
      setLikeCount(response.data.likeCount);
      
      // Mettre à jour le post dans la liste
      if (onUpdatePost) {
        const updatedPost = {
          ...post,
          likes: response.data.liked 
            ? [...(post.likes || []), user.id]
            : (post.likes || []).filter(id => id !== user.id)
        };
        onUpdatePost(updatedPost);
      }
    } catch (err) {
      console.error('Erreur lors du like/unlike:', err);
      setError('Une erreur est survenue lors du like/unlike');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour partager un post
  const handleShareClick = async () => {
    try {
      setLoading(true);
      
      await api.post(`/api/posts/${post._id}/share`);
      
      // Mettre à jour le compteur de partages
      const updatedPost = {
        ...post,
        partages: (post.partages || 0) + 1
      };
      
      if (onUpdatePost) {
        onUpdatePost(updatedPost);
      }
      
      // Copier le lien dans le presse-papier
      const shareUrl = `${window.location.origin}/dashboard/wall/post/${post._id}`;
      await navigator.clipboard.writeText(shareUrl);
      
      alert('Lien copié dans le presse-papier!');
    } catch (err) {
      console.error('Erreur lors du partage:', err);
      setError('Une erreur est survenue lors du partage');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour signaler un post
  const handleReportClick = async () => {
    try {
      const raison = prompt('Veuillez indiquer la raison du signalement:');
      
      if (!raison) return;
      
      setLoading(true);
      setShowDropdown(false);
      
      await api.post(`/api/posts/${post._id}/report`, { raison });
      
      alert('Post signalé avec succès. Notre équipe de modération va examiner ce contenu.');
    } catch (err) {
      console.error('Erreur lors du signalement:', err);
      setError('Une erreur est survenue lors du signalement');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour supprimer un post
  const handleDeleteClick = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce post?')) {
      return;
    }
    
    try {
      setLoading(true);
      setShowDropdown(false);
      
      await api.delete(`/api/posts/${post._id}`);
      
      if (onDeletePost) {
        onDeletePost(post._id);
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Une erreur est survenue lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour mettre à jour un post
  const handleUpdateClick = async () => {
    try {
      setLoading(true);
      
      const response = await api.put(`/api/posts/${post._id}`, {
        contenu: editContent,
        visibilite: editVisibility
      });
      
      setIsEditing(false);
      
      if (onUpdatePost) {
        onUpdatePost(response.data.data);
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      setError('Une erreur est survenue lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour annuler la modification
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(post.contenu);
    setEditVisibility(post.visibilite);
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

  // Fonction pour changer la visibilité
  const toggleVisibility = () => {
    const visibilities = ['PUBLIC', 'FRIENDS', 'PRIVATE'];
    const currentIndex = visibilities.indexOf(editVisibility);
    const nextIndex = (currentIndex + 1) % visibilities.length;
    setEditVisibility(visibilities[nextIndex]);
  };

  // Formater la date
  const formattedDate = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: fr
  });

  // Afficher le contenu avec les hashtags cliquables
  const renderContent = (content) => {
    // Remplacer les hashtags par des liens
    const contentWithHashtags = content.replace(
      /#[\w\u00C0-\u017F]+/g, 
      match => `<a href="/dashboard/wall?hashtag=${encodeURIComponent(match.substring(1))}" class="${styles.hashtag}">${match}</a>`
    );
    
    return <div dangerouslySetInnerHTML={{ __html: contentWithHashtags }} />;
  };

  return (
    <div className={styles.postItem}>
      <div className={styles.postHeader}>
        <div className={styles.userInfo}>
          <img 
            src={post.auteur?.photo_profil || '/images/default-avatar.jpg'} 
            alt={post.auteur?.prenom} 
            className={styles.userAvatar}
          />
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
        
        <div className={styles.postActions} ref={dropdownRef}>
          <button 
            className={styles.actionButton}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <FontAwesomeIcon icon={faEllipsisV} />
          </button>
          
          {showDropdown && (
            <div className={styles.actionsDropdown}>
              {post.auteur?._id === user?.id && (
                <>
                  <button onClick={() => {
                    setIsEditing(true);
                    setShowDropdown(false);
                  }}>
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Modifier</span>
                  </button>
                  <button onClick={handleDeleteClick}>
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Supprimer</span>
                  </button>
                </>
              )}
              <button onClick={handleReportClick}>
                <FontAwesomeIcon icon={faFlag} />
                <span>Signaler</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.postContent}>
        {isEditing ? (
          <div className={styles.editForm}>
            <div className={styles.editControls}>
              <button 
                className={styles.visibilityButton} 
                onClick={toggleVisibility}
              >
                {renderVisibilityIcon(editVisibility)}
                <span>
                  {editVisibility === 'PUBLIC' ? 'Public' : 
                   editVisibility === 'FRIENDS' ? 'Amis' : 'Privé'}
                </span>
              </button>
            </div>
            
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className={styles.editTextarea}
              rows={4}
            />
            
            <div className={styles.editActions}>
              <button 
                className={styles.cancelButton}
                onClick={handleCancelEdit}
              >
                <FontAwesomeIcon icon={faTimes} />
                <span>Annuler</span>
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleUpdateClick}
                disabled={loading || !editContent.trim()}
              >
                <FontAwesomeIcon icon={faSave} />
                <span>Enregistrer</span>
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.contentText}>
            {renderContent(post.contenu)}
          </div>
        )}
        
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
          <span>{commentCount || 0} commentaires</span>
        </div>
        <div className={styles.statItem}>
          <FontAwesomeIcon icon={faShare} />
          <span>{post.partages || 0} partages</span>
        </div>
      </div>
      
      <div className={styles.postInteraction}>
        <button 
          className={`${styles.interactionButton} ${liked ? styles.likedButton : ''}`}
          onClick={handleLikeClick}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faHeart} />
          <span>{liked ? 'Aimé' : 'J\'aime'}</span>
        </button>
        
        <button 
          className={styles.interactionButton}
          onClick={() => setShowComments(!showComments)}
        >
          <FontAwesomeIcon icon={faComment} />
          <span>Commenter</span>
        </button>
        
        <button 
          className={styles.interactionButton}
          onClick={handleShareClick}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faShare} />
          <span>Partager</span>
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