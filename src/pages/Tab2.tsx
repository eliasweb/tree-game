import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel } from '@ionic/react';
import { useState, useEffect } from 'react';
import './Tab2.css';

const STAGES = ['Acorn', 'Sprout', 'Sapling', 'Young Tree', 'Mature Oak', 'Ancient Oak'];
const STAGE_THRESHOLDS = [0, 10, 30, 60, 100, 150];
const STORAGE_KEY = 'oak_tree_game';

function getStage(energy: number): number {
  for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (energy >= STAGE_THRESHOLDS[i]) return i;
  }
  return 0;
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

const Tab2: React.FC = () => {
  const [stats, setStats] = useState({ energy: 0, totalTaps: 0, startTime: Date.now() });

  useEffect(() => {
    const load = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setStats(JSON.parse(saved));
      } catch {}
    };
    load();
    const interval = setInterval(load, 1000);
    return () => clearInterval(interval);
  }, []);

  const stage = getStage(stats.energy);
  const timePlayed = Date.now() - stats.startTime;
  const nextThreshold = stage < 5 ? STAGE_THRESHOLDS[stage + 1] : null;
  const progress = nextThreshold
    ? ((stats.energy - STAGE_THRESHOLDS[stage]) / (nextThreshold - STAGE_THRESHOLDS[stage])) * 100
    : 100;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonTitle>Stats</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="stats-content">
        <IonHeader collapse="condense">
          <IonToolbar color="success">
            <IonTitle size="large">Stats</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonCard className="stats-card">
          <IonCardHeader>
            <IonCardTitle>Your Oak Tree</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="stage-display">
              <span className="stage-icon">{stage >= 4 ? '\u{1F333}' : stage >= 2 ? '\u{1F331}' : '\u{1FAD8}'}</span>
              <span className="stage-name">{STAGES[stage]}</span>
            </div>
            {nextThreshold && (
              <div className="progress-section">
                <div className="progress-label">
                  Next: {STAGES[stage + 1]} ({Math.floor(stats.energy)}/{nextThreshold})
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
              </div>
            )}
            {stage === 5 && <div className="max-stage">Maximum growth reached!</div>}
          </IonCardContent>
        </IonCard>

        <IonCard className="stats-card">
          <IonCardHeader>
            <IonCardTitle>Statistics</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="full">
              <IonLabel>Energy Collected</IonLabel>
              <IonLabel slot="end" className="stat-value">{Math.floor(stats.energy)}</IonLabel>
            </IonItem>
            <IonItem lines="full">
              <IonLabel>Total Taps</IonLabel>
              <IonLabel slot="end" className="stat-value">{stats.totalTaps}</IonLabel>
            </IonItem>
            <IonItem lines="full">
              <IonLabel>Time Played</IonLabel>
              <IonLabel slot="end" className="stat-value">{formatTime(timePlayed)}</IonLabel>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>Energy per Tap</IonLabel>
              <IonLabel slot="end" className="stat-value">
                {stats.totalTaps > 0 ? (stats.energy / stats.totalTaps).toFixed(1) : '0'}
              </IonLabel>
            </IonItem>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Tab2;
