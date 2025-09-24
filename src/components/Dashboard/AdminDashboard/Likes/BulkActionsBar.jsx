import React from 'react';
import styles from './Likes.module.css';

export default function BulkActionsBar({ count, onCancel, onDelete }) {
  return (
    <div className={styles.bulkBar}>
      <div className={styles.bulkInfo}>
        <i className="fas fa-check-square" /> {count} élément(s) sélectionné(s)
      </div>
      <div className={styles.bulkActions}>
        <button className={styles.btnDanger} onClick={onDelete}>
          <i className="fas fa-trash" /> Supprimer en masse
        </button>
        <button className={styles.btnGhost} onClick={onCancel}>
          Annuler
        </button>
      </div>
    </div>
  );
}
