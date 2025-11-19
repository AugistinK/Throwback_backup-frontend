// src/components/Dashboard/UserDashboard/Friends/EmojiPicker.jsx
import React, { useState } from 'react';
import styles from './Friends.module.css';

const EmojiPicker = ({ onEmojiSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('smileys');

  const emojiCategories = {
    smileys: {
      name: '😊 Smileys',
      emojis: [
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
        '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
        '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
        '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
        '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥'
      ]
    },
    gestures: {
      name: '👍 Gestures',
      emojis: [
        '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
        '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐',
        '🖖', '👋', '🤝', '🙏', '✍️', '💅', '🤳', '💪',
        '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠'
      ]
    },
    hearts: {
      name: '❤️ Hearts',
      emojis: [
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
        '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
        '💘', '💝', '💟', '♥️', '💌', '💋', '💑', '💏'
      ]
    },
    music: {
      name: '🎵 Music',
      emojis: [
        '🎵', '🎶', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷',
        '🎺', '🎸', '🪕', '🎻', '🪘', '🎬', '🎭', '🎪',
        '🎨', '🎰', '🎲', '🎯', '🎳', '🎮', '🎱', '🏆'
      ]
    },
    activities: {
      name: '⚽ Activities',
      emojis: [
        '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
        '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏',
        '🥅', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽'
      ]
    },
    food: {
      name: '🍕 Food',
      emojis: [
        '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒',
        '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑',
        '🥦', '🥬', '🥒', '🌶', '🌽', '🥕', '🥔', '🍠',
        '🥐', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🥞',
        '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕'
      ]
    },
    travel: {
      name: '✈️ Travel',
      emojis: [
        '🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑',
        '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵',
        '🏍', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡',
        '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅',
        '🚈', '🚂', '🚆', '✈️', '🛫', '🛬', '🚁', '🛶'
      ]
    },
    objects: {
      name: '💎 Objects',
      emojis: [
        '⌚', '📱', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲',
        '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹',
        '🎥', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙',
        '🎚', '🎛', '🧭', '⏰', '⌛', '⏳', '📡', '🔋'
      ]
    }
  };

  const handleEmojiClick = (emoji) => {
    onEmojiSelect(emoji);
    // Ne pas fermer automatiquement pour permettre plusieurs sélections
  };

  return (
    <>
      <div className={styles.emojiPickerOverlay} onClick={onClose} />
      <div className={styles.emojiPicker}>
        <div className={styles.emojiPickerHeader}>
          <h3 className={styles.emojiPickerTitle}>Pick an emoji</h3>
          <button className={styles.emojiPickerClose} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.emojiCategories}>
          {Object.entries(emojiCategories).map(([key, category]) => (
            <button
              key={key}
              className={`${styles.emojiCategoryBtn} ${activeCategory === key ? styles.active : ''}`}
              onClick={() => setActiveCategory(key)}
              title={category.name}
            >
              {category.emojis[0]}
            </button>
          ))}
        </div>

        <div className={styles.emojiGrid}>
          {emojiCategories[activeCategory].emojis.map((emoji, index) => (
            <button
              key={index}
              className={styles.emojiButton}
              onClick={() => handleEmojiClick(emoji)}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default EmojiPicker;