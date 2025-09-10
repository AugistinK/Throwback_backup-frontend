// components/Dashboard/UserDashboard/Wall/CreatePostForm.jsx
import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faImage, 
  faVideo, 
  faMusic, 
  faGlobe, 
  faUserFriends, 
  faLock, 
  faPaperPlane,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../utils/api';
import AvatarInitials from '../../../Common/AvatarInitials';
import styles from './CreatePostForm.module.css';

const CreatePostForm = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [visibility, setVisibility] = useState('PUBLIC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  // Fonction pour gérer l'upload de média
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Vérifier la taille du fichier (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('Le fichier est trop volumineux. Taille maximale: 50MB');
      return;
    }
    
    // Créer une URL pour la prévisualisation
    const previewUrl = URL.createObjectURL(file);
    setMediaFile(file);
    setMediaPreview(previewUrl);
    setError(null);
  };

  // Fonction pour supprimer le média
  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fonction pour publier le post
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && !mediaFile) {
      setError('Veuillez ajouter du contenu ou un média à votre post');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Créer un objet FormData pour envoyer le contenu et le fichier
      const formData = new FormData();
      formData.append('contenu', content);
      formData.append('visibilite', visibility);
      
      if (mediaFile) {
        formData.append('media', mediaFile);
      }
      
      // Extraire les hashtags du contenu
      const hashtags = content.match(/#[\w\u00C0-\u017F]+/g) || [];
      if (hashtags.length > 0) {
        hashtags.forEach((tag, index) => {
          formData.append(`hashtags[${index}]`, tag.substring(1)); // Enlever le # au début
        });
      }
      
      const response = await api.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Réinitialiser le formulaire
      setContent('');
      setMediaFile(null);
      setMediaPreview(null);
      setVisibility('PUBLIC');
      
      // Notifier le composant parent
      if (onPostCreated) {
        onPostCreated(response.data.data);
      }
    } catch (err) {
      console.error('Erreur lors de la création du post:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la publication');
    } finally {
      setLoading(false);
    }
  };

  // Rendu conditionnel du bouton de visibilité
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

  // Fonction pour changer la visibilité
  const toggleVisibility = () => {
    const visibilities = ['PUBLIC', 'FRIENDS', 'PRIVATE'];
    const currentIndex = visibilities.indexOf(visibility);
    const nextIndex = (currentIndex + 1) % visibilities.length;
    setVisibility(visibilities[nextIndex]);
  };

  return (
    <div className={styles.createPostContainer}>
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
               visibility === 'FRIENDS' ? 'Amis' : 'Privé'}
            </span>
          </div>
        </div>
        
        <div className={styles.contentInput}>
          <textarea
            placeholder="Partagez vos souvenirs musicaux, utilisez des #hashtags..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
            rows={mediaPreview ? 2 : 4}
            className={styles.textarea}
          />
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
            
            {mediaFile?.type?.startsWith('image/') ? (
              <img src={mediaPreview} alt="Aperçu" className={styles.mediaPreview} />
            ) : mediaFile?.type?.startsWith('video/') ? (
              <video src={mediaPreview} controls className={styles.mediaPreview} />
            ) : mediaFile?.type?.startsWith('audio/') ? (
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
            >
              <FontAwesomeIcon icon={faImage} />
              <span>Photo</span>
            </button>
            
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className={styles.mediaButton}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faVideo} />
              <span>Vidéo</span>
            </button>
            
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className={styles.mediaButton}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faMusic} />
              <span>Audio</span>
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
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading || (!content.trim() && !mediaFile)}
          >
            {loading ? 'Publication...' : (
              <>
                <FontAwesomeIcon icon={faPaperPlane} />
                <span>Publier</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostForm;