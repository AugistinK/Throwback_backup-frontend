// src/components/Common/OnlineStatus.jsx
import React from 'react';
import { useSocket } from '../../contexts/SocketContext';
import './OnlineStatus.css';

/**
 * Composant pour afficher le statut en ligne d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} size - Taille du point ('small', 'medium', 'large')
 * @param {boolean} showText - Afficher le texte du statut
 * @param {string} className - Classes CSS additionnelles
 */
const OnlineStatus = ({ 
  userId, 
  size = 'medium', 
  showText = false,
  className = ''
}) => {
  const { isUserOnline } = useSocket();
  const isOnline = isUserOnline(userId);

  const sizeMap = {
    small: '8px',
    medium: '10px',
    large: '14px'
  };

  return (
    <div className={`online-status-wrapper ${className}`}>
      <span 
        className={`online-status-dot ${isOnline ? 'online' : 'offline'}`}
        style={{
          width: sizeMap[size],
          height: sizeMap[size]
        }}
      />
      {showText && (
        <span className="online-status-text">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
};

/**
 * Badge de statut pour les avatars
 */
export const OnlineStatusBadge = ({ userId, position = 'bottom-right' }) => {
  const { isUserOnline } = useSocket();
  const isOnline = isUserOnline(userId);

  const positionStyles = {
    'bottom-right': { bottom: '2px', right: '2px' },
    'bottom-left': { bottom: '2px', left: '2px' },
    'top-right': { top: '2px', right: '2px' },
    'top-left': { top: '2px', left: '2px' }
  };

  return (
    <span 
      className={`online-status-badge ${isOnline ? 'online' : 'offline'}`}
      style={positionStyles[position]}
    />
  );
};

/**
 * Liste des utilisateurs en ligne
 */
export const OnlineUsersList = ({ userIds, showCount = true }) => {
  const { isUserOnline, onlineUsers } = useSocket();

  const onlineCount = userIds.filter(id => isUserOnline(id)).length;
  const totalCount = userIds.length;

  return (
    <div className="online-users-list">
      {showCount && (
        <div className="online-users-count">
          <span className="count-online">{onlineCount}</span>
          <span className="count-divider">/</span>
          <span className="count-total">{totalCount}</span>
          <span className="count-label">online</span>
        </div>
      )}
      <div className="online-users-dots">
        {userIds.slice(0, 5).map(userId => (
          <span 
            key={userId}
            className={`mini-status-dot ${isUserOnline(userId) ? 'online' : 'offline'}`}
            title={isUserOnline(userId) ? 'Online' : 'Offline'}
          />
        ))}
        {userIds.length > 5 && (
          <span className="more-users">+{userIds.length - 5}</span>
        )}
      </div>
    </div>
  );
};

/**
 * Indicateur global dans la navbar
 */
export const GlobalOnlineIndicator = () => {
  const { onlineUsers, isConnected } = useSocket();

  return (
    <div className="global-online-indicator">
      <span 
        className={`connection-dot ${isConnected ? 'connected' : 'disconnected'}`}
      />
      <span className="online-count">{onlineUsers.size} online</span>
    </div>
  );
};

export default OnlineStatus;