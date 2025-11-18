// src/components/Dashboard/UserDashboard/Friends/GroupAddMembersModal.jsx
import React, { useState, useEffect } from 'react';

const GroupAddMembersModal = ({
  isOpen,
  onClose,
  friendsToAdd,
  onConfirm,
  processing,
  getFriendDisplayName,
  getInitials
}) => {
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSelect = (friend) => {
    const id = (friend.id || friend._id)?.toString();
    if (!id) return;

    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    if (!selectedIds.length) {
      onClose && onClose();
      return;
    }
    onConfirm && onConfirm(selectedIds);
  };

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
      onClick={() => !processing && onClose && onClose()}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '16px',
          width: '360px',
          maxHeight: '70vh',
          overflowY: 'auto',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>Add members</h3>
        <p style={{ marginBottom: '12px', fontSize: '14px', color: '#555' }}>
          Select friends to add to this group.
        </p>

        {(!friendsToAdd || friendsToAdd.length === 0) ? (
          <p style={{ fontSize: '14px' }}>No available friends to add.</p>
        ) : (
          <div>
            {friendsToAdd.map((f) => {
              const id = (f.id || f._id)?.toString();
              const name = getFriendDisplayName(f);
              const avatar = f.avatar || f.photo_profil || null;

              return (
                <label
                  key={id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 0'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(id)}
                    onChange={() => toggleSelect(f)}
                  />
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '999px',
                      background: '#eee',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      fontSize: '14px'
                    }}
                  >
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      getInitials(name)
                    )}
                  </div>
                  <span style={{ fontSize: '14px' }}>{name}</span>
                </label>
              );
            })}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            marginTop: '16px'
          }}
        >
          <button
            type="button"
            onClick={() => !processing && onClose && onClose()}
            style={{
              padding: '6px 12px',
              borderRadius: '999px',
              border: '1px solid #ddd',
              background: '#fff',
              cursor: processing ? 'not-allowed' : 'pointer'
            }}
            disabled={processing}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              border: 'none',
              background: '#b31217',
              color: '#fff',
              cursor:
                processing || selectedIds.length === 0
                  ? 'not-allowed'
                  : 'pointer',
              opacity:
                processing || selectedIds.length === 0 ? 0.6 : 1
            }}
            disabled={processing || selectedIds.length === 0}
          >
            {processing ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupAddMembersModal;