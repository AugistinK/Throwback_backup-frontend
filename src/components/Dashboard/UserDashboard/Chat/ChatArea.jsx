// src/components/Dashboard/UserDashboard/Chat/ChatArea.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../../../contexts/SocketContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { friendsAPI } from '../../../../utils/api';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import GroupChatHeader from './GroupChatHeader';
import GroupChatInput from './GroupChatInput';
import GroupMembersModal from './GroupMembersModal';
import GroupAddMembersModal from './GroupAddMembersModal';
import CustomModal from './CustomModal';
import styles from './Chat.module.css';

const ChatArea = ({ conversation, onBack, isOnline, onConversationUpdated }) => {
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
  const [conversationReady, setConversationReady] = useState(false);

  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [friendsToAdd, setFriendsToAdd] = useState([]);

  const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });
  const [leaveGroupModal, setLeaveGroupModal] = useState({ isOpen: false });
  const [deleteGroupModal, setDeleteGroupModal] = useState({ isOpen: false });

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isGroup = !!conversation.isGroup;
  const participant = isGroup ? null : conversation.participant;
  const targetId = isGroup ? conversation._id : participant?._id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const normalizeMessage = (msg) => ({
    id: msg._id || msg.id,
    sender: msg.sender,
    receiver: msg.receiver,
    content: msg.content,
    type: msg.type || 'text',
    created_date:
      msg.created_date || msg.createdAt || msg.created_at || new Date(),
    read: !!msg.read
  });

  const extractMessagesPayload = (response) => {
    if (!response) {
      return { messages: [], pagination: null };
    }

    const payload = response.data || response;

    const messages =
      payload.messages ||
      payload.data?.messages ||
      [];

    const pagination =
      payload.pagination ||
      payload.data?.pagination ||
      null;

    return { messages, pagination };
  };

  const loadMessages = async (pageToLoad = 1) => {
    if (!targetId) return;

    try {
      setLoading(true);
      let response;

      if (isGroup) {
        response = await friendsAPI.getGroupMessages(
          targetId,
          pageToLoad,
          50
        );
      } else {
        response = await friendsAPI.getMessages(
          targetId,
          pageToLoad,
          50
        );
      }

      if (!response || response.success === false) {
        console.warn('Messages request failed:', response?.message);
        if (pageToLoad === 1) {
          setMessages([]);
        }
        setHasMore(false);
        return;
      }

      const { messages: rawMessages, pagination } =
        extractMessagesPayload(response);

      const formattedMessages = rawMessages.map(normalizeMessage);

      if (pageToLoad === 1) {
        setMessages(formattedMessages);
      } else {
        setMessages((prev) => [...formattedMessages, ...prev]);
      }

      if (pagination) {
        setHasMore(pagination.page < pagination.totalPages);
      } else {
        setHasMore(formattedMessages.length === 50);
      }

      setPage(pageToLoad);

      if (pageToLoad === 1) {
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      if (pageToLoad === 1) {
        setMessages([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setConversationReady(true);
    }
  };

  useEffect(() => {
    setMessages([]);
    setPage(1);
    setHasMore(true);
    setConversationReady(false);

    if (targetId) {
      loadMessages(1);

      if (!isGroup && socket) {
        joinConversation(targetId);
        markMessagesAsRead(targetId);
      }
    }
  }, [conversation._id, isGroup, socket]);

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

        if (!res || res.success === false) {
          console.error('Error sending group message:', res?.message);
          setMessages((prev) =>
            prev.filter((m) => m.tempId !== tempId)
          );
          return;
        }

        loadMessages(1);
      } else {
        await socketSendMessage(targetId, content, type, tempId);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages((prev) =>
        prev.filter((m) => m.tempId !== tempId)
      );
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMessages(page + 1);
    }
  };

  const handleViewMembers = () => {
    setShowMembersModal(true);
  };

  const handleAddMembers = async () => {
    try {
      const res = await friendsAPI.getFriends();
      if (res.success && Array.isArray(res.data)) {
        const currentMemberIds = conversation.members.map(m => m._id || m.id);
        const available = res.data.filter(f => !currentMemberIds.includes(f._id));
        setFriendsToAdd(available);
        setShowAddMembersModal(true);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      setErrorModal({
        isOpen: true,
        message: 'Failed to load friends list'
      });
    }
  };

  const handleConfirmAddMembers = async (selectedIds) => {
    try {
      const res = await friendsAPI.addMembersToGroup(targetId, selectedIds);
      if (res.success) {
        setSuccessModal({
          isOpen: true,
          message: 'Members added successfully!'
        });
        setShowAddMembersModal(false);
        onConversationUpdated && onConversationUpdated();
      } else {
        setErrorModal({
          isOpen: true,
          message: res.message || 'Failed to add members'
        });
      }
    } catch (error) {
      console.error('Error adding members:', error);
      setErrorModal({
        isOpen: true,
        message: 'An error occurred while adding members'
      });
    }
  };

  const handleLeaveGroup = () => {
    setLeaveGroupModal({ isOpen: true });
  };

  const confirmLeaveGroup = async () => {
    try {
      const res = await friendsAPI.leaveGroup(targetId);
      if (res.success) {
        setSuccessModal({
          isOpen: true,
          message: 'You left the group successfully'
        });
        setTimeout(() => {
          onBack();
          onConversationUpdated && onConversationUpdated();
        }, 1500);
      } else {
        setErrorModal({
          isOpen: true,
          message: res.message || 'Failed to leave group'
        });
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      setErrorModal({
        isOpen: true,
        message: 'An error occurred while leaving the group'
      });
    }
  };

  const handleDeleteGroup = () => {
    setDeleteGroupModal({ isOpen: true });
  };

  const confirmDeleteGroup = async () => {
    try {
      const res = await friendsAPI.deleteGroup(targetId);
      if (res.success) {
        setSuccessModal({
          isOpen: true,
          message: 'Group deleted successfully'
        });
        setTimeout(() => {
          onBack();
          onConversationUpdated && onConversationUpdated();
        }, 1500);
      } else {
        setErrorModal({
          isOpen: true,
          message: res.message || 'Failed to delete group'
        });
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      setErrorModal({
        isOpen: true,
        message: 'An error occurred while deleting the group'
      });
    }
  };

  const getInitials = (text) => {
    if (!text) return '';
    const parts = text.trim().split(' ');
    return parts
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getFriendDisplayName = (friend) => {
    return `${friend.prenom || ''} ${friend.nom || ''}`.trim() || 'Friend';
  };

  const isCreator = isGroup && conversation.groupCreator === (user?.id || user?._id);

  return (
    <>
      <div className={styles.chatArea}>
        {isGroup ? (
          <GroupChatHeader
            groupName={conversation.name || conversation.groupName || 'Group'}
            memberCount={conversation.members?.length || 0}
            color="#b31217"
            isCreator={isCreator}
            onAddMembers={handleAddMembers}
            onViewMembers={handleViewMembers}
            onLeaveGroup={handleLeaveGroup}
            onDeleteGroup={handleDeleteGroup}
            onClose={onBack}
          />
        ) : (
          <ChatHeader
            participant={participant}
            conversation={conversation}
            isOnline={isOnline}
            onBack={onBack}
          />
        )}

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

        {isGroup ? (
          <GroupChatInput
            onSend={handleSendMessage}
            isConnected={!!socket}
            conversationReady={conversationReady}
          />
        ) : (
          <MessageInput
            onSendMessage={handleSendMessage}
            receiverId={participant?._id}
          />
        )}
      </div>

      {isGroup && (
        <>
          <GroupMembersModal
            isOpen={showMembersModal}
            onClose={() => setShowMembersModal(false)}
            members={conversation.members || []}
            groupCreator={conversation.groupCreator}
            currentUserId={user?.id || user?._id}
            getInitials={getInitials}
            getFriendDisplayName={getFriendDisplayName}
          />

          <GroupAddMembersModal
            isOpen={showAddMembersModal}
            onClose={() => setShowAddMembersModal(false)}
            friendsToAdd={friendsToAdd}
            onConfirm={handleConfirmAddMembers}
            processing={false}
            getFriendDisplayName={getFriendDisplayName}
            getInitials={getInitials}
          />
        </>
      )}

      <CustomModal
        isOpen={leaveGroupModal.isOpen}
        onClose={() => setLeaveGroupModal({ isOpen: false })}
        title="Leave Group"
        message="Are you sure you want to leave this group? You will no longer receive messages from this group."
        onConfirm={confirmLeaveGroup}
        confirmText="Leave"
        cancelText="Cancel"
        isDanger={true}
      />

      <CustomModal
        isOpen={deleteGroupModal.isOpen}
        onClose={() => setDeleteGroupModal({ isOpen: false })}
        title="Delete Group"
        message="Are you sure you want to delete this group? This action cannot be undone and all messages will be lost."
        onConfirm={confirmDeleteGroup}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
      />

      <CustomModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, message: '' })}
        title="Success"
        message={successModal.message}
        type="alert"
        confirmText="OK"
      />

      <CustomModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, message: '' })}
        title="Error"
        message={errorModal.message}
        type="alert"
        confirmText="OK"
        isDanger={true}
      />
    </>
  );
};

export default ChatArea;