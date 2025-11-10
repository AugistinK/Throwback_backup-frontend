import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Chat.module.css";

import { useAuth } from "../../../../contexts/AuthContext";
import { useSocket } from "../../../../contexts/SocketContext";
import { friendsAPI } from "../../../../utils/api";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faChevronDown,
  faPlus,
  faEllipsisVertical,
  faPhone,
  faVideo,
  faPaperclip,
  faFaceSmile,
  faMicrophone,
  faPaperPlane,
  faCircle,
  faCheck,
  faCheckDouble,
  faBell,
} from "@fortawesome/free-solid-svg-icons";

/* ----------------------------- helpers ----------------------------- */

const toTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};
const toDayKey = (iso) => {
  const d = new Date(iso);
  return d.toDateString();
};
const dayLabel = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / (1000 * 60 * 60 * 24);
  if (diff < 1 && d.getDate() === now.getDate()) return "Today";
  if (diff < 2 && d.getDate() === new Date(now - 86400000).getDate()) return "Yesterday";
  return d.toLocaleDateString();
};
const initials = (full = "") =>
  full
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/* ----------------------------- UI bits ----------------------------- */

const Chip = ({ active, children, onClick }) => (
  <button
    className={`${styles.chip} ${active ? styles.chipActive : ""}`}
    onClick={onClick}
  >
    {children}
  </button>
);

const ConversationItem = ({ convo, active, onClick }) => {
  const last = convo.lastMessage;
  return (
    <button
      className={`${styles.convoItem} ${active ? styles.convoItemActive : ""}`}
      onClick={onClick}
    >
      <div className={styles.convoAvatar}>
        {convo.avatar ? <img src={convo.avatar} alt={convo.name} /> : <span>{initials(convo.name)}</span>}
        <span
          className={styles.statusDot}
          style={{ backgroundColor: convo.online ? "#10b981" : "#9ca3af" }}
          title={convo.online ? "Online" : "Offline"}
        />
      </div>

      <div className={styles.convoMain}>
        <div className={styles.convoTopRow}>
          <span className={styles.convoName}>{convo.name}</span>
          <span className={styles.convoTime}>
            {last?.createdAt ? toTime(last.createdAt) : ""}
          </span>
        </div>

        <div className={styles.convoBottomRow}>
          <span className={styles.convoSnippet}>
            {last?.fromMe ? "You: " : ""}
            {last?.content || "Say hello 👋"}
          </span>

          {convo.unread > 0 && (
            <span className={styles.unreadBadge}>{convo.unread}</span>
          )}
        </div>
      </div>
    </button>
  );
};

const Bubble = ({ me, msg, showStatus, readByPeer, avatar }) => (
  <div className={`${styles.msgRow} ${me ? styles.msgRight : styles.msgLeft}`}>
    {!me && (
      <div className={styles.msgAvatar}>
        {avatar ? <img src={avatar} alt="" /> : <span />}
      </div>
    )}

    <div className={`${styles.msgBubble} ${me ? styles.mine : styles.theirs}`}>
      <p className={styles.msgText}>{msg.content}</p>
      <div className={styles.msgMeta}>
        <span>{toTime(msg.createdAt)}</span>
        {me && showStatus && (
          <span className={styles.msgTicks} title={readByPeer ? "Read" : "Sent"}>
            <FontAwesomeIcon icon={readByPeer ? faCheckDouble : faCheck} />
          </span>
        )}
      </div>
    </div>
  </div>
);

/* ------------------------------- Page ------------------------------- */

