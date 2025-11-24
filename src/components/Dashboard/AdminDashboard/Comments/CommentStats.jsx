// components/Dashboard/AdminDashboard/Comments/CommentStats.jsx
import React, { useState } from 'react';
import styles from './CommentStats.module.css';

const toAbsoluteUrl = (url) => {
  if (!url) return '/images/default-avatar.jpg';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;

  const base = process.env.REACT_APP_API_URL || 'https://api.throwback-connect.com';
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  return `${normalizedBase}${normalizedUrl}`;
};

const CommentStats = ({ stats }) => {
  const [showDetailed, setShowDetailed] = useState(false);

  if (!stats) return null;

  // Normalisation des données venant de l'API
  const processed = {
    total: stats.total?.[0]?.count || 0,
    byStatus: {},
    byType: {},
    reported: 0,
    notReported: 0,
    last7Days: Array.isArray(stats.last7Days)
      ? stats.last7Days
      : Array.isArray(stats.byDate)
      ? stats.byDate
      : [],
    topCommenters: Array.isArray(stats.topCommenters)
      ? stats.topCommenters
      : [],
  };

  if (Array.isArray(stats.byStatus)) {
    stats.byStatus.forEach((item) => {
      const key = item._id || 'UNKNOWN';
      processed.byStatus[key] = item.count || 0;
    });
  }

  if (Array.isArray(stats.byType)) {
    stats.byType.forEach((item) => {
      const key = item._id || 'other';
      processed.byType[key] = item.count || 0;
    });
  }

  if (Array.isArray(stats.reported)) {
    stats.reported.forEach((item) => {
      if (item._id === 1 || item._id === true) {
        processed.reported = item.count || 0;
      } else if (item._id === 0 || item._id === false) {
        processed.notReported = item.count || 0;
      }
    });
  }

  const activeCount = processed.byStatus.ACTIF || 0;
  const moderatedCount = processed.byStatus.MODERE || 0;
  const deletedCount = processed.byStatus.SUPPRIME || 0;

  const activePct =
    processed.total > 0
      ? ((activeCount / processed.total) * 100).toFixed(1)
      : '0.0';

  const reportedPct =
    processed.total > 0
      ? ((processed.reported / processed.total) * 100).toFixed(1)
      : '0.0';

  const videoCount = processed.byType.video || 0;
  const postCount = processed.byType.post || 0;
  const otherCount =
    processed.total - videoCount - postCount >= 0
      ? processed.total - videoCount - postCount
      : 0;

  const maxActivity = processed.last7Days.length
    ? Math.max(...processed.last7Days.map((d) => d.count || 0))
    : 0;

  const formatDateLabel = (dateStr) => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr || '';
    return `${d.getDate().toString().padStart(2, '0')}/${(
      d.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className={styles.statsContainer}>
      {/* Statistiques principales */}
      <div className={styles.mainStats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-comments" />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>
              {processed.total.toLocaleString()}
            </div>
            <div className={styles.statLabel}>Total comments</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-check-circle" />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>
              {activeCount.toLocaleString()}
            </div>
            <div className={styles.statLabel}>Active</div>
            <div className={styles.statPercentage}>{activePct}%</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-eye-slash" />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>
              {moderatedCount.toLocaleString()}
            </div>
            <div className={styles.statLabel}>Hidden / rejected</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-trash" />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>
              {deletedCount.toLocaleString()}
            </div>
            <div className={styles.statLabel}>Deleted</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-flag" />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>
              {processed.reported.toLocaleString()}
            </div>
            <div className={styles.statLabel}>Reported</div>
            <div className={styles.statPercentage}>{reportedPct}%</div>
          </div>
        </div>
      </div>

      {/* Bouton détail */}
      <div className={styles.statsActions}>
        <button
          className={`${styles.toggleBtn} ${
            showDetailed ? styles.active : ''
          }`}
          onClick={() => setShowDetailed((v) => !v)}
        >
          <i
            className={`fas fa-chevron-${
              showDetailed ? 'up' : 'down'
            }`}
          />
          {showDetailed ? 'Hide details' : 'Show details'}
        </button>
      </div>

      {/* Stats détaillées */}
      {showDetailed && (
        <div className={styles.detailedStats}>
          {/* Répartition par type */}
          <div className={styles.statBlock}>
            <div className={styles.blockHeader}>
              <h3>Distribution by type</h3>
            </div>
            <div className={styles.blockContent}>
              <div className={styles.typeDistribution}>
                <div className={styles.typeRow}>
                  <div className={styles.typeLabel}>
                    <i className="fas fa-video" />
                    <span>Video comments</span>
                  </div>
                  <div className={styles.typeBarWrapper}>
                    <div
                      className={styles.typeBar}
                      style={{
                        width:
                          processed.total > 0
                            ? `${(videoCount / processed.total) * 100}%`
                            : '0%',
                      }}
                    />
                  </div>
                  <div className={styles.typeValue}>
                    {videoCount.toLocaleString()}
                  </div>
                </div>

                <div className={styles.typeRow}>
                  <div className={styles.typeLabel}>
                    <i className="fas fa-file-alt" />
                    <span>Post comments</span>
                  </div>
                  <div className={styles.typeBarWrapper}>
                    <div
                      className={styles.typeBar}
                      style={{
                        width:
                          processed.total > 0
                            ? `${(postCount / processed.total) * 100}%`
                            : '0%',
                      }}
                    />
                  </div>
                  <div className={styles.typeValue}>
                    {postCount.toLocaleString()}
                  </div>
                </div>

                <div className={styles.typeRow}>
                  <div className={styles.typeLabel}>
                    <i className="fas fa-ellipsis-h" />
                    <span>Other</span>
                  </div>
                  <div className={styles.typeBarWrapper}>
                    <div
                      className={styles.typeBar}
                      style={{
                        width:
                          processed.total > 0
                            ? `${(otherCount / processed.total) * 100}%`
                            : '0%',
                      }}
                    />
                  </div>
                  <div className={styles.typeValue}>
                    {otherCount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activité sur les 7 derniers jours */}
          <div className={styles.statBlock}>
            <div className={styles.blockHeader}>
              <h3>Activity (last 7 days)</h3>
            </div>
            <div className={styles.blockContent}>
              {processed.last7Days.length === 0 ? (
                <div className={styles.emptyMiniState}>
                  <span>No data</span>
                </div>
              ) : (
                <div className={styles.activityChart}>
                  {processed.last7Days.map((item, index) => {
                    const value = item.count || 0;
                    const height =
                      maxActivity > 0
                        ? 20 + (value / maxActivity) * 60
                        : 20;
                    return (
                      <div
                        key={item._id || index}
                        className={styles.activityBarWrapper}
                      >
                        <div
                          className={styles.activityBar}
                          style={{ height: `${height}px` }}
                          title={`${value} comments`}
                        />
                        <span className={styles.activityLabel}>
                          {formatDateLabel(item._id || item.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Top commenters */}
          <div className={styles.statBlock}>
            <div className={styles.blockHeader}>
              <h3>Top commenters</h3>
            </div>
            <div className={styles.blockContent}>
              {processed.topCommenters.length === 0 ? (
                <div className={styles.emptyMiniState}>
                  <span>No data</span>
                </div>
              ) : (
                <div className={styles.topCommenters}>
                  {processed.topCommenters.slice(0, 5).map((item, index) => {
                    const user = item.user || {};
                    const fullName =
                      `${user.prenom || ''} ${user.nom || ''}`.trim() ||
                      'User';
                    const avatar = toAbsoluteUrl(user.photo_profil);

                    return (
                      <div
                        key={user._id || index}
                        className={styles.commenterRow}
                      >
                        <div className={styles.rank}>
                          #{index + 1}
                        </div>
                        <img
                          src={avatar}
                          alt={fullName}
                          className={styles.commenterAvatar}
                          onError={(e) => {
                            e.currentTarget.src =
                              '/images/default-avatar.jpg';
                          }}
                        />
                        <div className={styles.commenterInfo}>
                          <div className={styles.commenterName}>
                            {fullName}
                          </div>
                          <div className={styles.commenterEmail}>
                            {user.email || ''}
                          </div>
                        </div>
                        <div className={styles.commenterCount}>
                          {item.count.toLocaleString()} comments
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentStats;
