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
          Connect with your friends around nostalgic music
        </p>

        <div className={styles.emptyChatFeatures}>
          <div className={styles.featureItem}>
            <FontAwesomeIcon icon={faMessage} className={styles.featureIcon} />
            <h3>Instant messaging</h3>
            <p>Chat in real time with your friends</p>
          </div>
          
          <div className={styles.featureItem}>
            <FontAwesomeIcon icon={faMusic} className={styles.featureIcon} />
            <h3>Share music</h3>
            <p>Send your favorite tracks directly in the chat</p>
          </div>
          
          <div className={styles.featureItem}>
            <FontAwesomeIcon icon={faUsers} className={styles.featureIcon} />
            <h3>Group chats</h3>
            <p>Create groups with your friends around your favorite music genres</p>
          </div>
        </div>

        <div className={styles.emptyChatFooter}>
          <p className={styles.emptyChatHint}>
            👈 Select a conversation to start chatting
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmptyChat;