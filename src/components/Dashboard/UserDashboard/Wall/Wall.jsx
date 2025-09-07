import React, { useEffect, useState, useRef } from 'react';
import wallAPI from '../../../utils/wallAPI';
import styles from './wall.module.css';
import { useAuth } from '../../../../contexts/AuthContext';

const NewPost = ({ onCreated }) => {
  const [text,setText] = useState('');
  const [files,setFiles] = useState([]);
  const [loading,setLoading] = useState(false);

  const onSelect = (e) => setFiles(Array.from(e.target.files || []));
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && files.length===0) return;
    setLoading(true);
    try {
      await wallAPI.createPost({ text, visibility:'public' }, files);
      setText(''); setFiles([]);
      onCreated?.();
    } finally { setLoading(false); }
  };

  return (
    <form className={styles.newPost} onSubmit={onSubmit}>
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Share a nostalgic moment... #90s #RnB" />
      <div className={styles.actions}>
        <input type="file" multiple accept="image/*,video/*" onChange={onSelect} />
        <button disabled={loading}>{loading ? 'Posting…' : 'Post'}</button>
      </div>
    </form>
  );
};

const PostCard = ({ post, onReact }) => {
  const [busy,setBusy] = useState(false);
  const react = async (type='nostalgic') => {
    setBusy(true);
    try { await onReact(type); } finally { setBusy(false); }
  };
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <img src={post.user?.avatar || 'https://via.placeholder.com/32'} alt="" />
        <div>
          <div className={styles.name}>{post.user?.prenom} {post.user?.nom}</div>
          <div className={styles.meta}>{new Date(post.createdAt).toLocaleString()}</div>
        </div>
      </div>
      {post.text && <p className={styles.text}>{post.text}</p>}
      {post.media?.length>0 && (
        <div className={styles.mediaGrid}>
          {post.media.map((m,i)=> m.type==='image'
            ? <img key={i} src={m.url} alt="" />
            : <video key={i} src={m.url} controls />
          )}
        </div>
      )}
      <div className={styles.footer}>
        <button disabled={busy} onClick={()=>react('nostalgic')}>💽 Nostalgic ({post.reactionsCount||0})</button>
      </div>
    </div>
  );
};

export default function Wall() {
  const [feed,setFeed] = useState([]);
  const [page,setPage] = useState(1);
  const [loading,setLoading] = useState(false);

  const load = async (reset=false) => {
    setLoading(true);
    try {
      const r = await wallAPI.getFeed({ page: reset?1:page, limit: 10 });
      const rows = r?.data || [];
      setFeed(prev => reset ? rows : [...prev, ...rows]);
      setPage(p => reset ? 2 : p+1);
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(true); }, []);

  return (
    <div className={styles.wrap}>
      <NewPost onCreated={()=>load(true)} />
      {feed.map(p => (
        <PostCard
          key={p._id}
          post={p}
          onReact={(type)=> wallAPI.react(p._id, type).then(({data})=>{
            setFeed(prev => prev.map(x=> x._id===p._id ? { ...x, ...data } : x));
          })}
        />
      ))}
      <div className={styles.more}>
        <button disabled={loading} onClick={()=>load(false)}>{loading ? 'Loading…' : 'Load more'}</button>
      </div>
    </div>
  );
}
