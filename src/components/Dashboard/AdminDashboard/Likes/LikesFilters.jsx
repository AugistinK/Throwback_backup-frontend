import React, { useEffect, useState } from 'react';
import styles from './Likes.module.css';

export default function LikesFilters({ filters, onFilterChange, totalLikes }) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  // Debounce pour la recherche
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onFilterChange({ search: searchTerm, page: 1 });
      }
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [searchTerm]);

  const reset = () => {
    setSearchTerm('');
    onFilterChange({
      page: 1,
      limit: filters.limit || 20,
      search: '',
      userId: '',
      type: 'all',
      targetId: '',
      dateFrom: '',
      dateTo: '',
      action: 'all',
      sortBy: 'recent'
    });
  };

  return (
    <div className={styles.filters}>
      <input
        className={styles.input}
        type="text"
        placeholder="Rechercher (titre vidéo, contenu post/comment, nom/email utilisateur, type/action)…"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <select
        className={styles.select}
        value={filters.type}
        onChange={(e) => onFilterChange({ type: e.target.value, page: 1 })}
      >
        <option value="all">Tous les types</option>
        <option value="video">Vidéos</option>
        <option value="post">Posts</option>
        <option value="comment">Commentaires</option>
        <option value="memory">Memories</option>
        <option value="playlist">Playlists</option>
        <option value="podcast">Podcasts</option>
      </select>

      <select
        className={styles.select}
        value={filters.action}
        onChange={(e) => onFilterChange({ action: e.target.value, page: 1 })}
      >
        <option value="all">Toutes actions</option>
        <option value="like">Likes</option>
        <option value="dislike">Dislikes</option>
      </select>

      <select
        className={styles.select}
        value={filters.sortBy}
        onChange={(e) => onFilterChange({ sortBy: e.target.value, page: 1 })}
      >
        <option value="recent">Plus récents</option>
        <option value="oldest">Plus anciens</option>
        <option value="most_active">Activité (type/cible)</option>
      </select>

      <button className={styles.btnGhost} onClick={reset}>
        <i className="fas fa-undo" /> Réinitialiser
      </button>

      <button
        className={styles.btnPrimary}
        onClick={() => onFilterChange({ page: 1 })}
        title="Actualiser la recherche"
      >
        <i className="fas fa-sync-alt" /> Actualiser
      </button>

      <div style={{ gridColumn: '1 / -1', color: '#6c757d', fontSize: 14 }}>
        <i className="fas fa-heart" /> <strong>{totalLikes || 0}</strong> résultat(s)
      </div>
    </div>
  );
}
