// components/Dashboard/UserDashboard/Wall/PostItem.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHeart, 
  faComment, 
  faShare, 
  faEllipsisV,
  faEdit,
  faTrash,
  faGlobe
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../utils/api';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { fr } from 'date-fns/locale';
import CommentList from './CommentList';
import AvatarInitials from '../../../Common/AvatarInitials';
import EditPostForm from './EditPostForm';
import { getUserAvatarUrl, getPostMediaUrl } from '../../../../utils/imageHelper';
import { parseContent } from '../../../../utils/contentParser';
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
  
  const [liked, setLiked] = useState(post.likes?.includes(currentUserId));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [commentCount, setCommentCount] = useState(post.commentaires?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

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
      console.error('Error liking/unliking:', err);
      setError(errorMessages.postLike?.error || "Error liking post");
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
      console.error('Error sharing post:', err);
      setError(errorMessages.postShare?.error || "Error sharing post");
    } finally {
      setLoading(false);
    }
  };

  // Fonction appelée après la mise à jour du post
  const handlePostUpdated = (updatedPost) => {
    setIsEditing(false);
    if (onUpdatePost) {
      onUpdatePost(updatedPost);
    }
  };

  // FONCTION INTÉGRÉE: Suppression du post
  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
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
      console.error('Error deleting post:', err);
      setError(err.response?.data?.message || 
              errorMessages.postDelete?.error || 
              "Error deleting post");
    } finally {
      setLoading(false);
      setShowDropdown(false);
    }
  };

  // Formater la date
  const formattedDate = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: fr
  });

  // Afficher le contenu avec les liens et hashtags cliquables
  const renderContent = (content) => {
    if (!content) return null;
    
    // On garde les clés historiques (rétro-compatibles avec le nouveau parser)
    const parsedContent = parseContent(content, {
      parseUrls: true,
      parseHashtags: true,
      parseMentions: false,
    });
    
    return <div dangerouslySetInnerHTML={{ __html: parsedContent }} />;
  };

  // Obtenir les URLs correctes pour les avatars et médias
  const authorAvatarUrl = getUserAvatarUrl(post.auteur);
  const postMediaUrl = post.media ? getPostMediaUrl(post.media) : null;

  // Si le mode édition est actif, utiliser le composant EditPostForm
  if (isEditing) {
    return (
      <div className={styles.postItem}>
        <EditPostForm 
          post={post}
          onPostUpdated={handlePostUpdated}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className={styles.postItem}>
      <div className={styles.postHeader}>
        <div className={styles.userInfo}>
          {authorAvatarUrl ? (
            <img 
              src={authorAvatarUrl} 
              alt={`${post.auteur?.prenom} ${post.auteur?.nom}`} 
              className={styles.userAvatar}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <AvatarInitials 
            user={post.auteur} 
            className={styles.userAvatar}
            style={{ display: authorAvatarUrl ? 'none' : 'flex' }}
          />
          <div className={styles.userDetails}>
            <div className={styles.userName}>
              {post.auteur?.prenom} {post.auteur?.nom}
            </div>
            <div className={styles.postMetadata}>
              <span className={styles.postDate}>{formattedDate}</span>
              <span className={styles.postVisibility}>
                <FontAwesomeIcon icon={faGlobe} />
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
                    setShowDropdown(false);
                  }}>
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Edit</span>
                  </button>
                )}
                
                {/* Delete - Pour l'auteur ou admin */}
                {canDelete && (
                  <button onClick={handleDeletePost}>
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Delete</span>
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
        
        {postMediaUrl && post.type_media === 'IMAGE' && (
          <div className={styles.mediaContainer}>
            <img 
              src={postMediaUrl} 
              alt="Post media" 
              className={styles.postImage}
              loading="lazy"
              onError={(e) => {
                console.error('Failed to load image:', postMediaUrl);
                e.target.style.display = 'none';
              }}
            />
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
