import React from 'react';
import styles from './VideoFilters.module.css';

const VideoFilters = ({ onFilterChange, activeFilters, videoCount = 0 }) => {
  const genres = [
    'All genres',
    'Afrobeat', 'Afropop', 'Afro-fusion', 'Highlife', 'Hiplife', 'Mbalax', 'Soukous', 'Kizomba', 'Gqom', 'Amapiano',
    'Kwaito', 'Juju', 'Makossa', 'Coupé-Décalé', 'Rai', 'Gnawa', 'Palm-Wine', 'Taarab', 'Afro-House', 'Latin Pop',
    'Reggaeton', 'Salsa', 'Merengue', 'Bachata', 'Cumbia', 'Bossa Nova', 'Samba', 'MPB', 'Forró', 'Zouk',
    'Soca', 'Calypso', 'Tango', 'Mariachi', 'Ranchera', 'Bolero', 'Timba', 'Vallenato', 'Chicha', 'Pop',
    'Rock', 'Alternative', 'Indie', 'Country', 'Folk', 'Blues', 'Jazz', 'R&B', 'Soul', 'Funk',
    'Disco', 'Hip-Hop', 'Rap', 'Gospel', 'Electronic', 'Dance', 'House', 'Techno', 'Trance', 'Drum & Bass',
    'Dubstep', 'EDM', 'Ambient', 'Chillout', 'Trip Hop', 'Electro', 'Synthpop', 'Worldbeat', 'Ethno-Electronic', 'Flamenco',
    'Fado', 'Chanson', 'French Pop', 'French Rock', 'Rap Français', 'French Electro', 'French House', 'Celtic', 'Balkan Folk', 'Gypsy/Roma',
    'Klezmer', 'Rebetiko', 'Schlager', 'Nordic Folk', 'Indian Classical', 'Bollywood', 'Filmi', 'Bhangra', 'Ghazal', 'J-Pop',
    'J-Rock', 'K-Pop', 'C-Pop', 'Mandopop', 'Cantopop', 'T-Pop', 'City Pop', 'Dangdut', 'OPM', 'Enka',
    'Arabic Pop', 'Khaliji', 'Dabke', 'Persian Classical', 'Qawwali', 'Turkish Pop', 'Arabesque', 'Andalusian Music', 'Aboriginal Music', 'Hawaiian',
    'Polynesian', 'Australian Country', 'Australian Folk', 'World', 'Fusion', 'Reggae', 'Ska', 'Afro-Latin', 'Latin Jazz', 'Ethno-Jazz',
    'Afro-Jazz', 'Cross-Cultural Pop', 'Classical', 'Opera', 'Chamber', 'Choral', 'Contemporary Classical', 'Traditional Folk', 'Metal', 'Heavy Metal',
    'Punk', 'Alternative Metal', 'Hard Rock', 'Post-Punk', 'Soundtrack', 'Film Score', 'Musicals', 'Anime Music', 'Game Music', 'TV Themes',
    'Experimental', 'Spoken Word', 'Champeta', 'Other'
  ];
  
  const decades = ['All decades', '60s', '70s', '80s', '90s', '2000s', '2010s'];

  // Tri réduit : "All" (ordre récent) et "Most popular"
  const sortOptions = ['All', 'Most popular'];

  // Normalisation des valeurs envoyées au parent (et au backend)
  const handleSelectChange = (e, filterType) => {
    const value = e.target.value;
    const next = { ...activeFilters };

    if (filterType === 'genre') {
      next.genre = value === 'All genres' ? 'all' : value;
    } else if (filterType === 'decade') {
      next.decade = value === 'All decades' ? 'all' : value;
    } else if (filterType === 'sortBy') {
      // "All" = ordre récent par défaut
      next.sortBy = value;
    }
    onFilterChange(next);
  };

  const currentValue = (filterType) => {
    if (filterType === 'genre') return activeFilters.genre === 'all' ? 'All genres' : activeFilters.genre;
    if (filterType === 'decade') return activeFilters.decade === 'all' ? 'All decades' : activeFilters.decade;
    if (filterType === 'sortBy') return activeFilters.sortBy || 'All';
    return '';
  };

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filtersContent}>
        <div className={styles.filterGroup}>
          <label htmlFor="genre-select" className={styles.filterLabel}>Genre:</label>
          <div className={styles.selectWrapper}>
            <select
              id="genre-select"
              className={styles.filterSelect}
              value={currentValue('genre')}
              onChange={(e) => handleSelectChange(e, 'genre')}
            >
              {genres.map((g) => <option key={`genre-${g}`} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="decade-select" className={styles.filterLabel}>Decade:</label>
          <div className={styles.selectWrapper}>
            <select
              id="decade-select"
              className={styles.filterSelect}
              value={currentValue('decade')}
              onChange={(e) => handleSelectChange(e, 'decade')}
            >
              {decades.map((d) => <option key={`decade-${d}`} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="sort-select" className={styles.filterLabel}>Sort by:</label>
          <div className={styles.selectWrapper}>
            <select
              id="sort-select"
              className={styles.filterSelect}
              value={currentValue('sortBy')}
              onChange={(e) => handleSelectChange(e, 'sortBy')}
            >
              {sortOptions.map((o) => <option key={`sort-${o}`} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.videoCount}>
          <span>{videoCount} videos found</span>
        </div>
      </div>
    </div>
  );
};

export default VideoFilters;