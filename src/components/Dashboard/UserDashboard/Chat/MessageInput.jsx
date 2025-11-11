// src/components/Dashboard/UserDashboard/Chat/MessageInput.jsx
import React, { useState, useRef } from 'react';
import { useSocket } from '../../../../contexts/SocketContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperPlane,
  faImage,
  faMusic,
  faVideo,
  faMicrophone,
  faSmile,
  faPaperclip,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import styles from './Chat.module.css';

const MessageInput = ({ onSendMessage, receiverId }) => {
  const { startTyping, stopTyping, isConnected } = useSocket();
  const [message, setMessage] = useState('');
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const emojis = ['😊', '😂', '❤️', '👍', '🎵', '🎶', '🔥', '✨', '🎉', '💯', 
                  '😍', '🥰', '😎', '🤗', '🎸', '🎤', '🎧', '🎹', '🥁', '🎺'];

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
    
    if (message.trim() || selectedFile) {
      if (selectedFile) {
        // TODO: Upload file and send
        console.log('Sending file:', selectedFile);
      } else {
        onSendMessage(message, 'text');
      }
      
      setMessage('');
      setSelectedFile(null);
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
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setShowMediaMenu(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording
    console.log('Voice recording:', !isRecording);
  };

  return (
    <div className={styles.messageInput}>
      {selectedFile && (
        <div className={styles.filePreview}>
          <div className={styles.filePreviewContent}>
            <FontAwesomeIcon icon={faImage} />
            <span>{selectedFile.name}</span>
            <button 
              className={styles.removeFileButton}
              onClick={removeSelectedFile}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>
      )}

      <form className={styles.inputForm} onSubmit={handleSubmit}>
        <div className={styles.inputActions}>
          {/* Bouton Emoji */}
          <button 
            type="button"
            className={styles.inputActionButton}
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowMediaMenu(false);
            }}
            title="Ajouter un emoji"
          >
            <FontAwesomeIcon icon={faSmile} />
          </button>

          {/* Bouton Médias */}
          <button 
            type="button"
            className={styles.inputActionButton}
            onClick={() => {
              setShowMediaMenu(!showMediaMenu);
              setShowEmojiPicker(false);
            }}
            title="Attacher un fichier"
          >
            <FontAwesomeIcon icon={faPaperclip} />
          </button>

          {/* Menu Médias */}
          {showMediaMenu && (
            <>
              <div 
                className={styles.menuOverlay} 
                onClick={() => setShowMediaMenu(false)}
              />
              <div className={styles.mediaMenu}>
                <button 
                  className={styles.mediaMenuItem}
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                >
                  <FontAwesomeIcon icon={faImage} />
                  <span>Image</span>
                </button>
                <button className={styles.mediaMenuItem}>
                  <FontAwesomeIcon icon={faVideo} />
                  <span>Vidéo</span>
                </button>
                <button className={styles.mediaMenuItem}>
                  <FontAwesomeIcon icon={faMusic} />
                  <span>Musique</span>
                </button>
                <input 
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>
            </>
          )}

          {/* Picker Emoji */}
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
          placeholder={isConnected ? "Écrivez un message..." : "Connexion..."}
          className={styles.textInput}
          disabled={!isConnected}
        />

        {message.trim() || selectedFile ? (
          <button 
            type="submit"
            className={styles.sendButton}
            disabled={!isConnected}
            title="Envoyer"
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        ) : (
          <button 
            type="button"
            className={`${styles.sendButton} ${isRecording ? styles.recording : ''}`}
            onClick={handleVoiceRecord}
            title={isRecording ? "Arrêter l'enregistrement" : "Message vocal"}
          >
            <FontAwesomeIcon icon={faMicrophone} />
          </button>
        )}
      </form>

      {!isConnected && (
        <div className={styles.connectionWarning}>
          ⚠️ Connexion au serveur de chat...
        </div>
      )}
    </div>
  );
};

export default MessageInput;