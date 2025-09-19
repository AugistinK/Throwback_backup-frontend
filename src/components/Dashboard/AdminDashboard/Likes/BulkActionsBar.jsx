import React from 'react';
import styles from './Likes.module.css';

export default function BulkActionsBar({ hasSelection, count, onBulkDelete }) {
  return (
    <div className={styles.bulkBar}>
      <div className={styles.bulkInfo}>
        {hasSelection ? <span>{count} sélectionné(s)</span> : <span>Aucune sélection</span>}
      </div>
      <div className={styles.bulkActions}>
        <button className={styles.btnDanger} disabled={!hasSelection} onClick={onBulkDelete}>
          Supprimer la sélection
        </button>
      </div>
    </div>
  );
}
