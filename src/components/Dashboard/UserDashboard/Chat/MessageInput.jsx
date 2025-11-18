// src/components/Dashboard/UserDashboard/Chat/MessageInput.jsx
import React, { useState, useRef } from 'react';
import { useSocket } from '../../../../contexts/SocketContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSmile } from '@fortawesome/free-solid-svg-icons';
import styles from './Chat.module.css';

const MessageInput = ({ onSendMessage, receiverId }) => {
  const { startTyping, stopTyping, isConnected } = useSocket();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const emojis = [
    '😊', '😂', '❤️', '👍', '🎵', '🎶', '🔥', '✨', '🎉', '💯',
    '😍', '🥰', '😎', '🤗', '🎸', '🎤', '🎧', '🎹', '🥁', '🎺'
  ];

  const handleInputChange = (e) => {
    setMessage(e.target.value);

    if (isConnected && receiverId) {
      startTyping(receiverId);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(receiverId);
      }, 2000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (message.trim()) {
      onSendMessage(message, 'text');
      setMessage('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEmojiClick = (emoji) => {
    setMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  return (
    <div className={styles.messageInput}>
      <form className={styles.inputForm} onSubmit={handleSubmit}>
        <div className={styles.inputActions}>
          {/* Emoji button */}
          <button
            type="button"
            className={styles.inputActionButton}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Add emoji"
          >
            <FontAwesomeIcon icon={faSmile} />
          </button>

          {/* Emoji picker */}
          {showEmojiPicker && (
            <>
              <div
                className={styles.menuOverlay}
                onClick={() => setShowEmojiPicker(false)}
              />
              <div className={styles.emojiPicker}>
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    className={styles.emojiButton}
                    onClick={() => handleEmojiClick(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
          className={styles.textInput}
          disabled={!isConnected}
        />

        <button
          type="submit"
          className={styles.sendButton}
          disabled={!isConnected || !message.trim()}
          title="Send"
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>

      {!isConnected && (
        <div className={styles.connectionWarning}>
          ⚠️ Connecting to chat server...
        </div>
      )}
    </div>
  );
};

export default MessageInput;