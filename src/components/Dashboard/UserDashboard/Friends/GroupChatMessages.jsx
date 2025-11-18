// src/components/Dashboard/UserDashboard/Friends/GroupChatMessages.jsx
import React from 'react';
import styles from './Friends.module.css';

const GroupChatMessages = ({ messages, loading, getInitials, messagesEndRef }) => {
  return (
    <div className={styles.chatMessages}>
      {loading && (
        <div className={styles.loadingMessages}>
          <div className={styles.spinner}></div>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`${styles.messageWrapper} ${
            msg.isOwn ? styles.messageRight : styles.messageLeft
          }`}
        >
          {!msg.isOwn && (
            <div className={styles.messageAvatar}>
              <div className={styles.miniAvatarPlaceholder}>
                {getInitials(msg.senderName)}
              </div>
            </div>
          )}
          <div className={styles.messageBubble}>
            {!msg.isOwn && (
              <p className={styles.messageSender}>{msg.senderName}</p>
            )}
            <p className={styles.messageText}>{msg.text}</p>
            <span className={styles.messageTime}>{msg.timestamp}</span>
          </div>
        </div>
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default GroupChatMessages;
