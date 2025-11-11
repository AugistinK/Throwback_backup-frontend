// src/components/Dashboard/UserDashboard/Chat/ChatHeader.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faSearch,
  faEllipsisVertical,
  faPhone,
  faVideo,
  faCircle,
  faUser,
  faBan,
  faTrash,
  faBell,
  faBellSlash
} from '@fortawesome/free-solid-svg-icons';
import styles from './Chat.module.css';

const ChatHeader = ({ participant, isOnline, onBack }) => {
  const [showMenu, setShowMenu] = useState(false);

  const getInitials = (nom, prenom) => {
    return `${nom[0]}${prenom[0]}`.toUpperCase();
  };

  return (
    <div className={styles.chatHeader}>
      <div className={styles.chatHeaderLeft}>
        <button className={styles.backButton} onClick={onBack}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        
        <div className={styles.chatHeaderAvatar}>
          {participant.photo_profil ? (
            <img 
              src={participant.photo_profil} 
              alt={`${participant.prenom} ${participant.nom}`}
              className={styles.headerAvatarImage}
            />
          ) : (
            <div className={styles.headerAvatarPlaceholder}>
              {getInitials(participant.nom, participant.prenom)}
            </div>
          )}
          {isOnline && (
            <span className={styles.headerOnlineIndicator}>
              <FontAwesomeIcon icon={faCircle} />
            </span>
          )}
        </div>

        <div className={styles.chatHeaderInfo}>
          <h3 className={styles.chatHeaderName}>
            {`${participant.prenom} ${participant.nom}`}
          </h3>
          <p className={styles.chatHeaderStatus}>
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </p>
        </div>
      </div>

      <div className={styles.chatHeaderActions}>
        <button className={styles.headerActionButton} title="Rechercher">
          <FontAwesomeIcon icon={faSearch} />
        </button>
        <button className={styles.headerActionButton} title="Appel vocal">
          <FontAwesomeIcon icon={faPhone} />
        </button>
        <button className={styles.headerActionButton} title="Appel vidéo">
          <FontAwesomeIcon icon={faVideo} />
        </button>
        <button 
          className={styles.headerActionButton}
          onClick={() => setShowMenu(!showMenu)}
          title="Plus d'options"
        >
          <FontAwesomeIcon icon={faEllipsisVertical} />
        </button>

        {showMenu && (
          <>
            <div 
              className={styles.menuOverlay} 
              onClick={() => setShowMenu(false)}
            />
            <div className={styles.headerDropdown}>
              <button className={styles.dropdownItem}>
                <FontAwesomeIcon icon={faUser} />
                Voir le profil
              </button>
              <button className={styles.dropdownItem}>
                <FontAwesomeIcon icon={faBell} />
                Désactiver les notifications
              </button>
              <div className={styles.dropdownDivider} />
              <button className={`${styles.dropdownItem} ${styles.dangerItem}`}>
                <FontAwesomeIcon icon={faBan} />
                Bloquer
              </button>
              <button className={`${styles.dropdownItem} ${styles.dangerItem}`}>
                <FontAwesomeIcon icon={faTrash} />
                Supprimer la conversation
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;