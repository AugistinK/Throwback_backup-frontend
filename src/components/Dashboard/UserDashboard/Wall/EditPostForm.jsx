// components/Dashboard/UserDashboard/Wall/EditPostForm.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faImage, 
  faVideo, 
  faMusic, 
  faGlobe, 
  faUserFriends, 
  faLock, 
  faSave,
  faTimesCircle,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../utils/api';
import { socialAPI } from '../../../../utils/api';
import AvatarInitials from '../../../Common/AvatarInitials';
import styles from './CreatePostForm.module.css';

const EditPostForm = ({ post, onPostUpdated, onCancel }) => {
  const [content, setContent] = useState(post?.contenu || '');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(post?.media || null);
  const [visibility, setVisibility] = useState(post?.visibilite || 'PUBLIC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  // Limites de taille pour les fichiers uniquement
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  useEffect(() => {
    if (post) {
      setContent(post.contenu || '');
      setVisibility(post.visibilite || 'PUBLIC');
      
      if (post.media) {
        setMediaPreview(post.media);
      }
    }
  }, [post]);

  // Gestion de l'upload de média
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Taille max 50MB
    if (file.size > MAX_FILE_SIZE) {
      setError('The file is too large. Max size: 50MB');
      return;
    }
    
    const previewUrl = URL.createObjectURL(file);
    setMediaFile(file);
    setMediaPreview(previewUrl);
    setError(null);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Gestion du changement de contenu sans limite de caractères
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && !mediaFile && !post.media) {
      setError('Please add text or media to your post');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Extraire les hashtags
      const hashtags = content.match(/#[\w\u00C0-\u017F]+/g) || [];
      
      // Préparer les données pour la mise à jour
      let updateData = {
        contenu: content,
        visibilite: visibility,
        hashtags: hashtags.map(tag => tag.substring(1))
      };
      
      // Si un nouveau fichier média est sélectionné, l'uploader séparément
      if (mediaFile) {
        // Cette partie dépend de l'API - certains backends gèrent l'upload séparément
        const formData = new FormData();
        formData.append('media', mediaFile);
        
        // Utiliser une API spécifique pour l'upload de média si disponible
        try {
          const mediaResponse = await api.post(`/api/posts/${post._id}/media`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          // Si l'API retourne l'URL du média, l'ajouter aux données de mise à jour
          if (mediaResponse.data?.media) {
            updateData.media = mediaResponse.data.media;
          }
        } catch (mediaError) {
          console.error('Erreur lors de l\'upload du média:', mediaError);
          // Continuer avec la mise à jour sans le média si l'upload échoue
        }
      }
      
      // Mise à jour du post
      const response = await socialAPI.updatePost(post._id, updateData);
      
      // Callback après la mise à jour
      if (onPostUpdated) {
        onPostUpdated(response.data);
      }
      
      // Fermer le formulaire d'édition
      if (onCancel) {
        onCancel();
      }
      
    } catch (err) {
      console.error('Erreur lors de la mise à jour du post:', err);
      
      // Gestion détaillée des erreurs
      if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Invalid data. Please check your post.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to edit this post.');
      } else {
        setError(err.response?.data?.message || 'An error occurred while updating the post.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderVisibilityIcon = () => {
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

  const toggleVisibility = () => {
    const visibilities = ['PUBLIC', 'FRIENDS', 'PRIVATE'];
    const currentIndex = visibilities.indexOf(visibility);
    const nextIndex = (currentIndex + 1) % visibilities.length;
    setVisibility(visibilities[nextIndex]);
  };

  return (
    <div className={styles.createPostContainer}>
      <div className={styles.editHeader}>
        <h3>Edit Post</h3>
        <button 
          type="button" 
          className={styles.cancelButton}
          onClick={onCancel}
          title="Cancel"
        >
          <FontAwesomeIcon icon={faTimesCircle} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className={styles.createPostForm}>
        <div className={styles.userInfo}>
          {user?.photo_profil ? (
            <img 
              src={user.photo_profil} 
              alt={`${user.prenom} ${user.nom}`} 
              className={styles.userAvatar}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : (
            <AvatarInitials 
              user={user} 
              className={styles.userAvatar} 
            />
          )}
          <div className={styles.userName}>
            {user?.prenom} {user?.nom}
          </div>
          <div className={styles.visibilitySelector} onClick={toggleVisibility}>
            {renderVisibilityIcon()}
            <span className={styles.visibilityText}>
              {visibility === 'PUBLIC' ? 'Public' : 
               visibility === 'FRIENDS' ? 'Friends' : 'Private'}
            </span>
          </div>
        </div>
        
        <div className={styles.contentInput}>
          <textarea
            placeholder="Edit your post content..."
            value={content}
            onChange={handleContentChange}
            disabled={loading}
            rows={mediaPreview ? 2 : 4}
            className={styles.textarea}
          />
          
          <div className={styles.characterCounter}>
            <span className={styles.charCount}>
              {content.length} caractères
            </span>
          </div>
        </div>
        
        {mediaPreview && (
          <div className={styles.mediaPreviewContainer}>
            <button 
              type="button" 
              className={styles.removeMediaButton}
              onClick={removeMedia}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            
            {mediaFile?.type?.startsWith('image/') || post?.media?.includes('.jpg') || post?.media?.includes('.png') || post?.media?.includes('.jpeg') || post?.media?.includes('.gif') ? (
              <img src={mediaPreview} alt="Preview" className={styles.mediaPreview} />
            ) : mediaFile?.type?.startsWith('video/') || post?.media?.includes('.mp4') || post?.media?.includes('.mov') || post?.media?.includes('.avi') ? (
              <video src={mediaPreview} controls className={styles.mediaPreview} />
            ) : mediaFile?.type?.startsWith('audio/') || post?.media?.includes('.mp3') || post?.media?.includes('.wav') ? (
              <audio src={mediaPreview} controls className={styles.audioPreview} />
            ) : null}
          </div>
        )}
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        <div className={styles.formActions}>
          <div className={styles.mediaButtons}>
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className={styles.mediaButton}
              disabled={loading}
              title="Replace media"
            >
              <FontAwesomeIcon icon={faImage} />
              <span>Replace Media</span>
            </button>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*, video/*, audio/*"
              style={{ display: 'none' }}
              disabled={loading}
            />
          </div>
          
          <div className={styles.actionButtons}>
            <button 
              type="button" 
              className={styles.cancelButtonText}
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading || (!content.trim() && !mediaFile && !mediaPreview)}
            >
              {loading ? 'Updating...' : (
                <>
                  <FontAwesomeIcon icon={faSave} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditPostForm;