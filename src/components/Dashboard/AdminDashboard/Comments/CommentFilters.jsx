// components/Dashboard/AdminDashboard/Comments/CommentFilters.jsx
import React, { useState, useEffect } from 'react';
import styles from './CommentFilters.module.css';

const CommentFilters = ({ filters, onFilterChange, totalComments }) => {
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Debounce pour la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onFilterChange({ search: searchTerm });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm('');
    onFilterChange({
      search: '',
      status: 'all',
      type: 'all',
      sortBy: 'recent',
      reported: 'all',
      page: 1
    });
  };

  // Compter les filtres actifs
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status !== 'all') count++;
    if (filters.type !== 'all') count++;
    if (filters.reported !== 'all') count++;
    if (filters.sortBy !== 'recent') count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={styles.filtersContainer}>
      {/* Barre de recherche et actions principales */}
      <div className={styles.mainFilters}>
        <div className={styles.searchContainer}>
          <div className={styles.searchInput}>
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Rechercher dans les commentaires..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className={styles.clearSearch}
                onClick={() => setSearchTerm('')}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>

        <div className={styles.quickFilters}>
          {/* Filtre par statut */}
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className={styles.filterSelect}
          >
            <option value="all">Tous les statuts</option>
            <option value="ACTIF">Actifs</option>
            <option value="MODERE">Modérés</option>
            <option value="SUPPRIME">Supprimés</option>
            {/* <option value="SIGNALE">Signalés</option> */}
          </select>

          {/* Filtre par type */}
        
        <select
          value={filters.type}
          onChange={(e) => onFilterChange({ type: e.target.value })}
          className={styles.filterSelect}
        >
          <option value="all">Tous les types</option>
          <option value="video">Commentaires vidéos</option>
          <option value="post">Commentaires posts</option>
          <option value="podcast">Commentaires podcasts</option> 
        </select>

          {/* Tri */}
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value })}
            className={styles.filterSelect}
          >
            <option value="recent">Plus récents</option>
            <option value="oldest">Plus anciens</option>
            <option value="most_liked">Plus aimés</option>
            {/* <option value="most_reported">Plus signalés</option> */}
          </select>
        </div>

        <div className={styles.filterActions}>
          {/* Bouton filtres avancés */}
          <button
            className={`${styles.advancedBtn} ${showAdvanced ? styles.active : ''}`}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <i className="fas fa-filter"></i>
            Filtres avancés
            {activeFiltersCount > 0 && (
              <span className={styles.filterBadge}>{activeFiltersCount}</span>
            )}
          </button>

          {/* Bouton reset */}
          {activeFiltersCount > 0 && (
            <button
              className={styles.resetBtn}
              onClick={resetFilters}
              title="Réinitialiser tous les filtres"
            >
              <i className="fas fa-undo"></i>
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Filtres avancés */}
      {showAdvanced && (
        <div className={styles.advancedFilters}>
          <div className={styles.advancedRow}>
            {/* <div className={styles.filterGroup}>
              <label>Signalements</label>
              <select
                value={filters.reported}
                onChange={(e) => onFilterChange({ reported: e.target.value })}
                className={styles.filterSelect}
              >
                <option value="all">Tous</option>
                <option value="reported">Commentaires signalés</option>
                <option value="not_reported">Non signalés</option>
              </select>
            </div> */}

            <div className={styles.filterGroup}>
              <label>Nombre par page</label>
              <select
                value={filters.limit}
                onChange={(e) => onFilterChange({ limit: parseInt(e.target.value) })}
                className={styles.filterSelect}
              >
                <option value="10">10 par page</option>
                <option value="20">20 par page</option>
                <option value="50">50 par page</option>
                <option value="100">100 par page</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Résultats et informations */}
      <div className={styles.filtersInfo}>
        <div className={styles.resultsCount}>
          <i className="fas fa-comments"></i>
          {totalComments} commentaire{totalComments > 1 ? 's' : ''} trouvé{totalComments > 1 ? 's' : ''}
          {activeFiltersCount > 0 && (
            <span className={styles.filtered}>
              (avec {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''})
            </span>
          )}
        </div>

        {/* Filtres actifs */}
        {activeFiltersCount > 0 && (
          <div className={styles.activeFilters}>
            {filters.search && (
              <span className={styles.activeFilter}>
                <i className="fas fa-search"></i>
                "{filters.search}"
                <button onClick={() => onFilterChange({ search: '' })}>
                  <i className="fas fa-times"></i>
                </button>
              </span>
            )}
            
            {filters.status !== 'all' && (
              <span className={styles.activeFilter}>
                <i className="fas fa-check-circle"></i>
                Statut: {filters.status}
                <button onClick={() => onFilterChange({ status: 'all' })}>
                  <i className="fas fa-times"></i>
                </button>
              </span>
            )}
            
            {filters.type !== 'all' && (
              <span className={styles.activeFilter}>
                <i className="fas fa-tag"></i>
                Type: {filters.type}
                <button onClick={() => onFilterChange({ type: 'all' })}>
                  <i className="fas fa-times"></i>
                </button>
              </span>
            )}
            
            {/* {filters.reported !== 'all' && (
              <span className={styles.activeFilter}>
                <i className="fas fa-flag"></i>
                {filters.reported === 'reported' ? 'Signalés' : 'Non signalés'}
                <button onClick={() => onFilterChange({ reported: 'all' })}>
                  <i className="fas fa-times"></i>
                </button>
              </span>
            )} */}
            
            {filters.sortBy !== 'recent' && (
              <span className={styles.activeFilter}>
                <i className="fas fa-sort"></i>
                Tri: {filters.sortBy}
                <button onClick={() => onFilterChange({ sortBy: 'recent' })}>
                  <i className="fas fa-times"></i>
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Suggestions de filtres rapides */}
      <div className={styles.quickSuggestions}>
        <span className={styles.suggestionsLabel}>Filtres rapides :</span>
        {/* <button
          className={styles.suggestionBtn}
          onClick={() => onFilterChange({ status: 'SIGNALE', reported: 'reported' })}
        >
          <i className="fas fa-flag"></i>
          Commentaires signalés
        </button> */}
        <button
          className={styles.suggestionBtn}
          onClick={() => onFilterChange({ status: 'MODERE' })}
        >
          <i className="fas fa-eye-slash"></i>
          En attente de modération
        </button>
        <button
          className={styles.suggestionBtn}
          onClick={() => onFilterChange({ sortBy: 'most_liked', status: 'ACTIF' })}
        >
          <i className="fas fa-thumbs-up"></i>
          Plus populaires
        </button>
        <button
          className={styles.suggestionBtn}
          onClick={() => onFilterChange({ type: 'video', sortBy: 'recent' })}
        >
          <i className="fas fa-video"></i>
          Commentaires vidéos récents
        </button>
      </div>
    </div>
  );
};

export default CommentFilters;