import React from 'react';
import styles from './Likes.module.css';

export default function LikeDetailsModal({ open, data, onClose }) {
  if (!open) return null;
  const like = data?.like || data;
  const entity = data?.entity;

  const title =
    like?.type_entite === 'VIDEO' ? (entity?.titre || 'Vidéo') :
    like?.type_entite === 'POST' ? (entity?.contenu?.slice(0, 60) || 'Post') :
    like?.type_entite === 'COMMENT' ? (entity?.contenu?.slice(0, 60) || 'Commentaire') : 'Entité';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Détail interaction</h3>
          <button className={styles.close} onClick={onClose} aria-label="Fermer">×</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.detailRow}><span className={styles.detailKey}>Type</span><span className={styles.detailVal}>{like?.type_entite}</span></div>
          <div className={styles.detailRow}><span className={styles.detailKey}>Action</span><span className={styles.detailVal}>{like?.type_action}</span></div>
          <div className={styles.detailRow}><span className={styles.detailKey}>Cible</span><span className={styles.detailVal}>{title}</span></div>
          <div className={styles.detailRow}><span className={styles.detailKey}>Utilisateur</span><span className={styles.detailVal}>{like?.utilisateur ? `${like.utilisateur.prenom || ''} ${like.utilisateur.nom || ''}`.trim() : '-'}</span></div>
          <div className={styles.detailRow}><span className={styles.detailKey}>Date</span><span className={styles.detailVal}>{new Date(like?.creation_date).toLocaleString()}</span></div>

          {entity && like?.type_entite !== 'VIDEO' && (
            <div className={styles.detailBlock}>
              <div className={styles.detailTitle}>Extrait du contenu</div>
              <p className={styles.entityExcerpt}>{entity?.contenu || ''}</p>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnPrimary} onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
