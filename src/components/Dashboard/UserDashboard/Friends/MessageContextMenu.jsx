// src/components/Dashboard/UserDashboard/Friends/MessageContextMenu.jsx
import React, { useState, useRef, useEffect } from 'react';
import styles from './Friends.module.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCopy,
  faPen,
  faTrash,
  faEllipsisVertical
} from '@fortawesome/free-solid-svg-icons';

const MessageContextMenu = ({
  message,
  isOwnMessage,
  onEdit,
  onCopy,
  onDelete
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleMenuClick = (action) => {
    setShowMenu(false);
    if (action) action();
  };

  const toggleMenu = (e) => {
    e.stopPropagation();

    if (!showMenu && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: buttonRect.bottom + 5,
        left: isOwnMessage ? buttonRect.left - 150 : buttonRect.right
      });
    }

    setShowMenu(!showMenu);
  };

  return (
    <div className={styles.messageActions}>
      <button
        ref={buttonRef}
        className={styles.messageActionButton}
        onClick={toggleMenu}
        title="Message options"
      >
        <FontAwesomeIcon icon={faEllipsisVertical} style={{ fontSize: 14 }} />
      </button>

      {showMenu && (
        <div
          ref={menuRef}
          className={styles.messageContextMenu}
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            zIndex: 9999
          }}
        >
          {isOwnMessage && (
            <button
              className={styles.contextMenuItem}
              onClick={() => handleMenuClick(() => onEdit && onEdit(message))}
            >
              <FontAwesomeIcon icon={faPen} style={{ fontSize: 14 }} />
              Edit
            </button>
          )}

          <button
            className={styles.contextMenuItem}
            onClick={() => handleMenuClick(() => onCopy && onCopy(message))}
          >
            <FontAwesomeIcon icon={faCopy} style={{ fontSize: 14 }} />
            Copy
          </button>

          <div className={styles.contextMenuDivider} />

          <button
            className={`${styles.contextMenuItem} ${styles.dangerItem}`}
            onClick={() =>
              handleMenuClick(() => onDelete && onDelete(message, isOwnMessage))
            }
          >
            <FontAwesomeIcon icon={faTrash} style={{ fontSize: 14 }} />
            {isOwnMessage ? 'Delete for everyone' : 'Delete for me'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageContextMenu;
