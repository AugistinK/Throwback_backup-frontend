// components/LiveThrowback/LiveStreamScheduler.jsx
import React, { useState } from 'react';
import styles from './LiveThrowback.module.css';

const LiveStreamScheduler = ({ onSchedule, videosSelected, isLoading }) => {
  const [schedulingData, setSchedulingData] = useState({
    title: '',
    description: '',
    startDate: formatDateTimeForInput(addMinutes(new Date(), 30)),
    endDate: formatDateTimeForInput(addHours(new Date(), 3)),
    category: 'MUSIC_PERFORMANCE',
    hostName: 'ThrowBack Host',
    tags: '',
    isPublic: true,
    chatEnabled: true,
    loop: true,
    shuffle: false,
    transitionEffect: 'fade'
  });
  
  const [errors, setErrors] = useState({});
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  function formatDateTimeForInput(date) { return date.toISOString().slice(0, 16); }
  function addHours(date, hours) { const d = new Date(date); d.setHours(d.getHours() + hours); return d; }
  function addMinutes(date, minutes) { const d = new Date(date); d.setMinutes(d.getMinutes() + minutes); return d; }
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'tags') {
      setSchedulingData(prev => ({ ...prev, tags: value || '' }));
    } else {
      setSchedulingData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
    if (errors[name]) {
      setErrors(prev => { const n = {...prev}; delete n[name]; return n; });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    if (!schedulingData.title.trim()) newErrors.title = 'Title is required';
    if (!schedulingData.startDate) newErrors.startDate = 'Start date is required';
    if (!schedulingData.endDate) newErrors.endDate = 'End date is required';
    const start = new Date(schedulingData.startDate);
    const end = new Date(schedulingData.endDate);
    const now = new Date();
    if (start < now) newErrors.startDate = 'Start date must be in the future';
    if (end <= start) newErrors.endDate = 'End date must be after start date';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    if (!validateForm()) return;
    const formattedData = { ...schedulingData, tags: typeof schedulingData.tags === 'string' ? schedulingData.tags : '' };
    onSchedule(formattedData);
  };
  
  const categories = ['MUSIC_PERFORMANCE','TALK_SHOW','Q_AND_A','BEHIND_THE_SCENES','THROWBACK_SPECIAL','OTHER'];
  const transitionEffects = [
    { value: 'none', label: 'None' },
    { value: 'fade', label: 'Fade' },
    { value: 'slide', label: 'Slide' },
    { value: 'zoom', label: 'Zoom' },
    { value: 'flip', label: 'Flip' }
  ];
  
  return (
    <div className={styles.schedulerContainer}>
      <div className={styles.schedulerHeader}>
        <h3>Schedule LiveThrowback</h3>
        {!videosSelected && (
          <div className={styles.warningMessage}>
            <i className="fas fa-exclamation-triangle"></i> Add at least one video before scheduling
          </div>
        )}
      </div>
      
      <div className={styles.schedulingForm}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Title <span className={styles.requiredField}>*</span></label>
          <input
            type="text"
            id="title"
            name="title"
            value={schedulingData.title}
            onChange={handleChange}
            placeholder="Title of your LiveThrowback"
            className={errors.title ? styles.inputError : ''}
          />
          {errors.title && <div className={styles.errorText}>{errors.title}</div>}
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={schedulingData.description}
            onChange={handleChange}
            placeholder="Describe your LiveThrowback..."
            rows={3}
          />
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="startDate">Start date <span className={styles.requiredField}>*</span></label>
            <input
              type="datetime-local"
              id="startDate"
              name="startDate"
              value={schedulingData.startDate}
              onChange={handleChange}
              className={errors.startDate ? styles.inputError : ''}
            />
            {errors.startDate && <div className={styles.errorText}>{errors.startDate}</div>}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="endDate">End date <span className={styles.requiredField}>*</span></label>
            <input
              type="datetime-local"
              id="endDate"
              name="endDate"
              value={schedulingData.endDate}
              onChange={handleChange}
              className={errors.endDate ? styles.inputError : ''}
            />
            {errors.endDate && <div className={styles.errorText}>{errors.endDate}</div>}
          </div>
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="category">Category</label>
            <select id="category" name="category" value={schedulingData.category} onChange={handleChange}>
              {categories.map(category => (<option key={category} value={category}>{category.replace(/_/g, ' ')}</option>))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="hostName">Host name</label>
            <input
              type="text"
              id="hostName"
              name="hostName"
              value={schedulingData.hostName}
              onChange={handleChange}
              placeholder="Host name"
            />
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={schedulingData.tags || ''}
            onChange={handleChange}
            placeholder="music, oldies, 80s, ..."
          />
        </div>
        
        <div className={styles.formCheckboxGroup}>
          <div className={styles.checkboxItem}>
            <input type="checkbox" id="isPublic" name="isPublic" checked={schedulingData.isPublic} onChange={handleChange} />
            <label htmlFor="isPublic">Make public</label>
          </div>
          <div className={styles.checkboxItem}>
            <input type="checkbox" id="chatEnabled" name="chatEnabled" checked={schedulingData.chatEnabled} onChange={handleChange} />
            <label htmlFor="chatEnabled">Enable chat</label>
          </div>
          <div className={styles.checkboxItem}>
            <input type="checkbox" id="loop" name="loop" checked={schedulingData.loop} onChange={handleChange} />
            <label htmlFor="loop">Loop playback</label>
          </div>
        </div>
        
        <div className={styles.advancedSettingsToggle}>
          <button type="button" className={styles.toggleButton} onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}>
            <i className={`fas ${showAdvancedSettings ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
            {showAdvancedSettings ? 'Hide advanced settings' : 'Advanced settings'}
          </button>
        </div>
        
        {showAdvancedSettings && (
          <div className={styles.advancedSettings}>
            <div className={styles.formGroup}>
              <label htmlFor="transitionEffect">Transition effect</label>
              <select id="transitionEffect" name="transitionEffect" value={schedulingData.transitionEffect} onChange={handleChange}>
                {transitionEffects.map(effect => (<option key={effect.value} value={effect.value}>{effect.label}</option>))}
              </select>
            </div>
            <div className={styles.checkboxItem}>
              <input type="checkbox" id="shuffle" name="shuffle" checked={schedulingData.shuffle} onChange={handleChange} />
              <label htmlFor="shuffle">Shuffle playback</label>
            </div>
          </div>
        )}
        
        <div className={styles.formActions}>
          <button className={styles.scheduleButton} onClick={handleSubmit} disabled={isLoading || !videosSelected}>
            {isLoading ? (<><i className="fas fa-spinner fa-spin"></i> Scheduling...</>) : (<><i className="fas fa-calendar-plus"></i> Schedule LiveThrowback</>)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamScheduler;
