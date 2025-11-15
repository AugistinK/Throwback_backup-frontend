// src/components/Dashboard/UserDashboard/Chat/ChatArea.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../../../contexts/SocketContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { friendsAPI } from '../../../../utils/api';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import styles from './Chat.module.css';

const ChatArea = ({ conversation, onBack, isOnline }) => {
  const { user } = useAuth();
  const {
    socket,
    sendMessage: socketSendMessage,
    joinConversation,
    markMessagesAsRead
  } = useSocket();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isGroup = !!conversation.isGroup;
  const participant = isGroup ? null : conversation.participant;
  const targetId = isGroup ? conversation._id : participant?._id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const normalizeMessage = (msg) => ({
    id: msg._id,
    sender: msg.sender,
    receiver: msg.receiver,
    content: msg.content,
    type: msg.type,
    created_date: msg.created_date,
    read: msg.read
  });

  const loadMessages = async (pageToLoad = 1) => {
    if (!targetId) return;

    try {
      setLoading(true);
      let response;

      if (isGroup) {
        response = await friendsAPI.getGroupMessages(targetId, pageToLoad, 50);
      } else {
        response = await friendsAPI.getMessages(targetId, pageToLoad, 50);
      }

      if (response.success) {
        const rawMessages =
          response.data?.messages ||
          response.data?.data?.messages ||
          response.data ||
          [];

        const formattedMessages = rawMessages.map(normalizeMessage);

        if (pageToLoad === 1) {
          setMessages(formattedMessages);
        } else {
          setMessages((prev) => [...formattedMessages, ...prev]);
        }

        if (response.data?.pagination) {
          const { page: currentPage, totalPages } = response.data.pagination;
          setHasMore(currentPage < totalPages);
        } else {
          setHasMore(false);
        }

        setPage(pageToLoad);

        if (pageToLoad === 1) {
          setTimeout(scrollToBottom, 100);
        }
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load when conversation changes
  useEffect(() => {
    setMessages([]);
    setPage(1);
    setHasMore(true);

    if (targetId) {
      loadMessages(1);

      if (!isGroup && socket) {
        joinConversation(targetId);
        markMessagesAsRead(targetId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation._id, isGroup, socket]);

  // Socket events only for direct chat
  useEffect(() => {
    if (!socket || isGroup || !participant) return;

    const handleNewMessage = (data) => {
      if (
        data.message.sender._id === participant._id ||
        data.message.receiver._id === participant._id
      ) {
        setMessages((prev) => [
          ...prev,
          normalizeMessage(data.message)
        ]);
        setTimeout(scrollToBottom, 100);
      }
    };

    const handleMessageSent = (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === data.tempId
            ? {
                ...msg,
                id: data.message._id,
                created_date: data.message.created_date
              }
            : msg
        )
      );
    };

    const handleUserTyping = (data) => {
      if (data.userId === participant._id) {
        setIsTyping(data.isTyping);

        if (data.isTyping) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
          }, 3000);
        }
      }
    };

    socket.on('new-message', handleNewMessage);
    socket.on('message-sent', handleMessageSent);
    socket.on('user-typing', handleUserTyping);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message-sent', handleMessageSent);
      socket.off('user-typing', handleUserTyping);
    };
  }, [socket, participant, isGroup]);

  const handleSendMessage = async (content, type = 'text') => {
    if (!content.trim() || !targetId) return;

    const tempId = Date.now();
    const optimisticMessage = {
      id: null,
      tempId,
      sender: user,
      receiver: isGroup ? null : participant,
      content,
      type,
      created_date: new Date().toISOString(),
      read: false
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(scrollToBottom, 100);

    try {
      if (isGroup) {
        const res = await friendsAPI.sendGroupMessage(
          targetId,
          content,
          type
        );

        if (res.success) {
          const msgData =
            res.data?.message ||
            res.data?.data?.message ||
            res.message ||
            null;

          if (msgData) {
            const saved = normalizeMessage(msgData);
            setMessages((prev) =>
              prev.map((m) => (m.tempId === tempId ? saved : m))
            );
          } else {
            // If we don't know the exact shape, just reload latest messages
            loadMessages(1);
          }
        } else {
          setMessages((prev) => prev.filter((m) => m.tempId !== tempId));
        }
      } else {
        await socketSendMessage(targetId, content, type, tempId);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages((prev) => prev.filter((m) => m.tempId !== tempId));
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMessages(page + 1);
    }
  };

  return (
    <div className={styles.chatArea}>
      <ChatHeader
        participant={participant}
        conversation={conversation}
        isOnline={!isGroup && isOnline}
        onBack={onBack}
      />

      <MessageList
        messages={messages}
        currentUser={user}
        isTyping={isTyping}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        participant={participant}
        messagesEndRef={messagesEndRef}
        isGroup={isGroup}
      />

      <MessageInput
        onSendMessage={handleSendMessage}
        receiverId={isGroup ? null : participant?._id}
      />
    </div>
  );
};

export default ChatArea;