const Chat = () => {
  const { user } = useAuth();
  const {
    socket,
    isConnected,
    isUserOnline,
    sendMessage: socketSend,
    joinConversation,
    startTyping,
    stopTyping,
    markMessagesAsRead,
  } = useSocket();

  const [filters, setFilters] = useState("all"); // all | unread | favorites | groups
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent"); // recent | unread | name

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const [typingFromPeer, setTypingFromPeer] = useState(false);
  const [readPeers, setReadPeers] = useState(new Set()); // users who read my msgs (by id)

  const listRef = useRef(null);
  const typingTimer = useRef(null);

  /* -------------------------- bootstrap convos -------------------------- */

  useEffect(() => {
    (async () => {
      const res = await friendsAPI.getConversations();
      const items =
        res?.data?.map((c) => ({
          id: c._id || c.id || c.partnerId,
          userId: c.partnerId || c.userId,
          name:
            c.partnerName ||
            `${c.partnerPrenom ?? ""} ${c.partnerNom ?? ""}`.trim() ||
            "Friend",
          avatar: c.partnerPhoto || c.avatar || "",
          online: isUserOnline ? isUserOnline(c.partnerId || c.userId) : false,
          lastMessage: c.lastMessage
            ? {
                content: c.lastMessage.content,
                createdAt: c.lastMessage.createdAt || c.lastMessage.created_date,
                fromMe: String(c.lastMessage.senderId) === String(user?._id),
              }
            : null,
          unread: c.unreadCount || 0,
          favorite: !!c.favorite,
          isGroup: !!c.isGroup,
        })) || [];

      setConversations(items);
      if (items.length > 0) setActiveId(items[0].userId);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------- load messages ---------------------------- */

  useEffect(() => {
    if (!activeId) return;

    (async () => {
      // rejoindre la room socket + marquer lus
      joinConversation(activeId);
      markMessagesAsRead(activeId);

      const res = await friendsAPI.getMessages(activeId, 1, 100);
      const raw = res?.data?.messages || res?.data || [];
      const list = raw.map((m) => ({
        _id: m._id || m.id,
        senderId: m.sender?._id || m.senderId || m.sender || m.from,
        content: m.content || "",
        createdAt: m.createdAt || m.created_date || new Date().toISOString(),
        read: !!m.read,
      }));
      setMessages(list);

      // reset marqueurs
      setTypingFromPeer(false);
      setReadPeers((s) => {
        const ns = new Set(s);
        ns.delete(String(activeId));
        return ns;
      });

      // scroll bas
      queueMicrotask(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      });
    })();
  }, [activeId, joinConversation, markMessagesAsRead]);

  /* --------------------------- socket listeners --------------------------- */

  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (payload) => {
      const m = payload.message;
      const fromId = m.sender?._id?.toString?.() || m.sender?.toString?.() || m.sender || m.senderId;

      setMessages((prev) => [
        ...prev,
        {
          _id: m._id,
          senderId: fromId,
          content: m.content,
          createdAt: m.created_date || m.createdAt || new Date().toISOString(),
          read: m.read || false,
        },
      ]);

      // déplacer conversation en haut + aperçu
      setConversations((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex((c) => String(c.userId) === String(fromId));
        if (idx > -1) {
          const updated = {
            ...copy[idx],
            unread:
              String(activeId) === String(fromId) ? 0 : (copy[idx].unread || 0) + 1,
            lastMessage: {
              content: m.content,
              createdAt: m.created_date || new Date().toISOString(),
              fromMe: false,
            },
          };
          copy.splice(idx, 1);
          copy.unshift(updated);
        }
        return copy;
      });

      // si c'est la conversation active → marquer lus
      if (String(activeId) === String(fromId)) {
        markMessagesAsRead(fromId);
        queueMicrotask(() => {
          if (listRef.current)
            listRef.current.scrollTop = listRef.current.scrollHeight;
        });
      }
    };

    const onTyping = (data) => {
      if (String(data.userId) === String(activeId)) {
        setTypingFromPeer(!!data.isTyping);
        if (data.isTyping) {
          clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setTypingFromPeer(false), 2500);
        }
      }
    };

    const onRead = (data) => {
      // le correspondant a lu → marquer tous mes messages vers lui comme "read"
      const readerId = data.readerId;
      setReadPeers((s) => new Set(s).add(String(readerId)));
    };

    socket.on("new-message", onNewMessage);
    socket.on("user-typing", onTyping);
    socket.on("messages-read", onRead);

    return () => {
      socket.off("new-message", onNewMessage);
      socket.off("user-typing", onTyping);
      socket.off("messages-read", onRead);
    };
  }, [socket, activeId, markMessagesAsRead]);

  /* ----------------------------- derived state ---------------------------- */

  const filteredConvos = useMemo(() => {
    let list = conversations.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.lastMessage?.content || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter =
        (filters === "all") ||
        (filters === "unread" && c.unread > 0) ||
        (filters === "favorites" && c.favorite) ||
        (filters === "groups" && c.isGroup);

      return matchesSearch && matchesFilter;
    });

    if (sort === "unread") {
      list = [...list].sort((a, b) => (b.unread || 0) - (a.unread || 0));
    } else if (sort === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list = [...list].sort(
        (a, b) =>
          new Date(b.lastMessage?.createdAt || 0) -
          new Date(a.lastMessage?.createdAt || 0)
      );
    }
    return list;
  }, [conversations, filters, search, sort]);

  const activeConvo = useMemo(
    () => conversations.find((c) => String(c.userId) === String(activeId)),
    [conversations, activeId]
  );

  // messages groupés par date (pour chips de date)
  const grouped = useMemo(() => {
    const map = new Map();
    messages.forEach((m) => {
      const k = toDayKey(m.createdAt);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(m);
    });
    return Array.from(map.entries()).map(([k, arr]) => ({
      key: k,
      label: dayLabel(arr[0].createdAt),
      items: arr,
    }));
  }, [messages]);

  /* ------------------------------- sending ------------------------------- */

  const onSend = async () => {
    const content = text.trim();
    if (!content || !activeConvo) return;

    setSending(true);

    // optimistic
    const optimistic = {
      _id: `tmp_${Date.now()}`,
      senderId: user?._id,
      content,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setMessages((m) => [...m, optimistic]);
    setText("");

    queueMicrotask(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    });

    try {
      // socket-first (avec ack géré par le provider)
      await socketSend(activeConvo.userId, content, "text", optimistic._id);

      // fallback REST best-effort (si non idempotent, laisse tel quel)
      try {
        await friendsAPI.sendMessage(activeConvo.userId, content, "text");
      } catch {}

      // maj aperçu
      setConversations((prev) =>
        prev.map((c) =>
          String(c.userId) === String(activeConvo.userId)
            ? {
                ...c,
                lastMessage: {
                  content,
                  createdAt: new Date().toISOString(),
                  fromMe: true,
                },
              }
            : c
        )
      );
    } catch (e) {
      // rollback
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  /* ------------------------------ typing emit ----------------------------- */

  const onType = (v) => {
    setText(v);
    if (!activeConvo) return;
    startTyping(activeConvo.userId);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(
      () => stopTyping(activeConvo.userId),
      1200
    );
  };

  /* --------------------------------- UI --------------------------------- */

  return (
    <div className={styles.chatLayout}>
      {/* --------------------------- LEFT / Sidebar --------------------------- */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHead}>
          <div className={styles.brandRow}>
            <div className={styles.brandDot} />
            <span className={styles.brand}>Throwback Chat</span>
          </div>
          <button className={styles.bellBtn} title="Notifications">
            <FontAwesomeIcon icon={faBell} />
          </button>
        </div>

        <div className={styles.sidebarSearch}>
          <div className={styles.searchBox}>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <input
              placeholder="Search or start a chat"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.filterRow}>
            <Chip active={filters === "all"} onClick={() => setFilters("all")}>
              All
            </Chip>
            <Chip
              active={filters === "unread"}
              onClick={() => setFilters("unread")}
            >
              Unread
            </Chip>
            <Chip
              active={filters === "favorites"}
              onClick={() => setFilters("favorites")}
            >
              Favorites
            </Chip>
            <Chip
              active={filters === "groups"}
              onClick={() => setFilters("groups")}
            >
              Groups
            </Chip>

            <div className={styles.sortWrap}>
              <button
                className={styles.sortBtn}
                onClick={() =>
                  setSort((s) =>
                    s === "recent" ? "unread" : s === "unread" ? "name" : "recent"
                  )
                }
                title={`Sort: ${sort}`}
              >
                <span>{sort === "recent" ? "Recent" : sort === "unread" ? "Unread" : "Name"}</span>
                <FontAwesomeIcon icon={faChevronDown} />
              </button>
              <button className={styles.addBtn} title="New Chat">
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
          </div>
        </div>

        <div className={styles.convoList}>
          {filteredConvos.map((c) => (
            <ConversationItem
              key={c.id || c.userId}
              convo={c}
              active={String(activeId) === String(c.userId)}
              onClick={() => setActiveId(c.userId)}
            />
          ))}
          {filteredConvos.length === 0 && (
            <div className={styles.emptySidebar}>No conversations</div>
          )}
        </div>
      </aside>

      {/* -------------------------- RIGHT / Thread --------------------------- */}
      <section className={styles.thread}>
        {activeConvo ? (
          <>
            <div className={styles.threadHeader}>
              <div className={styles.threadUser}>
                <div className={styles.headerAvatar}>
                  {activeConvo.avatar ? (
                    <img src={activeConvo.avatar} alt={activeConvo.name} />
                  ) : (
                    <span>{initials(activeConvo.name)}</span>
                  )}
                  <span
                    className={styles.headerDot}
                    style={{ backgroundColor: activeConvo.online ? "#10b981" : "#9ca3af" }}
                  />
                </div>
                <div>
                  <div className={styles.headerName}>{activeConvo.name}</div>
                  <div className={styles.headerStatus}>
                    <FontAwesomeIcon icon={faCircle} />
                    <span>
                      {activeConvo.online ? "Online" : "Last seen 3 hours ago"}
                      {typingFromPeer ? " • typing…" : ""}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.headerActions}>
                <button title="Voice call">
                  <FontAwesomeIcon icon={faPhone} />
                </button>
                <button title="Video call">
                  <FontAwesomeIcon icon={faVideo} />
                </button>
                <button title="More">
                  <FontAwesomeIcon icon={faEllipsisVertical} />
                </button>
              </div>
            </div>

            <div className={styles.messages} ref={listRef}>
              {grouped.map((g) => (
                <div key={g.key}>
                  <div className={styles.dayChip}>{g.label}</div>
                  {g.items.map((m) => {
                    const me = String(m.senderId) === String(user?._id);
                    const readByPeer = readPeers.has(String(activeConvo.userId));
                    return (
                      <Bubble
                        key={m._id}
                        me={me}
                        msg={m}
                        showStatus={me}
                        readByPeer={readByPeer || m.read}
                        avatar={!me ? activeConvo.avatar : null}
                      />
                    );
                  })}
                </div>
              ))}

              {typingFromPeer && (
                <div className={`${styles.msgRow} ${styles.msgLeft}`}>
                  <div className={styles.msgAvatar}>
                    {activeConvo.avatar ? <img src={activeConvo.avatar} alt="" /> : <span />}
                  </div>
                  <div className={`${styles.msgBubble} ${styles.theirs}`}>
                    <div className={styles.typing}>
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.inputBar}>
              <div className={styles.inputActions}>
                <button title="Attach">
                  <FontAwesomeIcon icon={faPaperclip} />
                </button>
                <button title="Emoji">
                  <FontAwesomeIcon icon={faFaceSmile} />
                </button>
                <button title="Record">
                  <FontAwesomeIcon icon={faMicrophone} />
                </button>
              </div>

              <input
                className={styles.textField}
                placeholder={isConnected ? "Type a message…" : "Connecting…"}
                value={text}
                onChange={(e) => onType(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
                disabled={!isConnected}
              />

              <button
                className={styles.sendBtn}
                onClick={onSend}
                disabled={sending || text.trim().length === 0 || !isConnected}
                title="Send"
              >
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </div>
          </>
        ) : (
          <div className={styles.threadEmpty}>Select a conversation to start chatting</div>
        )}
      </section>
    </div>
  );
};

export default Chat;
