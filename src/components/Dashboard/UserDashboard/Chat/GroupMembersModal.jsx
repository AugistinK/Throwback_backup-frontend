// src/components/Dashboard/UserDashboard/Chat/GroupMembersModal.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown } from '@fortawesome/free-solid-svg-icons';
import styles from './Chat.module.css';

const GroupMembersModal = ({
  isOpen,
  onClose,
  members,
  groupCreator,
  currentUserId,
  getInitials,
  getFriendDisplayName
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          width: '90%',
          maxWidth: '400px',
          maxHeight: '70vh',
          overflowY: 'auto',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>
          Group Members ({members.length})
        </h3>

        {!members || members.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#666' }}>No members</p>
        ) : (
          <div>
            {members.map((member) => {
              const memberId = member._id || member.id;
              const isCreator = memberId === groupCreator;
              const isYou = memberId === currentUserId;

              const name = getFriendDisplayName
                ? getFriendDisplayName(member)
                : `${member.prenom || ''} ${member.nom || ''}`.trim() ||
                  'Member';

              const avatar = member.avatar || member.photo_profil || null;

              return (
                <div
                  key={memberId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#eee',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      fontSize: '16px'
                    }}
                  >
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      getInitials(name)
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>
                      {name}
                      {isYou && (
                        <span style={{ color: '#888', fontWeight: 400 }}>
                          {' '}
                          (You)
                        </span>
                      )}
                    </div>
                    {isCreator && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#b31217',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '2px'
                        }}
                      >
                        <FontAwesomeIcon icon={faCrown} />
                        Group Creator
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: '16px', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#b31217',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupMembersModal;