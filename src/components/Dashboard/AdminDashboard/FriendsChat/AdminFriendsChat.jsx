// src/components/Dashboard/AdminDashboard/FriendsChat/AdminFriendsChat.jsx
import React, { useEffect, useState } from 'react';
// ✅ On importe depuis utils/api, en export nommé
import { adminFriendsChatAPI } from '../../../../utils/api';
import styles from './AdminFriendsChat.module.css';

const TABS = {
  OVERVIEW: 'overview',
  FRIENDSHIPS: 'friendships',
  CONVERSATIONS: 'conversations',
  BLOCKS: 'blocks'
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

  const [blocks, setBlocks] = useState([]);

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
    } else if (activeTab === TABS.BLOCKS) {
      loadBlocks();
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
      // backend: { data: { data: { friendships, messages, groups, ... } } }
      setOverview(res.data.data || res.data);
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
      setFriendships(res.data.data || res.data.friendships || []);
      setFriendshipsPagination(res.data.pagination || res.data.meta || null);
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
      setConversations(res.data.data || res.data.conversations || []);
      setSelectedConversation(null);
      setConversationMessages([]);
      setConversationPagination(null);
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
      const data = res.data.data || res.data;
      setConversationMessages(data?.messages || []);
      setConversationPagination(data?.pagination || null);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBlocks = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminFriendsChatAPI.getBlocks();
      // On essaie d’être défensif sur la forme des données
      setBlocks(
        res.data.data ||
          res.data.blocks ||
          (Array.isArray(res.data) ? res.data : [])
      );
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

  // =========================
  // RENDER OVERVIEW + GRAPHIQUES
  // =========================
  const renderOverview = () => {
    if (!overview) return null;

    const friendshipsStats = overview.friendships || {};
    const messagesStats = overview.messages || {};
    const groupsStats = overview.groups || {};

    const totalFriends = friendshipsStats.total || 0;
    const pendingFriends = friendshipsStats.pendingRequests || 0;
    const blockedRelations = friendshipsStats.blockedRelations || 0;
    const acceptedFriends = Math.max(
      totalFriends - pendingFriends - blockedRelations,
      0
    );

    const totalMessages = messagesStats.total || 0;
    const last24hMessages = messagesStats.last24h || 0;
    const olderMessages = Math.max(totalMessages - last24hMessages, 0);

    const percent = (part, total) =>
      total > 0 ? Math.round((part / total) * 100) : 0;

    return (
      <div className={styles.overviewWrapper}>
        {/* Cartes principales */}
        <div className={styles.cardsGrid}>
          <div className={styles.card}>
            <h3>Friends</h3>
            <p className={styles.cardNumber}>{totalFriends}</p>
            <p className={styles.cardMeta}>
              Accepted: {acceptedFriends} • Pending: {pendingFriends} • Blocked:{' '}
              {blockedRelations}
            </p>
          </div>

          <div className={styles.card}>
            <h3>Messages</h3>
            <p className={styles.cardNumber}>{totalMessages}</p>
            <p className={styles.cardMeta}>Last 24h: {last24hMessages}</p>
          </div>

          <div className={styles.card}>
            <h3>Groups & Conversations</h3>
            <p className={styles.cardNumber}>
              {(groupsStats.friendGroups || 0) +
                (groupsStats.conversations || 0)}
            </p>
            <p className={styles.cardMeta}>
              Friend groups: {groupsStats.friendGroups || 0} • Conversations:{' '}
              {groupsStats.conversations || 0}
            </p>
          </div>
        </div>

        {/* Graphiques simples */}
        <div className={styles.chartsRow}>
          {/* Répartition amitiés */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h4>Friendships distribution</h4>
              <span className={styles.chartSubtitle}>
                Accepted / Pending / Blocked
              </span>
            </div>
            <div className={styles.chartBody}>
              <div className={styles.chartRowItem}>
                <div className={styles.chartRowLabel}>
                  <span className={`${styles.dot} ${styles.dotAccepted}`} />
                  Accepted
                </div>
                <div className={styles.chartBarWrapper}>
                  <div
                    className={`${styles.chartBarFill} ${styles.chartBarAccepted}`}
                    style={{ width: `${percent(acceptedFriends, totalFriends)}%` }}
                  />
                </div>
                <span className={styles.chartValue}>{acceptedFriends}</span>
              </div>

              <div className={styles.chartRowItem}>
                <div className={styles.chartRowLabel}>
                  <span className={`${styles.dot} ${styles.dotPending}`} />
                  Pending
                </div>
                <div className={styles.chartBarWrapper}>
                  <div
                    className={`${styles.chartBarFill} ${styles.chartBarPending}`}
                    style={{ width: `${percent(pendingFriends, totalFriends)}%` }}
                  />
                </div>
                <span className={styles.chartValue}>{pendingFriends}</span>
              </div>

              <div className={styles.chartRowItem}>
                <div className={styles.chartRowLabel}>
                  <span className={`${styles.dot} ${styles.dotBlocked}`} />
                  Blocked
                </div>
                <div className={styles.chartBarWrapper}>
                  <div
                    className={`${styles.chartBarFill} ${styles.chartBarBlocked}`}
                    style={{
                      width: `${percent(blockedRelations, totalFriends)}%`
                    }}
                  />
                </div>
                <span className={styles.chartValue}>{blockedRelations}</span>
              </div>
            </div>
          </div>

          {/* Messages : activité */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h4>Messages activity</h4>
              <span className={styles.chartSubtitle}>
                Last 24h vs older messages
              </span>
            </div>
            <div className={styles.chartBody}>
              <div className={styles.chartRowItem}>
                <div className={styles.chartRowLabel}>
                  <span className={`${styles.dot} ${styles.dot24h}`} />
                  Last 24h
                </div>
                <div className={styles.chartBarWrapper}>
                  <div
                    className={`${styles.chartBarFill} ${styles.chartBar24h}`}
                    style={{
                      width: `${percent(last24hMessages, totalMessages)}%`
                    }}
                  />
                </div>
                <span className={styles.chartValue}>{last24hMessages}</span>
              </div>

              <div className={styles.chartRowItem}>
                <div className={styles.chartRowLabel}>
                  <span className={`${styles.dot} ${styles.dotOlder}`} />
                  Older
                </div>
                <div className={styles.chartBarWrapper}>
                  <div
                    className={`${styles.chartBarFill} ${styles.chartBarOlder}`}
                    style={{
                      width: `${percent(olderMessages, totalMessages)}%`
                    }}
                  />
                </div>
                <span className={styles.chartValue}>{olderMessages}</span>
              </div>
            </div>
          </div>
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
                    <span
                      className={`${styles.badge} ${
                        styles[`badge_${f.status}`] || ''
                      }`}
                    >
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
                  friendshipsPagination.page >=
                  friendshipsPagination.totalPages
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
                conv.participants
                  ?.map((p) => `${p.prenom} ${p.nom}`)
                  .join(', ') || '-';
              return (
                <li
                  key={conv._id}
                  className={`${styles.conversationItem} ${
                    selectedConversation &&
                    selectedConversation._id === conv._id
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
                        {new Date(conv.lastMessageAt).toLocaleString(
                          undefined,
                          {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          }
                        )}
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
                        {m.created_date
                          ? new Date(m.created_date).toLocaleString()
                          : ''}
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

  const renderBlocks = () => {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Blocks</h3>
          <span className={styles.sectionSub}>
            Liste des utilisateurs bloqués dans Friends & Chat
          </span>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Blocker</th>
                <th>Blocked user</th>
                <th>Reason</th>
                <th>Since</th>
              </tr>
            </thead>
            <tbody>
              {blocks.length === 0 && (
                <tr>
                  <td colSpan="4" className={styles.emptyCell}>
                    Aucun blocage enregistré
                  </td>
                </tr>
              )}

              {blocks.map((b) => {
                const blocker = b.blocker || b.blockerUser || b.user || {};
                const blocked =
                  b.blocked || b.blockedUser || b.targetUser || {};
                const date =
                  b.createdAt || b.created_date || b.blockedAt || null;

                return (
                  <tr key={b._id}>
                    <td>
                      {blocker.prenom} {blocker.nom}
                      <br />
                      <span className={styles.muted}>
                        {blocker.email || '-'}
                      </span>
                    </td>
                    <td>
                      {blocked.prenom} {blocked.nom}
                      <br />
                      <span className={styles.muted}>
                        {blocked.email || '-'}
                      </span>
                    </td>
                    <td>{b.reason || '-'}</td>
                    <td>
                      {date ? new Date(date).toLocaleString() : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <h2>Friends & Chat – Admin</h2>
        <span className={styles.headerSub}>
          Monitoring du social (amis, conversations, blocages)
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
            activeTab === TABS.BLOCKS ? styles.tabActive : ''
          }`}
          onClick={() => setActiveTab(TABS.BLOCKS)}
        >
          Blocks
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {loading && <div className={styles.loading}>Chargement…</div>}

      {!loading && activeTab === TABS.OVERVIEW && renderOverview()}
      {!loading && activeTab === TABS.FRIENDSHIPS && renderFriendships()}
      {!loading && activeTab === TABS.CONVERSATIONS && renderConversations()}
      {!loading && activeTab === TABS.BLOCKS && renderBlocks()}
    </div>
  );
};

export default AdminFriendsChat;
