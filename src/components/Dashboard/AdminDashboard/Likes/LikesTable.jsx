import React from 'react';
import styles from './Likes.module.css';

export default function LikesTable({
  rows,
  loading,
  pagination,
  selected,
  onToggleRow,
  onToggleAll,
  onOpenDetails,
  onDelete,
  onPageChange,
  onSortChange
}) {
  const typeIcon = (t) =>
    t === 'VIDEO' ? 'fas fa-play-circle'
      : t === 'POST' ? 'fas fa-file-alt'
      : t === 'COMMENT' ? 'fas fa-comment'
      : 'fas fa-question-circle';

  const actionIcon = (a) => (a === 'LIKE' ? 'fas fa-thumbs-up' : 'fas fa-thumbs-down');

  return (
    <div className={styles.tableWrap}>
      <div className={styles.tableToolbar}>
        <div className={styles.tableTitle}>Résultats</div>
        <div className={styles.tableActions}>
          <label className={styles.sortLabel}>Tri:</label>
          <select
            className={styles.select}
            value={pagination?.sortBy || 'recent'}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="recent">Plus récents</option>
            <option value="oldest">Plus anciens</option>
            <option value="most_active">Activité (type/cible)</option>
          </select>
        </div>
      </div>

      <div className={styles.table}>
        {/* Header */}
        <div className={`${styles.tr} ${styles.th}`}>
          <div className={styles.td}>
            <input
              type="checkbox"
              checked={rows?.length > 0 && selected?.length === rows.length}
              onChange={onToggleAll}
            />
          </div>
          <div className={styles.td}>Type</div>
          <div className={styles.td}>Action</div>
          <div className={styles.td}>Cible</div>
          <div className={styles.td}>Utilisateur</div>
          <div className={styles.td}>Date</div>
          <div className={styles.td}>Actions</div>
        </div>

        {/* Body */}
        {loading ? (
          <div className={styles.loadingRow}>Chargement…</div>
        ) : !rows || rows.length === 0 ? (
          <div className={styles.emptyRow}>Aucun like trouvé</div>
        ) : (
          rows.map((r) => (
            <div key={r._id} className={styles.tr}>
              <div className={styles.td}>
                <input
                  type="checkbox"
                  checked={selected?.includes(r._id)}
                  onChange={() => onToggleRow(r._id)}
                />
              </div>

              <div className={styles.td}>
                <span className={styles.tag}>
                  <i className={typeIcon(r.type_entite)} /> {r.type_entite}
                </span>
              </div>

              <div className={styles.td}>
                <span className={r.type_action === 'LIKE' ? styles.like : styles.dislike}>
                  <i className={actionIcon(r.type_action)} /> {r.type_action}
                </span>
              </div>

              <div className={`${styles.td} ${styles.ellipsis}`}>
                {r.type_entite === 'VIDEO'
                  ? (r.target?.titre || r.entite_id)
                  : r.type_entite === 'POST'
                  ? (r.target?.contenu || r.entite_id)
                  : r.type_entite === 'COMMENT'
                  ? (r.target?.contenu || r.entite_id)
                  : r.entite_id}
              </div>

              <div className={styles.td}>
                {r.utilisateur
                  ? `${r.utilisateur.prenom || ''} ${r.utilisateur.nom || ''}`.trim() || r.utilisateur.email
                  : '-'}
              </div>

              <div className={styles.td}>
                {r.creation_date ? new Date(r.creation_date).toLocaleString() : '-'}
              </div>

              <div className={styles.td}>
                <button
                  className={styles.btnGhost}
                  onClick={() => onOpenDetails(r)}
                  title="Détails"
                  aria-label="Détails"
                >
                  <i className="fas fa-eye" />
                </button>
                <button
                  className={styles.btnDanger}
                  onClick={() => onDelete(r._id)}
                  title="Supprimer"
                  aria-label="Supprimer"
                >
                  <i className="fas fa-trash" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination?.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            ← Précédent
          </button>
          <span className={styles.pageInfo}>
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}
