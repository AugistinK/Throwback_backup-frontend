// components/Common/AvatarInitials.jsx
import React from 'react';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

const getRandomColor = (name) => {
  if (!name) return '#b31217'; // Couleur par défaut ThrowBack

  // Générer une couleur pseudo-aléatoire basée sur le nom
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Palette
  const colors = [
    '#1ABC9C', '#2ECC71', '#3498DB', '#9B59B6', '#34495E',
    '#16A085', '#27AE60', '#2980B9', '#8E44AD', '#2C3E50',
    '#F1C40F', '#E67E22', '#E74C3C', '#ECF0F1', '#95A5A6',
    '#b31217', '#430000', '#91271f', '#7d110e'
  ];

  return colors[Math.abs(hash) % colors.length];
};

const AvatarInitials = ({ user, size = 40, className = '', style = {} }) => {
  const fullName = `${user?.prenom || ''} ${user?.nom || ''}`.trim();
  const initials = getInitials(fullName);
  const bgColor = getRandomColor(fullName);

  return (
    <div
      className={`avatar-initials ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: bgColor,
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: `${size / 2.5}px`,
        userSelect: 'none',
        ...style, // merge du style passé en prop
      }}
    >
      {initials}
    </div>
  );
};

export default AvatarInitials;
