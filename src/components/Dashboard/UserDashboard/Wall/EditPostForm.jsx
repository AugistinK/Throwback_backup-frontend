// components/Dashboard/UserDashboard/Wall/EditPostForm.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faImage, 
  faSave,
  faTimesCircle,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../utils/api';
import AvatarInitials from '../../../Common/AvatarInitials';
import { getUserAvatarUrl, getPostMediaUrl } from '../../../../utils/imageHelper';
import { extractHashtags } from '../../../../utils/contentParser';
import styles from './EditPostForm.module.css';

const EditPostForm = ({ post, onPostUpdated, onCancel }) => {
  const [content, setContent] = useState(post?.contenu || '');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  // Limite de taille pour les fichiers - 10MB pour les images
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  useEffect(() => {
    if (post) {
      setContent(post.contenu || '');
      
      // Utiliser le helper pour obtenir l'URL correcte du média
      if (post.media) {
        const mediaUrl = getPostMediaUrl(post.media);
        setMediaPreview(mediaUrl);
      }
    }
  }, [post]);

  // Gestion de l'upload d'image uniquement
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }
    
    // Taille max 10MB
    if (file.size > MAX_FILE_SIZE) {
      setError('The file is too large. Max size: 10MB');
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

  // Gestion du changement de contenu
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && !mediaFile && !post.media) {
      setError('Please add text or an image to your post');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Extraire les hashtags
      const hashtags = extractHashtags(content);
      
      // Préparer les données pour la mise à jour
      let updateData = {
        contenu: content,
        visibilite: 'PUBLIC', // Tous les posts sont publics
        hashtags: hashtags
      };
      
      // Si un nouveau fichier média est sélectionné
      if (mediaFile) {
        const formData = new FormData();
        formData.append('contenu', content);
        formData.append('visibilite', 'PUBLIC');
        formData.append('media', mediaFile);
        
        if (hashtags.length > 0) {
          hashtags.forEach((tag, index) => {
            formData.append(`hashtags[${index}]`, tag);
          });
        }
        
        // Utiliser FormData pour l'upload avec nouveau média
        const response = await api.put(`/api/posts/${post._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        const updatedPost = response.data.data || response.data;
        
        if (onPostUpdated) {
          onPostUpdated(updatedPost);
        }
      } else {
        // Mise à jour sans nouveau média
        const response = await api.put(`/api/posts/${post._id}`, updateData);
        
        const updatedPost = response.data.data || response.data;
        
        if (onPostUpdated) {
          onPostUpdated(updatedPost);
        }
      }
      
      // Fermer le formulaire d'édition
      if (onCancel) {
        onCancel();
      }
      
    } catch (err) {
      console.error('Error updating post:', err);
      
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

  // Obtenir l'URL de l'avatar de l'utilisateur
  const avatarUrl = getUserAvatarUrl(user);

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
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={`${user?.prenom} ${user?.nom}`} 
              className={styles.userAvatar}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <AvatarInitials 
            user={user} 
            className={styles.userAvatar}
            style={{ display: avatarUrl ? 'none' : 'flex' }}
          />
          <div className={styles.userName}>
            {user?.prenom} {user?.nom}
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
              {content.length} characters
            </span>
          </div>
        </div>
        
        {mediaPreview && (
          <div className={styles.mediaPreviewContainer}>
            <button 
              type="button" 
              className={styles.removeMediaButton}
              onClick={removeMedia}
              title="Remove image"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            
            <img src={mediaPreview} alt="Preview" className={styles.mediaPreview} />
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
              title="Replace image"
            >
              <FontAwesomeIcon icon={faImage} />
              <span>Replace Image</span>
            </button>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
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