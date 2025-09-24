import React, { useEffect, useMemo, useState } from 'react';
import styles from './Likes.module.css';
import LikesFilters from './LikesFilters';
import LikesTable from './LikesTable';
import LikesStats from './LikesStats';
import LikeDetailsModal from './LikeDetailsModal';
import BulkActionsBar from './BulkActionsBar';
import { adminAPI } from '../../../../utils/adminAPI';

const initialFilters = {
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
  const [filters, setFilters] = useState(initialFilters);
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, sortBy: 'recent' });
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState([]);
  const [details, setDetails] = useState(null);  // { like, open: true/false }
  const totalLikes = useMemo(() => (pagination?.total || 0), [pagination]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getLikes({ params: filters });
      if (res?.success) {
        setRows(res.data || []);
        setPagination({
          page: res.pagination?.page || filters.page,
          totalPages: res.pagination?.totalPages || 1,
          total: res.pagination?.total || 0,
          sortBy: filters.sortBy,
        });
        // si on change de page/données, on reset la sélection
        setSelected([]);
      } else {
        setError(res?.message || 'Une erreur est survenue.');
      }
    } catch (e) {
      setError('Erreur lors du chargement des likes.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await adminAPI.getLikesStats();
      if (res?.success) setStats(res.data || {});
    } catch {
      // on ignore les erreurs de stats côté UI
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchStats();
  }, []);

  const onFilterChange = (patch) => {
    setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));
  };

  const onPageChange = (page) => setFilters((f) => ({ ...f, page }));
  const onSortChange = (sortBy) => setFilters((f) => ({ ...f, sortBy, page: 1 }));

  const onToggleAll = () => {
    if (!rows?.length) return;
    setSelected((prev) => (prev.length === rows.length ? [] : rows.map((r) => r._id)));
  };

  const onToggleRow = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onOpenDetails = async (row) => {
    try {
      const res = await adminAPI.getLikeDetails(row._id);
      if (res?.success) setDetails({ open: true, like: res.data });
      else setDetails({ open: true, like: row });
    } catch {
      setDetails({ open: true, like: row });
    }
  };

  const onCloseDetails = () => setDetails(null);

  const onDelete = async (id) => {
    if (!id) return;
    try {
      await adminAPI.deleteLike(id);
      fetchData();
    } catch {
      // noop
    }
  };

  const onBulkDelete = async () => {
    if (!selected.length) return;
    try {
      await adminAPI.bulkDeleteLikes({ likeIds: selected });
      fetchData();
    } catch {
      // noop
    }
  };

  // KPIs pour l’entête
  const kpiTotal = pagination?.total || 0;
  const kpiByAction = useMemo(() => {
    const byAction = stats?.byAction || [];
    const like = byAction.find((x) => x._id === 'LIKE')?.count || 0;
    const dislike = byAction.find((x) => x._id === 'DISLIKE')?.count || 0;
    return { like, dislike };
  }, [stats]);

  return (
    <div className={styles.wrapper}>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1>Likes</h1>
          <p className={styles.subtitle}>
            Consultez, filtrez et modérez les “likes” sur les vidéos, posts et commentaires.
          </p>
        </div>

        <div className={styles.headerKpis}>
          <div className={styles.kpi}>
            <div className={styles.kpiValue}>{kpiTotal}</div>
            <div className={styles.kpiLabel}>Likes totaux</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiPills}>
              <span className={styles.pill}><i className="fas fa-thumbs-up" /> {kpiByAction.like}</span>
              <span className={styles.pill}><i className="fas fa-thumbs-down" /> {kpiByAction.dislike}</span>
            </div>
            <div className={styles.kpiLabel}>Répartition actions</div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <LikesStats stats={stats} loading={loadingStats} />

      {/* FILTRES */}
      <LikesFilters
        filters={filters}
        onFilterChange={onFilterChange}
        totalLikes={kpiTotal}
      />

      {/* BULK BAR */}
      {!!selected.length && (
        <BulkActionsBar
          count={selected.length}
          onCancel={() => setSelected([])}
          onDelete={onBulkDelete}
        />
      )}

      {/* TABLE */}
      <LikesTable
        rows={rows}
        loading={loading}
        pagination={pagination}
        selected={selected}
        onToggleRow={onToggleRow}
        onToggleAll={onToggleAll}
        onOpenDetails={onOpenDetails}
        onDelete={onDelete}
        onPageChange={onPageChange}
        onSortChange={onSortChange}
      />

      {/* MODAL DÉTAILS */}
      {details?.open && (
        <LikeDetailsModal like={details.like} onClose={onCloseDetails} />
      )}

      {/* ERREUR */}
      {error && (
        <div className={styles.card} style={{ marginTop: 16, borderColor: '#ffcdd2' }}>
          <div className={styles.cardHeader}>
            <h3 style={{ color: '#d32f2f' }}><i className="fas fa-exclamation-triangle" /> Erreur</h3>
          </div>
          <p style={{ margin: 0, color: '#6c757d' }}>{error}</p>
        </div>
      )}
    </div>
  );
}
