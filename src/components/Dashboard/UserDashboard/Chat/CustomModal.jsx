// src/components/Dashboard/UserDashboard/Chat/CustomModal.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import styles from './CustomModal.module.css';

const CustomModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  onConfirm, 
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'confirm', // 'confirm', 'alert', 'info'
  isDanger = false
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose} />
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <p className={styles.modalMessage}>{message}</p>
        </div>
        
        <div className={styles.modalFooter}>
          {type !== 'alert' && (
            <button 
              className={styles.cancelButton} 
              onClick={onClose}
            >
              {cancelText}
            </button>
          )}
          <button 
            className={`${styles.confirmButton} ${isDanger ? styles.dangerButton : ''}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </>
  );
};

export default CustomModal;