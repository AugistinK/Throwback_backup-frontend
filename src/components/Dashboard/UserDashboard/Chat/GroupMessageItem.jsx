// src/components/Dashboard/UserDashboard/Chat/GroupMessageItem.jsx
import React from 'react';
import MessageItem from './MessageItem';

/**
 * Message pour les conversations de groupe.
 * On s’appuie sur MessageItem mais on force le mode "group"
 * et on n’a pas besoin de passer de participant (on utilise message.sender).
 */
const GroupMessageItem = ({
  message,
  isOwn,
  showAvatar,
  currentUser
}) => {
  return (
    <MessageItem
      message={message}
      isOwn={isOwn}
      showAvatar={showAvatar}
      participant={null}
      currentUser={currentUser}
      isGroup={true}
    />
  );
};

export default GroupMessageItem;
