import React, { useEffect, useMemo, useState } from 'react';
import { adminAPI } from '../../../../utils/adminAPI';
import styles from './Likes.module.css';
import LikesFilters from './LikesFilters';
import LikesStats from './LikesStats';
import LikesTable from './LikesTable';
import LikeDetailsModal from './LikeDetailsModal';
import BulkActionsBar from './BulkActionsBar';

const DEFAULT_FILTERS = {
  page: 1,
  limit: 20,
  search: '',
  userId: '',
  type: 'all',
  targetId: '',
  dateFrom: '',
  dateTo: '',
  action: 'all',
  sortBy: 'recent',
};

export default function AdminLikes() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [current, setCurrent] = useState(null); // like sélectionné pour le détail

  const hasSelection = selected.length > 0;

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getLikes(filters);
      if (res.success) {
        setRows(res.data || []);
        setPagination(res.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await adminAPI.getLikesStats();
      if (res.success) setStats(res.data);
    } catch {}
  };

  useEffect(() => { load(); }, [JSON.stringify(filters)]);
  useEffect(() => { loadStats(); }, []);

  const toggleRow = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selected.length === rows.length) setSelected([]);
    else setSelected(rows.map(r => r._id));
  };

  const removeOne = async (id) => {
    await adminAPI.deleteLike(id);
    await load(); await loadStats();
  };

  const bulkDelete = async () => {
    if (!hasSelection) return;
    await adminAPI.bulkDeleteLikes({ likeIds: selected });
    setSelected([]);
    await load(); await loadStats();
  };

  const resetFilters = () => setFilters({ ...DEFAULT_FILTERS });

  const onOpenDetails = async (row) => {
    // recharger le détail pour afficher l’entité enrichie
    const res = await adminAPI.getLikeDetails(row._id);
    setCurrent(res?.data || { like: row });
  };

  const onCloseDetails = () => setCurrent(null);

  const headerCounts = useMemo(() => ({
    total: stats?.total?.[0]?.total || 0,
    byType: stats?.byType || []
  }), [stats]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h1>Gestion des Likes</h1>
          <p className={styles.subtitle}>Modération et analyses des interactions (like/dislike) sur vidéos, posts et commentaires.</p>
        </div>
        <div className={styles.headerKpis}>
          <div className={styles.kpi}>
            <div className={styles.kpiValue}>{headerCounts.total}</div>
            <div className={styles.kpiLabel}>Interactions totales</div>
          </div>
          <div className={styles.kpiPills}>
            {headerCounts.byType?.map(t => (
              <span key={t._id} className={styles.pill}>
                {t._id || 'N/A'}: <b>{t.count}</b>
              </span>
            ))}
          </div>
        </div>
      </div>

      <LikesFilters
        value={filters}
        onChange={(nf) => setFilters(prev => ({ ...prev, ...nf, page: 1 }))}
        onReset={resetFilters}
      />

      <LikesStats stats={stats} loading={loading} />

      <BulkActionsBar
        hasSelection={hasSelection}
        count={selected.length}
        onBulkDelete={bulkDelete}
      />

      <LikesTable
        rows={rows}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setFilters(f => ({ ...f, page }))}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        selected={selected}
        onOpenDetails={onOpenDetails}
        onDelete={removeOne}
        onSortChange={(sortBy) => setFilters(f => ({ ...f, sortBy }))}
      />

      <LikeDetailsModal open={!!current} data={current} onClose={onCloseDetails} />
    </div>
  );
}
