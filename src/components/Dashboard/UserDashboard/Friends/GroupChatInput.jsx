// src/components/Dashboard/UserDashboard/Friends/GroupChatInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import styles from './Friends.module.css';
import EmojiPicker from './EmojiPicker';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSmile } from '@fortawesome/free-solid-svg-icons';

const GroupChatInput = ({ onSend, isConnected, conversationReady }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (!conversationReady) {
      // on laisse juste un garde-fou côté UX, mais on ne bloque pas la saisie
      return;
    }

    onSend && onSend(message.trim());
    setMessage('');
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const placeholder = !isConnected
    ? 'Connecting...'
    : !conversationReady
    ? 'Preparing group chat...'
    : 'Type a message...';

  const disableSend =
    !message.trim() || !isConnected || !conversationReady;

  return (
    <>
      <form className={styles.chatInput} onSubmit={handleSubmit}>
        <div className={styles.chatInputActions}>
          <button
            type="button"
            className={styles.chatInputButton}
            title="Add emoji"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            disabled={!isConnected}
          >
            <FontAwesomeIcon icon={faSmile} style={{ fontSize: 20 }} />
          </button>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className={styles.chatInputField}
          disabled={!isConnected}
        />

        <button
          type="submit"
          className={styles.sendButton}
          disabled={disableSend}
        >
          <FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: 20 }} />
        </button>
      </form>

      {showEmojiPicker && (
        <EmojiPicker
          onEmojiSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
    </>
  );
};

export default GroupChatInput;
