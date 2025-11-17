// src/components/Dashboard/AdminDashboard/FriendsChat/AdminFriendsChat.jsx
import React, { useEffect, useState } from 'react';
// ✅ On importe depuis utils/api, en export nommé
import { adminFriendsChatAPI } from '../../../../utils/api';
import styles from './AdminFriendsChat.module.css';

const TABS = {
  OVERVIEW: 'overview',
  FRIENDSHIPS: 'friendships',
  CONVERSATIONS: 'conversations',
  REPORTS: 'reports'
};

const AdminFriendsChat = () => {
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW);

  const [overview, setOverview] = useState(null);

  const [friendships, setFriendships] = useState([]);
  const [friendshipsPagination, setFriendshipsPagination] = useState(null);

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [conversationPagination, setConversationPagination] = useState(null);

  const [reports, setReports] = useState([]);
  const [reportsPagination, setReportsPagination] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Chargement par onglet
  useEffect(() => {
    if (activeTab === TABS.OVERVIEW) {
      loadOverview();
    } else if (activeTab === TABS.FRIENDSHIPS) {
      loadFriendships();
    } else if (activeTab === TABS.CONVERSATIONS) {
      loadConversations();
    } else if (activeTab === TABS.REPORTS) {
      loadReports();
    }
  }, [activeTab]);

  const handleError = (err) => {
    console.error(err);
    const msg =
      err?.response?.data?.message || err.message || 'Une erreur est survenue';
    setError(msg);
  };

  const loadOverview = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminFriendsChatAPI.getOverview();
      setOverview(res.data.data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFriendships = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const res = await adminFriendsChatAPI.getFriendships({ page, limit: 25 });
      setFriendships(res.data.data || []);
      setFriendshipsPagination(res.data.pagination || null);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminFriendsChatAPI.getConversations();
      setConversations(res.data.data || []);
      setSelectedConversation(null);
      setConversationMessages([]);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const loadConversationMessages = async (conversationId, page = 1) => {
    try {
      setLoading(true);
      setError('');
      const res = await adminFriendsChatAPI.getConversationMessages(
        conversationId,
        { page, limit: 50 }
      );
      setConversationMessages(res.data.data?.messages || []);
      setConversationPagination(res.data.data?.pagination || null);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const res = await adminFriendsChatAPI.getReports({ page, limit: 25 });
      setReports(res.data.data || []);
      setReportsPagination(res.data.pagination || null);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFriendship = async (friendshipId) => {
    if (!window.confirm('Confirmer la suppression de cette relation ?')) return;
    try {
      await adminFriendsChatAPI.deleteFriendship(friendshipId);
      await loadFriendships(friendshipsPagination?.page || 1);
    } catch (err) {
      handleError(err);
    }
  };

  const handleAdminDeleteMessage = async (messageId) => {
    if (!window.confirm('Supprimer ce message pour tout le monde ?')) return;
    try {
      await adminFriendsChatAPI.adminDeleteMessage(messageId);
      // Rafraîchir la conversation en cours
      if (selectedConversation) {
        await loadConversationMessages(
          selectedConversation._id,
          conversationPagination?.page || 1
        );
      }
    } catch (err) {
      handleError(err);
    }
  };

  const handleUpdateReport = async (reportId, status, resolution) => {
    try {
      await adminFriendsChatAPI.updateReport(reportId, {
        status,
        resolution
      });
      await loadReports(reportsPagination?.page || 1);
    } catch (err) {
      handleError(err);
    }
  };

  const renderOverview = () => {
    if (!overview) return null;

    const { friendships, messages, groups, reports: reportsStats } = overview;

    return (
      <div className={styles.cardsGrid}>
        <div className={styles.card}>
          <h3>Friends</h3>
          <p className={styles.cardNumber}>{friendships.total}</p>
          <p className={styles.cardMeta}>
            Pending: {friendships.pendingRequests} • Blocked:{' '}
            {friendships.blockedRelations}
          </p>
        </div>

        <div className={styles.card}>
          <h3>Messages</h3>
          <p className={styles.cardNumber}>{messages.total}</p>
          <p className={styles.cardMeta}>Last 24h: {messages.last24h}</p>
        </div>

        <div className={styles.card}>
          <h3>Groups & Conversations</h3>
          <p className={styles.cardNumber}>
            {groups.friendGroups + groups.conversations}
          </p>
          <p className={styles.cardMeta}>
            Friend groups: {groups.friendGroups} • Conversations:{' '}
            {groups.conversations}
          </p>
        </div>

        <div className={styles.card}>
          <h3>Reports</h3>
          <p className={styles.cardNumber}>{reportsStats.open}</p>
          <p className={styles.cardMeta}>
            Open • Resolved: {reportsStats.resolved}
          </p>
        </div>
      </div>
    );
  };

  const renderFriendships = () => {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Friendships</h3>
          <span className={styles.sectionSub}>
            Liste des relations d’amitié (tous statuts)
          </span>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Requester</th>
                <th>Receiver</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {friendships.length === 0 && (
                <tr>
                  <td colSpan="5" className={styles.emptyCell}>
                    Aucune relation trouvée
                  </td>
                </tr>
              )}
              {friendships.map((f) => (
                <tr key={f._id}>
                  <td>
                    {f.requester?.prenom} {f.requester?.nom}
                    <br />
                    <span className={styles.muted}>
                      {f.requester?.email || '-'}
                    </span>
                  </td>
                  <td>
                    {f.receiver?.prenom} {f.receiver?.nom}
                    <br />
                    <span className={styles.muted}>
                      {f.receiver?.email || '-'}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[`badge_${f.status}`]}`}>
                      {f.status}
                    </span>
                  </td>
                  <td>
                    {f.created_date
                      ? new Date(f.created_date).toLocaleString()
                      : '-'}
                  </td>
                  <td>
                    <button
                      className={styles.dangerButton}
                      onClick={() => handleDeleteFriendship(f._id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {friendshipsPagination && friendshipsPagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                disabled={friendshipsPagination.page <= 1}
                onClick={() => loadFriendships(friendshipsPagination.page - 1)}
              >
                Prev
              </button>
              <span>
                Page {friendshipsPagination.page} /{' '}
                {friendshipsPagination.totalPages}
              </span>
              <button
                disabled={
                  friendshipsPagination.page >= friendshipsPagination.totalPages
                }
                onClick={() => loadFriendships(friendshipsPagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderConversations = () => {
    return (
      <div className={styles.conversationsLayout}>
        <div className={styles.conversationsList}>
          <div className={styles.sectionHeader}>
            <h3>Conversations</h3>
            <span className={styles.sectionSub}>
              Direct & group conversations
            </span>
          </div>

          <ul className={styles.conversationItems}>
            {conversations.length === 0 && (
              <li className={styles.emptyCell}>
                Aucune conversation trouvée
              </li>
            )}
            {conversations.map((conv) => {
              const participants =
                conv.participants?.map((p) => `${p.prenom} ${p.nom}`).join(', ') ||
                '-';
              return (
                <li
                  key={conv._id}
                  className={`${styles.conversationItem} ${
                    selectedConversation && selectedConversation._id === conv._id
                      ? styles.conversationItemActive
                      : ''
                  }`}
                  onClick={() => {
                    setSelectedConversation(conv);
                    loadConversationMessages(conv._id, 1);
                  }}
                >
                  <div className={styles.conversationTitle}>
                    {conv.type === 'group'
                      ? conv.groupName || 'Group conversation'
                      : participants}
                  </div>
                  <div className={styles.conversationMeta}>
                    <span className={styles.badge}>
                      {conv.type === 'group' ? 'Group' : 'Direct'}
                    </span>
                    {conv.lastMessageAt && (
                      <span className={styles.muted}>
                        •{' '}
                        {new Date(conv.lastMessageAt).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className={styles.conversationMessages}>
          {!selectedConversation && (
            <div className={styles.emptyState}>
              Sélectionne une conversation à gauche pour voir les messages
            </div>
          )}
          {selectedConversation && (
            <>
              <div className={styles.sectionHeader}>
                <h3>
                  {selectedConversation.type === 'group'
                    ? selectedConversation.groupName || 'Group conversation'
                    : selectedConversation.participants
                        ?.map((p) => `${p.prenom} ${p.nom}`)
                        .join(', ')}
                </h3>
                <span className={styles.sectionSub}>
                  Messages de la conversation
                </span>
              </div>

              <div className={styles.messagesList}>
                {conversationMessages.length === 0 && (
                  <div className={styles.emptyCell}>
                    Aucun message dans cette conversation
                  </div>
                )}
                {conversationMessages.map((m) => (
                  <div key={m._id} className={styles.messageRow}>
                    <div className={styles.messageHeader}>
                      <strong>
                        {m.sender?.prenom} {m.sender?.nom}
                      </strong>
                      <span className={styles.muted}>
                        {new Date(m.created_date).toLocaleString()}
                      </span>
                    </div>
                    <div className={styles.messageContent}>{m.content}</div>
                    <div className={styles.messageActions}>
                      <button
                        className={styles.dangerLink}
                        onClick={() => handleAdminDeleteMessage(m._id)}
                      >
                        Delete message (admin)
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {conversationPagination &&
                conversationPagination.totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      disabled={conversationPagination.page <= 1}
                      onClick={() =>
                        loadConversationMessages(
                          selectedConversation._id,
                          conversationPagination.page - 1
                        )
                      }
                    >
                      Prev
                    </button>
                    <span>
                      Page {conversationPagination.page} /{' '}
                      {conversationPagination.totalPages}
                    </span>
                    <button
                      disabled={
                        conversationPagination.page >=
                        conversationPagination.totalPages
                      }
                      onClick={() =>
                        loadConversationMessages(
                          selectedConversation._id,
                          conversationPagination.page + 1
                        )
                      }
                    >
                      Next
                    </button>
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderReports = () => {
    const allowedStatus = ['pending', 'reviewing', 'resolved', 'dismissed'];
    const allowedResolutions = [
      'no_action',
      'warning',
      'temporary_ban',
      'permanent_ban',
      'deleted_content'
    ];

    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Reports</h3>
          <span className={styles.sectionSub}>
            Signalements liés au module Chat / Friends
          </span>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Reporter</th>
                <th>Reported user</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Resolution</th>
                <th>Message</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 && (
                <tr>
                  <td colSpan="7" className={styles.emptyCell}>
                    Aucun report trouvé
                  </td>
                </tr>
              )}
              {reports.map((r) => (
                <tr key={r._id}>
                  <td>
                    {r.reporter?.prenom} {r.reporter?.nom}
                    <br />
                    <span className={styles.muted}>
                      {r.reporter?.email || '-'}
                    </span>
                  </td>
                  <td>
                    {r.reportedUser?.prenom} {r.reportedUser?.nom}
                    <br />
                    <span className={styles.muted}>
                      {r.reportedUser?.email || '-'}
                    </span>
                  </td>
                  <td>{r.reason}</td>
                  <td>
                    <select
                      className={styles.select}
                      value={r.status}
                      onChange={(e) =>
                        handleUpdateReport(
                          r._id,
                          e.target.value,
                          r.resolution || 'no_action'
                        )
                      }
                    >
                      {allowedStatus.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className={styles.select}
                      value={r.resolution || 'no_action'}
                      onChange={(e) =>
                        handleUpdateReport(
                          r._id,
                          r.status,
                          e.target.value
                        )
                      }
                    >
                      {allowedResolutions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {r.messageId?.content ? (
                      <span className={styles.messagePreview}>
                        {r.messageId.content.length > 80
                          ? r.messageId.content.slice(0, 80) + '…'
                          : r.messageId.content}
                      </span>
                    ) : (
                      <span className={styles.muted}>-</span>
                    )}
                  </td>
                  <td>
                    {r.updatedAt
                      ? new Date(r.updatedAt).toLocaleString()
                      : r.createdAt
                      ? new Date(r.createdAt).toLocaleString()
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {reportsPagination && reportsPagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                disabled={reportsPagination.page <= 1}
                onClick={() => loadReports(reportsPagination.page - 1)}
              >
                Prev
              </button>
              <span>
                Page {reportsPagination.page} / {reportsPagination.totalPages}
              </span>
              <button
                disabled={
                  reportsPagination.page >= reportsPagination.totalPages
                }
                onClick={() => loadReports(reportsPagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <h2>Friends & Chat – Admin</h2>
        <span className={styles.headerSub}>
          Monitoring & moderation du social (amis, conversations, reports)
        </span>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === TABS.OVERVIEW ? styles.tabActive : ''
          }`}
          onClick={() => setActiveTab(TABS.OVERVIEW)}
        >
          Overview
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === TABS.FRIENDSHIPS ? styles.tabActive : ''
          }`}
          onClick={() => setActiveTab(TABS.FRIENDSHIPS)}
        >
          Friendships
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === TABS.CONVERSATIONS ? styles.tabActive : ''
          }`}
          onClick={() => setActiveTab(TABS.CONVERSATIONS)}
        >
          Conversations
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === TABS.REPORTS ? styles.tabActive : ''
          }`}
          onClick={() => setActiveTab(TABS.REPORTS)}
        >
          Reports
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {loading && <div className={styles.loading}>Chargement…</div>}

      {!loading && activeTab === TABS.OVERVIEW && renderOverview()}
      {!loading && activeTab === TABS.FRIENDSHIPS && renderFriendships()}
      {!loading && activeTab === TABS.CONVERSATIONS && renderConversations()}
      {!loading && activeTab === TABS.REPORTS && renderReports()}
    </div>
  );
};

export default AdminFriendsChat;
