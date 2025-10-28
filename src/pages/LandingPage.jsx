import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const [showFullDisclaimer, setShowFullDisclaimer] = useState(false);

  return (
    <div className={styles.landing_bg}>
      {/* Conteneur vidéo avec éléments par-dessus */}
      <div className={styles.videoContainer}>
        <video 
          className={styles.backgroundVideo}
          autoPlay 
          muted 
          loop 
          playsInline
        >
          <source src="/videos/throwback-intro.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay pour assombrir légèrement la vidéo */}
        <div className={styles.videoOverlay}></div>
        
        {/* Section supérieure - Logo et Slogan */}
        <div className={styles.topSection}>
          <img 
            src="/images/Logo.png" 
            alt="ThrowBack Logo" 
            className={styles.logoImg} 
          />
          
          <h1 className={styles.slogan}>
            Your memories. Your music. Let's connect!
          </h1>
        </div>
        
        {/* Section inférieure - Bouton Get Started */}
        <div className={styles.bottomSection}>
          <button 
            className={styles.getStarted} 
            onClick={() => navigate('/login')}
          >
            Get Started
          </button>
        </div>

        {/* Disclaimer Footer */}
        <div className={styles.disclaimerFooter}>
          <div className={styles.disclaimerBrief}>
            <p>
              Throwback-Connect celebrates classic music for nostalgia and cultural connection.
              <button 
                className={styles.readMoreBtn}
                onClick={() => setShowFullDisclaimer(true)}
              >
                Read our disclaimer & privacy notice
              </button>
            </p>
          </div>
        </div>
        
        {/* Modal pour le disclaimer complet */}
        {showFullDisclaimer && (
          <div className={styles.disclaimerModal}>
            <div className={styles.modalContent}>
              <h3>Public Disclaimer & Privacy Notice</h3>
              <p>
                Throwback-Connect is a free platform celebrating classic music and cultural connection. 
                We share music videos and images for educational, nostalgic, and cultural purposes only. 
                All copyrights remain with their rightful owners — we do not claim or redistribute third-party content.
              </p>
              <p>
                Your privacy matters. Any personal information you share is kept secure, never sold, 
                and used only to enhance your experience on the site. Throwback-Connect complies with 
                standard data protection practices and respects all applicable privacy laws.
              </p>
              <p>
                Our goal is simple: to connect generations and cultures through the universal language of music.
              </p>
              <button 
                className={styles.closeModalBtn}
                onClick={() => setShowFullDisclaimer(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}