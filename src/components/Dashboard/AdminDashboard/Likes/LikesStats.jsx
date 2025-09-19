import React, { useMemo } from 'react';
import styles from './Likes.module.css';

/**
 * Petits graphes en SVG (sans dépendance) :
 * - courbe 7 jours
 * - barres 30 jours
 */
function LineChart({ data = [] }) {
  const w = 460, h = 120, p = 24;
  const max = Math.max(1, ...data.map(d => d.count));
  const points = data.map((d, i) => {
    const x = p + (i * (w - 2 * p)) / Math.max(1, data.length - 1);
    const y = h - p - (d.count * (h - 2 * p)) / max;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} className={styles.chart}>
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />
      <line x1={p} y1={h - p} x2={w - p} y2={h - p} stroke="currentColor" opacity="0.2" />
    </svg>
  );
}

function Bars({ data = [] }) {
  const w = 460, h = 120, p = 24;
  const max = Math.max(1, ...data.map(d => d.count));
  const bw = (w - 2 * p) / (data.length || 1);
  return (
    <svg width={w} height={h} className={styles.chart}>
      {data.map((d, i) => {
        const x = p + i * bw;
        const bh = (d.count * (h - 2 * p)) / max;
        const y = h - p - bh;
        return <rect key={i} x={x + 2} y={y} width={Math.max(1, bw - 4)} height={bh} fill="currentColor" opacity="0.8" />;
      })}
      <line x1={p} y1={h - p} x2={w - p} y2={h - p} stroke="currentColor" opacity="0.2" />
    </svg>
  );
}

export default function LikesStats({ stats, loading }) {
  const s = stats || {};
  const last7 = s.last7Days || [];
  const last30 = s.last30Days || [];

  const total = s.total?.[0]?.total || 0;
  const byType = s.byType || [];

  const topContent = useMemo(() =>
    (s.topLikedContent || []).map(t => ({
      count: t.count,
      label: t._id?.type === 'VIDEO'
        ? (t.entity?.titre || `Vidéo ${t._id?.id}`)
        : t._id?.type === 'POST'
          ? (t.entity?.contenu?.slice(0, 28) || `Post ${t._id?.id}`)
          : (t.entity?.contenu?.slice(0, 28) || `Comment ${t._id?.id}`)
    })), [s]);

  const topUsers = (s.topLikers || []).map(u => ({
    count: u.count,
    label: u.user ? `${u.user.prenom || ''} ${u.user.nom || ''}`.trim() : u._id
  }));

  return (
    <div className={styles.statsGrid}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3>Interventions (7 jours)</h3>
          <span className={styles.badge}>{last7.reduce((a, b) => a + b.count, 0)}</span>
        </div>
        <LineChart data={last7} />
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3>Interventions (30 jours)</h3>
          <span className={styles.badge}>{last30.reduce((a, b) => a + b.count, 0)}</span>
        </div>
        <Bars data={last30} />
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}><h3>Répartition par type</h3><span className={styles.badge}>{total}</span></div>
        <div className={styles.pills}>
          {byType.map(t => <span key={t._id} className={styles.pill}>{t._id}: <b>{t.count}</b></span>)}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}><h3>Top contenus likés</h3></div>
        <ul className={styles.topList}>
          {topContent.slice(0, 6).map((t, i) => (
            <li key={i}><span className={styles.rank}>#{i + 1}</span> {t.label} <b className={styles.count}>{t.count}</b></li>
          ))}
        </ul>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}><h3>Top likers</h3></div>
        <ul className={styles.topList}>
          {topUsers.slice(0, 6).map((t, i) => (
            <li key={i}><span className={styles.rank}>#{i + 1}</span> {t.label} <b className={styles.count}>{t.count}</b></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
