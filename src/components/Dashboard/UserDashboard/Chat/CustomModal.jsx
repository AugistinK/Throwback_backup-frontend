// src/components/Dashboard/UserDashboard/Chat/CustomModal.jsx
import React, { useEffect } from 'react';
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
  type = 'confirm', 
  isDanger = false
}) => {
  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  // Fermer avec la touche ESC (hook toujours appelé, mais n’ajoute le listener que si isOpen)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()} // Empêche la fermeture quand on clique dans la boîte
      >
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
            className={`${styles.confirmButton} ${
              isDanger ? styles.dangerButton : ''
            }`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
