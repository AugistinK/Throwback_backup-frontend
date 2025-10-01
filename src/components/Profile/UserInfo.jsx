// src/components/Profile/UserInfo.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import styles from './userInfo.module.css';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default function UserInfo({ onBack }) {
  const { user, setUser } = useAuth();
  const isMounted = useRef(true);

  // Champs texte du profil
  const [formData, setFormData] = useState({});

  // Photos (valeurs affichées)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(null); // UI conservée, upload désactivé pour l’instant

  // Fichiers en attente (non uploadés)
  const [pendingProfileFile, setPendingProfileFile] = useState(null);
  const [pendingCoverFile, setPendingCoverFile] = useState(null); // (désactivé)

  // Aperçus locaux
  const [profilePreview, setProfilePreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');

  // UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Base backend (trim + sans slash final)
  const baseUrl = (process.env.REACT_APP_API_URL || 'https://throwback-backup-backend.onrender.com')
    .trim()
    .replace(/\/+$/, '');

  /** Construit une URL absolue à partir d’un chemin ou endpoint */
  const toAbsoluteUrl = (path) => {
    if (!path) return null;
    if (String(path).startsWith('http')) return path;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${normalized}`.replace(/\s+/g, '');
  };

  /** URL à utiliser pour l’avatar (si pas de champ direct) */
  const fallbackAvatarUrl = (u) => {
    const uid = u?._id || u?.id;
    return uid ? `${baseUrl}/api/users/${uid}/photo` : '/images/default-avatar.png';
  };

  // Sync context + localStorage
  const syncUserData = (updated) => {
    setUser(prev => ({ ...prev, ...updated }));
    try {
      const current = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...current, ...updated }));
    } catch {}
  };

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Initialisation depuis le user
  useEffect(() => {
    if (!user?.id && !user?._id) {
      setLoading(false);
      return;
    }
    const dd = user?.date_naissance ? new Date(user.date_naissance).toISOString().split('T')[0] : '';
    setFormData({
      nom: user?.nom || '',
      prenom: user?.prenom || '',
      email: user?.email || '',
      profession: user?.profession || '',
      telephone: user?.telephone || '',
      date_naissance: dd,
      genre: (user?.genre || 'HOMME').toUpperCase(),
      pays: user?.pays || '',
      ville: user?.ville || '',
      adresse: user?.adresse || '',
      code_postal: user?.code_postal || '',
      bio: user?.bio || ''
    });

    // Priorité au nouveau champ URL renvoyé par l’API, sinon fallback endpoint
    const initialAvatar =
      user?.photo_profil_url
        ? toAbsoluteUrl(user.photo_profil_url)
        : fallbackAvatarUrl(user);

    setProfilePhotoUrl(initialAvatar);

    // Couverture: on conserve l’affichage existant si présent
    setCoverPhoto(user?.photo_couverture || null);

    setLoading(false);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const onFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };

  // Sélection fichiers → contrôle + preview (pas d’upload ici)
  const chooseProfilePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) return setError('Format non supporté (PNG/JPG/JPEG/GIF/WebP)');
    if (file.size > MAX_FILE_SIZE) return setError('Fichier trop volumineux (max 5MB)');
    setError('');
    setPendingProfileFile(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const chooseCoverPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) return setError('Format non supporté (PNG/JPG/JPEG/GIF/WebP)');
    if (file.size > MAX_FILE_SIZE) return setError('Fichier trop volumineux (max 5MB)');
    setError('');
    setPendingCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  // Upload d’une photo (réutilisé dans handleSubmit)
  const uploadOnePhoto = async (file, endpoint) => {
    const fd = new FormData();
    fd.append('photo', file);
    const res = await api.post(endpoint, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true
    });
    if (!res?.data?.success) throw new Error(res?.data?.message || 'Upload échoué');
    return res.data.data; // user mis à jour (avec photo_profil_url)
  };

  // Save = uploader d’abord les photos en attente, puis PUT des champs texte
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // 1) Upload avatar si en attente
      if (pendingProfileFile) {
        const updated = await uploadOnePhoto(pendingProfileFile, '/api/users/profile/photo');
        // L’API renvoie maintenant `photo_profil_url`
        const url = updated?.photo_profil_url
          ? toAbsoluteUrl(updated.photo_profil_url)
          : fallbackAvatarUrl(updated);

        setProfilePhotoUrl(url);
        syncUserData({ photo_profil_url: url }); // maj contexte + localStorage
        setPendingProfileFile(null);
      }

      // 2) (Couverture désactivée tant que le backend n’est pas en place)
      if (pendingCoverFile) {
        // TODO: activer quand /api/users/profile/cover sera prêt (GridFS ou buffer)
        // const updated = await uploadOnePhoto(pendingCoverFile, '/api/users/profile/cover');
        // setCoverPhoto(updated.photo_couverture);
        // syncUserData({ photo_couverture: updated.photo_couverture });
        setPendingCoverFile(null);
      }

      // 3) Champs texte
      const allow = ['nom','prenom','bio','date_naissance','genre','pays','ville','adresse','code_postal','telephone','profession'];
      const payload = {};
      allow.forEach(k => {
        const v = formData[k];
        if (v !== undefined && v !== null && v !== '') payload[k] = k === 'genre' ? String(v).toUpperCase() : v;
      });
      const resp = await api.put('/api/users/profile', payload);
      if (resp?.data?.success) {
        // l’API peut renvoyer data avec/ sans photo_profil_url, on préserve l’avatar courant
        const merged = { ...resp.data.data };
        if (!merged.photo_profil_url && profilePhotoUrl) merged.photo_profil_url = profilePhotoUrl;
        syncUserData(merged);
        setSuccess('Profil mis à jour ✔️');
      } else {
        setError(resp?.data?.message || 'Réponse serveur invalide');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Erreur, réessaye.');
    } finally {
      if (isMounted.current) setSaving(false);
    }
  };

  if (loading) return <div>Loading…</div>;
  if (!user?.id && !user?._id) { onBack?.(); return null; }

  return (
    <div className={styles.user_info_container}>
      <button onClick={onBack} className={styles.back_button}>← Retour</button>
      {error   && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      {/* Photos (aperçu local prioritaire) */}
      <div className={styles.photo_section}>
        <div className={styles.photo_upload}>
          <input
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            id="profile-photo"
            style={{ display: 'none' }}
            onChange={chooseProfilePhoto}
          />
          <label htmlFor="profile-photo" className={styles.upload_button}>
            {profilePreview
              ? <img src={profilePreview} alt="Preview" className={styles.profile_photo} />
              : profilePhotoUrl
                ? <img src={profilePhotoUrl} alt="Profil" className={styles.profile_photo} />
                : <div className={styles.profile_photo_placeholder}>+</div>
            }
          </label>
        </div>

        <div className={styles.photo_upload}>
          <input
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            id="cover-photo"
            style={{ display: 'none' }}
            onChange={chooseCoverPhoto}
            disabled
          />
          <label htmlFor="cover-photo" className={styles.upload_button} style={{ opacity: 0.6, cursor: 'not-allowed' }} title="À venir">
            {coverPreview
              ? <img src={coverPreview} alt="Preview" className={styles.cover_photo} />
              : coverPhoto
                ? <img src={toAbsoluteUrl(coverPhoto)} alt="Cover" className={styles.cover_photo} />
                : <div className={styles.cover_photo_placeholder}>Cover (soon)</div>
            }
          </label>
        </div>
      </div>

      {/* Formulaire texte */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.form_grid}>
          <label>
            First Name
            <input name="prenom" value={formData.prenom} onChange={onFieldChange} />
          </label>
          <label>
            Last Name
            <input name="nom" value={formData.nom} onChange={onFieldChange} />
          </label>
          <label>
            Date of Birth
            <input type="date" name="date_naissance" value={formData.date_naissance} onChange={onFieldChange} />
          </label>
          <label>
            Gender
            <select name="genre" value={formData.genre} onChange={onFieldChange}>
              <option value="HOMME">Homme</option>
              <option value="FEMME">Femme</option>
              <option value="AUTRE">Autre</option>
            </select>
          </label>
          {/* Ajoute ici les autres champs (pays, ville, …) si tu veux les afficher */}
        </div>

        <button type="submit" disabled={saving} className={styles.submit_button}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
