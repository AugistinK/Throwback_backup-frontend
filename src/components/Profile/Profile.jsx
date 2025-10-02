// src/components/Profile/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { ReactComponent as LocationIcon } from '../../assets/icons/location.svg';
import { ReactComponent as CheckIcon } from '../../assets/icons/check.svg';
import styles from './profile.module.css';
import ProfileTabs from '../Dashboard/UserDashboard/Profile/ProfileTabs';
import UserInfo from './UserInfo';
import MemoryCard from '../Dashboard/UserDashboard/ThrowbackVideos/MemoryCard';
import likeIcon from '../../assets/icons/like.png';
import commentIcon from '../../assets/icons/comment.png';
import HelpAndSupport from './HelpAndSupport';

// ✅ Utilitaires centralisés (plus de duplications locales)
import {
  baseUrl,            // backend normalisé (sans slash final)
  getAvatarUrl,       // construit une URL d’avatar fiable, alignée sur le bon _id_
  toAbsoluteUrl       // transforme un chemin relatif/endpoint en URL absolue
} from '../../utils/imageUrl';

const mockMemories = [
  { id: 'mock1', username: 'User Demo', type: 'posted', videoTitle: 'Sample Video', videoArtist: 'Artist', videoYear: '2000', imageUrl: '/images/default-avatar.jpg', content: 'This is a sample memory', likes: 5, comments: 2 },
  { id: 'mock2', username: 'Another User', type: 'shared', videoTitle: 'Another Video', videoArtist: 'Another Artist', videoYear: '1990', imageUrl: '/images/default-avatar.jpg', content: 'This is another sample memory', likes: 10, comments: 3 }
];

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showProfileTabs, setShowProfileTabs] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeBtn, setActiveBtn] = useState(null);
  const [showHelpSupport, setShowHelpSupport] = useState(false);

  const [memories, setMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(true);
  const [memoriesError, setMemoriesError] = useState(null);

  const handlePlaylistsClick = () => {
    setActiveBtn('playlist');
    navigate('/dashboard/playlists');
  };

  const handleHelpSupportClick = () => setShowHelpSupport(true);

  useEffect(() => { fetchRecentMemories(); /* eslint-disable-next-line */ }, []);

  const fetchRecentMemories = async () => {
    try {
      setMemoriesLoading(true);
      // Route principale publique
      const resp = await fetch(`${baseUrl}/api/public/memories/recent`);
      if (resp.ok) {
        const result = await resp.json();
        if (result.success && result.data) {
          setMemories(formatMemories(result.data));
          setMemoriesError(null);
          setMemoriesLoading(false);
          return;
        }
      }
      // Fallback privé
      const fb = await fetch(`${baseUrl}/api/memories/recent`);
      if (fb.ok) {
        const result = await fb.json();
        if (result.success && result.data) {
          setMemories(formatMemories(result.data));
          setMemoriesError(null);
          setMemoriesLoading(false);
          return;
        }
      }
      setMemories(mockMemories);
      setMemoriesError('Impossible de charger les souvenirs, affichage de données statiques');
    } catch (err) {
      setMemories(mockMemories);
      setMemoriesError('Erreur lors du chargement des souvenirs, affichage de données statiques');
    } finally {
      setMemoriesLoading(false);
    }
  };

  const formatMemories = (data) => {
    if (!Array.isArray(data) || !data.length) return mockMemories;
    return data.map(m => {
      const auteur = m.auteur || {};
      const fallback = toAbsoluteUrl(m.imageUrl) || '/images/default-avatar.png';

      // ✅ avatar auteur robuste (prend en compte id + éventuelle URL fournie)
      const authorImage = getAvatarUrl(auteur, { defaultSrc: fallback });

      return {
        id: m._id || m.id || `memory-${Math.random()}`,
        username: auteur ? (`${auteur.prenom || ''} ${auteur.nom || ''}`.trim() || 'Utilisateur') : 'Utilisateur',
        type: m.type || 'posted',
        videoTitle: m.video?.titre || m.videoTitle || 'Vidéo sans titre',
        videoArtist: m.video?.artiste || m.videoArtist || 'Artiste inconnu',
        videoYear: m.video?.annee || m.videoYear || '----',
        imageUrl: authorImage || '/images/default-avatar.png',
        content: m.contenu || m.content || 'Pas de contenu',
        likes: m.likes || 0,
        comments: m.nb_commentaires || m.comments || 0
      };
    });
  };

  if (editMode) return <UserInfo onBack={() => setEditMode(false)} />;
  if (showProfileTabs) {
    return (
      <div className={styles.tabsPageCenter}>
        <div className={styles.tabsPageContent}>
          <ProfileTabs />
        </div>
      </div>
    );
  }
  if (showHelpSupport) return <HelpAndSupport />;

  return (
    <div className={styles.wrapper}>
      <div className={styles.main}>
        <div className={styles.content}>
          <div className={styles.topButtons} style={{ justifyContent: 'center', marginBottom: 32 }}>
            <button className={`${styles.friendlyBtn} ${activeBtn === 'friendly' ? styles.active : ''}`} onClick={() => setActiveBtn('friendly')}>+ Friendly</button>
            <button className={`${styles.messageBtn} ${activeBtn === 'message' ? styles.active : ''}`} onClick={() => setActiveBtn('message')}>Message</button>
            <button className={`${styles.playlistBtn} ${activeBtn === 'playlist' ? styles.active : ''}`} onClick={handlePlaylistsClick}>Your Playlists</button>
          </div>

          <div className={styles.profileCenterBlock}>
            <div className={styles.profileInfo} style={{ marginBottom: 32 }}>
              <img
                src={getAvatarUrl(user)}
                alt={`${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'Profile picture'}
                className={styles.avatar}
                crossOrigin="anonymous"
                onError={(e) => { e.currentTarget.src = '/images/default-avatar.png'; }}
              />
              <h2 className={styles.name}>{`${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'User'}</h2>
              <p className={styles.bio}>{user?.bio || 'Aucun bio renseigné.'}</p>
              <div className={styles.meta}>
                <div className={styles.metaItem}>
                  <LocationIcon className={styles.icon} />
                  <span>{user?.ville || '—'}</span>
                </div>
                <div className={styles.metaItem}>
                  <CheckIcon className={styles.icon} style={{ color: '#1ec773' }} />
                  <span style={{ color: '#1ec773' }}>Available</span>
                </div>
              </div>
            </div>

            <div className={styles.bottomButtons}>
              <button className={styles.bottomBtn} onClick={() => navigate('/dashboard/settings')}>Setting</button>
              <button className={styles.bottomBtn} onClick={handleHelpSupportClick}>Help & Support</button>
              <button className={styles.bottomBtn} onClick={() => setShowProfileTabs(true)}>Informations</button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.rightStatic}>
        <div className={styles.verticalTicker}>
          <div className={styles.tickerContent}>
            {memoriesLoading ? (
              <div className={styles.loadingContainer}>
                <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
                <p>Loading memories...</p>
              </div>
            ) : memoriesError ? (
              <div className={styles.errorContainer}>
                <FontAwesomeIcon icon={faExclamationTriangle} className={styles.errorIcon} />
                <p>Error loading memories</p>
              </div>
            ) : (
              <>
                {memories.map((memory) => (
                  <MemoryCard
                    key={memory.id || `memory-${Math.random()}`}
                    memory={memory}
                    likeIcon={likeIcon}
                    commentIcon={commentIcon}
                    baseUrl={baseUrl}
                  />
                ))}
                {memories.slice(0, 2).map((memory) => (
                  <MemoryCard
                    key={`duplicate-${memory.id || Math.random()}`}
                    memory={memory}
                    likeIcon={likeIcon}
                    commentIcon={commentIcon}
                    baseUrl={baseUrl}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
