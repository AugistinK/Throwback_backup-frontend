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
  faEllipsis,
  faPhone,
  faVideo,
  faPaperclip,
  faFaceSmile,
  faMicrophone,
  faPaperPlane,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";

/* ----------------------------- Types/helpers ----------------------------- */

const formatTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const initialsOf = (full = "") =>
  full
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/* ------------------------------- Components ------------------------------ */

const ConversationItem = ({ convo, active, onClick }) => {
  const last = convo.lastMessage;
  return (
    <button
      className={`${styles.convoItem} ${active ? styles.convoItemActive : ""}`}
      onClick={onClick}
    >
      <div className={styles.convoAvatar}>
        {convo.avatar ? (
          <img src={convo.avatar} alt={convo.name} />
        ) : (
          <span>{initialsOf(convo.name)}</span>
        )}
        <span
          className={styles.statusDot}
          style={{
            backgroundColor: convo.online ? "#10b981" : "#9ca3af",
          }}
          title={convo.online ? "Online" : "Offline"}
        />
      </div>

      <div className={styles.convoMain}>
        <div className={styles.convoTopRow}>
          <span className={styles.convoName}>{convo.name}</span>
          <span className={styles.convoTime}>
            {last?.createdAt ? formatTime(last.createdAt) : ""}
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

const MessageBubble = ({ me, msg, avatar }) => {
  return (
    <div
      className={`${styles.msgRow} ${me ? styles.msgRight : styles.msgLeft}`}
    >
      {!me && (
        <div className={styles.msgAvatar}>
          {avatar ? (
            <img src={avatar} alt="" />
          ) : (
            <span>{/* empty */}</span>
          )}
        </div>
      )}
      <div className={`${styles.msgBubble} ${me ? styles.mine : styles.theirs}`}>
        <p className={styles.msgText}>{msg.content}</p>
        <div className={styles.msgMeta}>{formatTime(msg.createdAt)}</div>
      </div>
    </div>
  );
};

/* --------------------------------- Page ---------------------------------- */

const Chat = () => {
  const { user } = useAuth();
  const socketCtx = useSocket(); // optional real-time
  const isUserOnline = socketCtx?.isUserOnline;

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]); // [{id, userId, name, avatar, online, lastMessage, unread}]
  const [activeId, setActiveId] = useState(null);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent"); // 'recent' | 'unread' | 'name'

  const [messages, setMessages] = useState([]); // [{_id, senderId, content, createdAt}]
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");

  const listRef = useRef(null);

  /* ------------------------------ Load data ------------------------------ */

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Conversations
        const convRes = await friendsAPI.getConversations();
        const items =
          convRes?.data?.map((c) => ({
            id: c._id || c.id || c.partnerId, // partner conversation id
            userId: c.partnerId || c.userId,
            name: c.partnerName || `${c.partnerPrenom ?? ""} ${c.partnerNom ?? ""}`.trim() || "Friend",
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
          })) || [];

        setConversations(items);

        // Preselect first conversation
        if (items.length > 0) setActiveId(items[0].userId);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load messages when active changes
  useEffect(() => {
    if (!activeId) return;
    (async () => {
      const res = await friendsAPI.getMessages(activeId, 1, 60);
      const list = res?.data?.messages || res?.data || [];
      const normalized = list.map((m) => ({
        _id: m._id || m.id,
        senderId: m.senderId || m.sender || m.from,
        content: m.content || "",
        createdAt: m.createdAt || m.created_date || new Date().toISOString(),
      }));
      setMessages(normalized);

      // mark unread as read (best-effort if API exists)
      try {
        // if backend exposes bulk read, you can call it here
      } catch {}
      // scroll to bottom
      queueMicrotask(() => {
        if (listRef.current)
          listRef.current.scrollTop = listRef.current.scrollHeight;
      });
    })();
  }, [activeId]);

  /* --------------------------- Realtime (optional) --------------------------- */
  useEffect(() => {
    if (!socketCtx?.socket) return;
    const onIncoming = (payload) => {
      // payload: {senderId, content, createdAt}
      setMessages((prev) => [
        ...prev,
        {
          _id: payload._id || Math.random().toString(36),
          senderId: payload.senderId,
          content: payload.content,
          createdAt: payload.createdAt || new Date().toISOString(),
        },
      ]);

      // bump conversation preview/unread
      setConversations((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex(
          (c) => String(c.userId) === String(payload.senderId)
        );
        if (idx > -1) {
          copy[idx] = {
            ...copy[idx],
            lastMessage: {
              content: payload.content,
              createdAt: payload.createdAt || new Date().toISOString(),
              fromMe: false,
            },
            unread:
              String(activeId) === String(payload.senderId)
                ? 0
                : (copy[idx].unread || 0) + 1,
          };
          // move to top
          const [spliced] = copy.splice(idx, 1);
          copy.unshift(spliced);
        }
        return copy;
      });

      queueMicrotask(() => {
        if (listRef.current)
          listRef.current.scrollTop = listRef.current.scrollHeight;
      });
    };

    socketCtx.socket.on?.("message:receive", onIncoming);
    return () => {
      socketCtx.socket.off?.("message:receive", onIncoming);
    };
  }, [socketCtx, activeId]);

  /* ------------------------------ Derived list ----------------------------- */

  const filteredConvos = useMemo(() => {
    let list = conversations.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.lastMessage?.content || "")
          .toLowerCase()
          .includes(search.toLowerCase())
    );
    if (sort === "unread") {
      list = list.sort((a, b) => (b.unread || 0) - (a.unread || 0));
    } else if (sort === "name") {
      list = list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // recent
      list = list.sort(
        (a, b) =>
          new Date(b.lastMessage?.createdAt || 0) -
          new Date(a.lastMessage?.createdAt || 0)
      );
    }
    return list;
  }, [conversations, search, sort]);

  const activeConvo = useMemo(
    () => conversations.find((c) => String(c.userId) === String(activeId)),
    [conversations, activeId]
  );

  /* ------------------------------ Send message ----------------------------- */

  const onSend = async () => {
    const content = text.trim();
    if (!content || !activeConvo) return;
    setSending(true);

    // optimistic add
    const optimistic = {
      _id: `tmp_${Date.now()}`,
      senderId: user?._id,
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);

    setText("");
    queueMicrotask(() => {
      if (listRef.current)
        listRef.current.scrollTop = listRef.current.scrollHeight;
    });

    try {
      const res = await friendsAPI.sendMessage(activeConvo.userId, content);
      const saved = res?.data || {};
      setMessages((prev) =>
        prev.map((m) => (m._id === optimistic._id ? { ...m, _id: saved._id || m._id } : m))
      );
      // update convo preview
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
      // emit socket optionally
      socketCtx?.socket?.emit?.("message:send", {
        to: activeConvo.userId,
        content,
      });
    } catch (e) {
      // rollback on error
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  /* --------------------------------- UI ---------------------------------- */

  return (
    <div className={styles.chatLayout}>
      {/* ----------------------------- Left column ----------------------------- */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarSearch}>
          <div className={styles.searchBox}>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <input
              placeholder="Search for user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.toolbarRow}>
            <div className={styles.sort}>
              <span>Sort</span>
              <button
                className={styles.sortBtn}
                onClick={() =>
                  setSort((s) =>
                    s === "recent" ? "unread" : s === "unread" ? "name" : "recent"
                  )
                }
                title={`Sort: ${sort}`}
              >
                <span className={styles.sortLabel}>
                  {sort === "recent" ? "Recent" : sort === "unread" ? "Unread" : "Name"}
                </span>
                <FontAwesomeIcon icon={faChevronDown} />
              </button>
            </div>

            <button className={styles.addNew}>
              <span>Add New</span>
              <FontAwesomeIcon icon={faPlus} />
            </button>
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

          {(!loading && filteredConvos.length === 0) && (
            <div className={styles.emptySidebar}>No conversations yet</div>
          )}
        </div>
      </aside>

      {/* ---------------------------- Right column ---------------------------- */}
      <section className={styles.thread}>
        {activeConvo ? (
          <>
            {/* Header */}
            <div className={styles.threadHeader}>
              <div className={styles.threadUser}>
                <div className={styles.headerAvatar}>
                  {activeConvo.avatar ? (
                    <img src={activeConvo.avatar} alt={activeConvo.name} />
                  ) : (
                    <span>{initialsOf(activeConvo.name)}</span>
                  )}
                  <span
                    className={styles.headerDot}
                    style={{
                      backgroundColor: activeConvo.online ? "#10b981" : "#9ca3af",
                    }}
                  />
                </div>
                <div>
                  <div className={styles.headerName}>{activeConvo.name}</div>
                  <div className={styles.headerStatus}>
                    <FontAwesomeIcon icon={faCircle} />
                    <span>
                      {activeConvo.online ? "Online" : "Last seen 3 hours ago"}
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
                  <FontAwesomeIcon icon={faEllipsis} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className={styles.messages} ref={listRef}>
              {messages.map((m) => {
                const me = String(m.senderId) === String(user?._id);
                return (
                  <MessageBubble
                    key={m._id}
                    me={me}
                    msg={m}
                    avatar={!me ? activeConvo.avatar : null}
                  />
                );
              })}
            </div>

            {/* Input */}
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
                placeholder="Type your message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
              />

              <button
                className={styles.sendBtn}
                onClick={onSend}
                disabled={sending || text.trim().length === 0}
                title="Send"
              >
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </div>
          </>
        ) : (
          <div className={styles.threadEmpty}>
            Select a conversation to start chatting
          </div>
        )}
      </section>
    </div>
  );
};

export default Chat;
