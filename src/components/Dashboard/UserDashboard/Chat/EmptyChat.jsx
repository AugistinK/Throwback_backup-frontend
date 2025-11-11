// src/components/Dashboard/UserDashboard/Chat/EmptyChat.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage, faMusic, faUsers } from '@fortawesome/free-solid-svg-icons';
import styles from './Chat.module.css';

const EmptyChat = () => {
  return (
    <div className={styles.emptyChat}>
      <div className={styles.emptyChatContent}>
        <div className={styles.emptyChatLogo}>
          <FontAwesomeIcon icon={faMessage} />
        </div>
        
        <h2 className={styles.emptyChatTitle}>
          Throwback Chat
        </h2>
        
        <p className={styles.emptyChatSubtitle}>
          Connectez-vous avec vos amis autour de la musique nostalgique
        </p>

        <div className={styles.emptyChatFeatures}>
          <div className={styles.featureItem}>
            <FontAwesomeIcon icon={faMessage} className={styles.featureIcon} />
            <h3>Messages instantanés</h3>
            <p>Discutez en temps réel avec vos amis</p>
          </div>
          
          <div className={styles.featureItem}>
            <FontAwesomeIcon icon={faMusic} className={styles.featureIcon} />
            <h3>Partagez de la musique</h3>
            <p>Envoyez vos morceaux préférés directement dans le chat</p>
          </div>
          
          <div className={styles.featureItem}>
            <FontAwesomeIcon icon={faUsers} className={styles.featureIcon} />
            <h3>Groupes de discussion</h3>
            <p>Créez des groupes avec vos amis autour de vos genres musicaux préférés</p>
          </div>
        </div>

        <div className={styles.emptyChatFooter}>
          <p className={styles.emptyChatHint}>
            👈 Sélectionnez une conversation pour commencer
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmptyChat;