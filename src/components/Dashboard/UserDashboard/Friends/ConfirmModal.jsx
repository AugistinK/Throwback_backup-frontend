// src/components/Dashboard/UserDashboard/Friends/ConfirmModal.jsx
import React from 'react';
import styles from './Friends.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faCheckCircle,
  faExclamationTriangle,
  faInfoCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'info',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showCancel = true
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: 48, color: '#10b981' }} />;
      case 'warning':
        return <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: 48, color: '#f59e0b' }} />;
      case 'error':
        return <FontAwesomeIcon icon={faTimesCircle} style={{ fontSize: 48, color: '#ef4444' }} />;
      default:
        return <FontAwesomeIcon icon={faInfoCircle} style={{ fontSize: 48, color: '#3b82f6' }} />;
    }
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <FontAwesomeIcon icon={faXmark} style={{ fontSize: 24 }} />
        </button>

        <div className={styles.confirmModalContent}>
          <div className={styles.confirmModalIcon}>
            {getIcon()}
          </div>
          
          <h2 className={styles.confirmModalTitle}>{title}</h2>
          <p className={styles.confirmModalMessage}>{message}</p>
          
          <div className={styles.confirmModalActions}>
            {showCancel && (
              <button 
                className={styles.confirmModalButtonCancel}
                onClick={onClose}
              >
                {cancelText}
              </button>
            )}
            <button 
              className={styles.confirmModalButtonConfirm}
              onClick={handleConfirm}
              style={{
                backgroundColor: type === 'error' || type === 'warning' ? '#ef4444' : '#b31217'
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;