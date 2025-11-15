// src/components/Dashboard/UserDashboard/Chat/MessageList.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import MessageItem from './MessageItem';
import styles from './Chat.module.css';

const MessageList = ({
  messages,
  currentUser,
  isTyping,
  loading,
  hasMore,
  onLoadMore,
  participant,
  messagesEndRef,
  isGroup
}) => {
  const getInitials = (nom, prenom) => {
    const text = `${prenom || ''} ${nom || ''}`.trim();
    if (!text) return '';
    return text
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};

    messages.forEach((message) => {
      const date = new Date(message.created_date);
      const dateKey = date.toDateString();

      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: date,
          messages: []
        };
      }

      groups[dateKey].messages.push(message);
    });

    return Object.values(groups).sort((a, b) => a.date - b.date);
  };

  const formatDateLabel = (date) => {
    const now = new Date();
    const messageDate = new Date(date);

    if (messageDate.toDateString() === now.toDateString()) {
      return 'Today';
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    if (messageDate.getFullYear() === now.getFullYear()) {
      return messageDate.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long'
      });
    }

    return messageDate.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className={styles.messageList}>
      {loading && messages.length === 0 ? (
        <div className={styles.loadingMessages}>
          <div className={styles.spinner}></div>
          <p>Loading messages...</p>
        </div>
      ) : (
        <>
          {hasMore && (
            <button
              className={styles.loadMoreButton}
              onClick={onLoadMore}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faChevronDown} />
              Load older messages
            </button>
          )}

          {messageGroups.map((group, groupIndex) => (
            <div key={groupIndex} className={styles.messageGroup}>
              <div className={styles.dateSeparator}>
                <span className={styles.dateLabel}>
                  {formatDateLabel(group.date)}
                </span>
              </div>

              {group.messages.map((message, index) => (
                <MessageItem
                  key={message.id || message.tempId || index}
                  message={message}
                  isOwn={
                    message.sender._id === currentUser.id ||
                    message.sender._id === currentUser._id
                  }
                  showAvatar={
                    index === group.messages.length - 1 ||
                    group.messages[index + 1]?.sender._id !==
                      message.sender._id
                  }
                  participant={participant}
                  currentUser={currentUser}
                  isGroup={isGroup}
                />
              ))}
            </div>
          ))}

          {isTyping &&
            (isGroup ? (
              <div className={styles.typingIndicatorWrapper}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            ) : (
              <div className={styles.typingIndicatorWrapper}>
                <div className={styles.typingAvatar}>
                  {participant?.photo_profil ? (
                    <img
                      src={participant.photo_profil}
                      alt={`${participant.prenom} ${participant.nom}`}
                    />
                  ) : (
                    <div className={styles.typingAvatarPlaceholder}>
                      {getInitials(participant?.nom, participant?.prenom)}
                    </div>
                  )}
                </div>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            ))}

          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};

export default MessageList;
