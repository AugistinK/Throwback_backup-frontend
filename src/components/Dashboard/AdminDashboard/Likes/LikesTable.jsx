import React from 'react';
import styles from './Likes.module.css';

export default function LikesTable({
  rows, loading, pagination, selected,
  onToggleRow, onToggleAll, onOpenDetails, onDelete, onPageChange, onSortChange
}) {
  return (
    <div className={styles.tableWrap}>
      <div className={styles.tableToolbar}>
        <div className={styles.tableTitle}>Résultats</div>
        <div className={styles.tableActions}>
          <label className={styles.sortLabel}>Tri:</label>
          <select className={styles.select} onChange={e => onSortChange(e.target.value)}>
            <option value="recent">Plus récents</option>
            <option value="oldest">Plus anciens</option>
            <option value="most_active">Activité (type/cible)</option>
          </select>
        </div>
      </div>

      <div className={styles.table}>
        <div className={`${styles.tr} ${styles.th}`}>
          <div className={styles.td}><input type="checkbox" checked={rows.length && selected.length === rows.length} onChange={onToggleAll} /></div>
          <div className={styles.td}>Type</div>
          <div className={styles.td}>Action</div>
          <div className={styles.td}>Cible</div>
          <div className={styles.td}>Utilisateur</div>
          <div className={styles.td}>Date</div>
          <div className={styles.td}>Actions</div>
        </div>

        {loading ? (
          <div className={styles.loading}>Chargement…</div>
        ) : rows.length === 0 ? (
          <div className={styles.empty}>Aucun résultat</div>
        ) : rows.map(r => (
          <div key={r._id} className={styles.tr}>
            <div className={styles.td}><input type="checkbox" checked={selected.includes(r._id)} onChange={() => onToggleRow(r._id)} /></div>
            <div className={styles.td}><span className={styles.tag}>{r.type_entite}</span></div>
            <div className={styles.td}><span className={r.type_action === 'LIKE' ? styles.like : styles.dislike}>{r.type_action}</span></div>
            <div className={`${styles.td} ${styles.ellipsis}`}>
              {r.type_entite === 'VIDEO' ? (r.target?.titre || r.entite_id) :
               r.type_entite === 'POST' ? (r.target?.contenu || r.entite_id) :
               r.type_entite === 'COMMENT' ? (r.target?.contenu || r.entite_id) : r.entite_id}
            </div>
            <div className={styles.td}>
              {r.utilisateur ? `${r.utilisateur.prenom || ''} ${r.utilisateur.nom || ''}`.trim() : '-'}
            </div>
            <div className={styles.td}>{new Date(r.creation_date).toLocaleString()}</div>
            <div className={styles.td}>
              <button className={styles.btnGhost} onClick={() => onOpenDetails(r)}>Détails</button>
              <button className={styles.btnDanger} onClick={() => onDelete(r._id)}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.pagination}>
        <button className={styles.btnGhost} disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>Préc.</button>
        <span>Page {pagination.page} / {Math.max(1, pagination.totalPages || 1)}</span>
        <button className={styles.btnGhost} disabled={pagination.page >= (pagination.totalPages || 1)} onClick={() => onPageChange(pagination.page + 1)}>Suiv.</button>
      </div>
    </div>
  );
}
