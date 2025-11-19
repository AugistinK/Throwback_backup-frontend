// src/components/Dashboard/UserDashboard/Friends/GroupChatHeader.jsx
import React, { useState } from 'react';
import styles from './Chat.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faEllipsisVertical,
  faUsers,
  faTrash
} from '@fortawesome/free-solid-svg-icons';

const GroupChatHeader = ({
  groupName,
  memberCount,
  color,
  isCreator,
  onViewMembers,
  onDeleteGroup,
  onClose
}) => {
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const toggleMenu = () => setShowOptionsMenu((prev) => !prev);

  return (
    <div className={styles.chatHeader}>
      <div className={styles.chatHeaderLeft}>
        <div
          className={styles.chatAvatar}
          style={{ backgroundColor: color || '#b31217' }}
        >
          <FontAwesomeIcon
            icon={faUsers}
            style={{ fontSize: 24, color: 'white' }}
          />
        </div>
        <div className={styles.chatHeaderInfo}>
          <h3 className={styles.chatName}>{groupName}</h3>
          <p className={styles.chatStatus}>{memberCount} members</p>
        </div>
      </div>

      <div className={styles.chatHeaderActions}>
        <div className={styles.optionsMenuWrapper}>
          <button
            className={styles.chatActionButton}
            title="More options"
            onClick={toggleMenu}
          >
            <FontAwesomeIcon
              icon={faEllipsisVertical}
              style={{ fontSize: 20 }}
            />
          </button>

          {showOptionsMenu && (
            <>
              <div
                className={styles.menuOverlay}
                onClick={() => setShowOptionsMenu(false)}
              />
              <div className={styles.chatOptionsMenu}>
                <button
                  className={styles.chatOptionItem}
                  onClick={() => {
                    setShowOptionsMenu(false);
                    onViewMembers && onViewMembers();
                  }}
                >
                  <FontAwesomeIcon icon={faUsers} style={{ fontSize: 16 }} />
                  View Members
                </button>

                {isCreator && (
                  <>
                    <div className={styles.dropdownDivider} />
                    <button
                      className={`${styles.chatOptionItem} ${styles.dangerItem}`}
                      onClick={() => {
                        setShowOptionsMenu(false);
                        onDeleteGroup && onDeleteGroup();
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faTrash}
                        style={{ fontSize: 16 }}
                      />
                      Delete Group
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <button className={styles.closeButton} onClick={onClose}>
          <FontAwesomeIcon icon={faXmark} style={{ fontSize: 24 }} />
        </button>
      </div>
    </div>
  );
};

export default GroupChatHeader;
