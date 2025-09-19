import React, { useState } from 'react';
import styles from './Likes.module.css';

export default function LikesFilters({ value, onChange, onReset }) {
  const [local, setLocal] = useState(value);

  const apply = () => onChange(local);
  const change = (k, v) => setLocal(prev => ({ ...prev, [k]: v }));

  return (
    <div className={styles.filters}>
      <input
        className={styles.input}
        placeholder="Recherche (type/action)…"
        value={local.search}
        onChange={e => change('search', e.target.value)}
      />

      <select className={styles.select} value={local.type} onChange={e => change('type', e.target.value)}>
        <option value="all">Tous types</option>
        <option value="VIDEO">Vidéos</option>
        <option value="POST">Posts</option>
        <option value="COMMENT">Commentaires</option>
      </select>

      <select className={styles.select} value={local.action} onChange={e => change('action', e.target.value)}>
        <option value="all">Like & Dislike</option>
        <option value="LIKE">Like</option>
        <option value="DISLIKE">Dislike</option>
      </select>

      <input
        className={styles.input}
        type="date"
        value={local.dateFrom}
        onChange={e => change('dateFrom', e.target.value)}
        title="Depuis"
      />
      <input
        className={styles.input}
        type="date"
        value={local.dateTo}
        onChange={e => change('dateTo', e.target.value)}
        title="Jusqu’à"
      />

      <select className={styles.select} value={local.sortBy} onChange={e => change('sortBy', e.target.value)}>
        <option value="recent">Plus récents</option>
        <option value="oldest">Plus anciens</option>
        <option value="most_active">Activité (type/cible)</option>
      </select>

      <button className={styles.btnPrimary} onClick={apply}>Appliquer</button>
      <button className={styles.btnGhost} onClick={onReset}>Réinitialiser</button>
    </div>
  );
}
