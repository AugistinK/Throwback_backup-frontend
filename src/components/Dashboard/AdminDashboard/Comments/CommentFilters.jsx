// components/Dashboard/AdminDashboard/Comments/CommentFilters.jsx
import React, { useState, useEffect } from 'react';
import styles from './CommentFilters.module.css';

const CommentFilters = ({ filters, onFilterChange, totalComments }) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== (filters.search || '')) {
        onFilterChange({ search: searchTerm });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]); // eslint-disable-line

  return (
    <div className={styles.wrapper}>
      <div className={styles.topRow}>
        <div className={styles.searchBox}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher dans les commentaires…"
          />
        </div>

        <select
          value={filters.status || 'all'}
          onChange={(e) => onFilterChange({ status: e.target.value })}
          className={styles.filterSelect}
        >
          <option value="all">Tous les statuts</option>
          <option value="ACTIF">Actifs</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="SUPPRIME">Supprimés</option>
        </select>

        <select
          value={filters.type || 'all'}
          onChange={(e) => onFilterChange({ type: e.target.value })}
          className={styles.filterSelect}
        >
          <option value="all">Tous les types</option>
          <option value="video">Commentaires vidéos</option>
          <option value="post">Commentaires posts</option>
          <option value="podcast">Commentaires podcasts</option>
        </select>

        <select
          value={filters.sortBy || 'recent'}
          onChange={(e) => onFilterChange({ sortBy: e.target.value })}
          className={styles.filterSelect}
        >
          <option value="recent">Plus récents</option>
          <option value="oldest">Plus anciens</option>
          <option value="most_liked">Plus populaires</option>
          <option value="most_reported">Plus signalés</option>
        </select>

        <button className={styles.advancedBtn} onClick={() => setShowAdvanced(v => !v)}>
          <i className="fas fa-filter"></i> Filtres avancés
          {filters.__hasAdvanced ? <span className={styles.advancedDot}></span> : null}
        </button>

        <button
          className={styles.resetBtn}
          onClick={() =>
            onFilterChange({
              search: '',
              status: 'all',
              type: 'all',
              sortBy: 'recent',
              __hasAdvanced: false
            })
          }
        >
          <i className="fas fa-undo"></i> Reset
        </button>
      </div>

      {showAdvanced && (
        <div className={styles.advancedPanel}>
          <div className={styles.advancedGroup}>
            <label>Min likes</label>
            <input
              type="number"
              min="0"
              value={filters.minLikes || ''}
              onChange={(e) =>
                onFilterChange({ minLikes: e.target.value ? Number(e.target.value) : undefined, __hasAdvanced: true })
              }
            />
          </div>
          <div className={styles.advancedGroup}>
            <label>Min signalements</label>
            <input
              type="number"
              min="0"
              value={filters.minReports || ''}
              onChange={(e) =>
                onFilterChange({ minReports: e.target.value ? Number(e.target.value) : undefined, __hasAdvanced: true })
              }
            />
          </div>
        </div>
      )}

      <div className={styles.quickFilters}>
        <span>Filtres rapides :</span>
        <button
          className={styles.suggestionBtn}
          onClick={() => onFilterChange({ status: 'EN_ATTENTE' })}
        >
          <i className="fas fa-hourglass-half"></i>
          En attente de modération
        </button>
        <button
          className={styles.suggestionBtn}
          onClick={() => onFilterChange({ sortBy: 'most_liked' })}
        >
          <i className="fas fa-fire-alt"></i>
          Plus populaires
        </button>
        <button
          className={styles.suggestionBtn}
          onClick={() => onFilterChange({ type: 'video', sortBy: 'recent' })}
        >
          <i className="fas fa-video"></i>
          Commentaires vidéos récents
        </button>
        <button
          className={styles.suggestionBtn}
          onClick={() => onFilterChange({ type: 'podcast', sortBy: 'recent' })}
        >
          <i className="fas fa-podcast"></i>
          Commentaires podcasts récents
        </button>
      </div>
    </div>
  );
};

export default CommentFilters;
