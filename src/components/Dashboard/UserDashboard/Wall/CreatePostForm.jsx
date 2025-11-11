// components/Dashboard/UserDashboard/Wall/CreatePostForm.jsx
import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faImage, 
  faPaperPlane,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../utils/api';
import AvatarInitials from '../../../Common/AvatarInitials';
import { getUserAvatarUrl } from '../../../../utils/imageHelper';
import { extractHashtags } from '../../../../utils/contentParser';
import styles from './CreatePostForm.module.css';

const CreatePostForm = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  // Limite de taille pour les fichiers - 10MB pour les images
  const MAX_FILE_SIZE = 10 * 1024 * 1024; 

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
    
    if (!content.trim() && !mediaFile) {
      setError('Please add text or an image to your post');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('contenu', content);
      // Tous les posts sont PUBLIC par défaut
      formData.append('visibilite', 'PUBLIC');
      
      if (mediaFile) {
        formData.append('media', mediaFile);
      }
      
      // Extraire les hashtags
      const hashtags = extractHashtags(content);
      if (hashtags.length > 0) {
        hashtags.forEach((tag, index) => {
          formData.append(`hashtags[${index}]`, tag);
        });
      }
      
      const response = await api.post('/api/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Reset du formulaire
      setContent('');
      setMediaFile(null);
      setMediaPreview(null);
      
      if (onPostCreated) {
        onPostCreated(response.data?.data || response.data);
      }
    } catch (err) {
      console.error('Error creating post:', err);
      
      // Gestion détaillée des erreurs
      if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Invalid data. Please check your post.');
      } else if (err.response?.status === 413) {
        setError('The file is too large');
      } else {
        setError(err.response?.data?.message || 'An error occurred while publishing');
      }
    } finally {
      setLoading(false);
    }
  };

  // Obtenir l'URL de l'avatar de l'utilisateur
  const avatarUrl = getUserAvatarUrl(user);

  return (
    <div className={styles.createPostContainer}>
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
            placeholder="Share your musical memories, use #hashtags..."
            value={content}
            onChange={handleContentChange}
            disabled={loading}
            rows={mediaPreview ? 2 : 4}
            className={styles.textarea}
          />
          
          {/* Compteur de caractères */}
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
              title="Add photo"
            >
              <FontAwesomeIcon icon={faImage} />
              <span>Photo</span>
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
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading || (!content.trim() && !mediaFile)}
          >
            {loading ? 'Posting...' : (
              <>
                <FontAwesomeIcon icon={faPaperPlane} />
                <span>Post</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostForm;