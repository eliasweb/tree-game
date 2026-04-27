import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import './Tab3.css';

const Tab3: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonTitle>About</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="about-content">
        <IonHeader collapse="condense">
          <IonToolbar color="success">
            <IonTitle size="large">About</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonCard className="about-card">
          <IonCardHeader>
            <IonCardTitle>Grow Your Oak</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p className="about-text">
              Nurture a tiny acorn into a mighty ancient oak tree! Tap the screen to collect energy and watch your tree grow through six stages of life.
            </p>
          </IonCardContent>
        </IonCard>

        <IonCard className="about-card">
          <IonCardHeader>
            <IonCardTitle>How to Play</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <ul className="how-to-list">
              <li>Tap anywhere on the game screen to collect energy</li>
              <li>Your tree also gains a small amount of energy over time</li>
              <li>Collect enough energy to advance to the next growth stage</li>
              <li>Watch the seasons change and enjoy the animated scenery</li>
            </ul>
          </IonCardContent>
        </IonCard>

        <IonCard className="about-card">
          <IonCardHeader>
            <IonCardTitle>Growth Stages</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="stages-list">
              <div className="stage-row"><span className="stage-emoji">{'\u{1FAD8}'}</span> <strong>Acorn</strong> — Your journey begins</div>
              <div className="stage-row"><span className="stage-emoji">{'\u{1F33F}'}</span> <strong>Sprout</strong> — 10 energy</div>
              <div className="stage-row"><span className="stage-emoji">{'\u{1F331}'}</span> <strong>Sapling</strong> — 30 energy</div>
              <div className="stage-row"><span className="stage-emoji">{'\u{1F332}'}</span> <strong>Young Tree</strong> — 60 energy</div>
              <div className="stage-row"><span className="stage-emoji">{'\u{1F333}'}</span> <strong>Mature Oak</strong> — 100 energy</div>
              <div className="stage-row"><span className="stage-emoji">{'\u{1F3C6}'}</span> <strong>Ancient Oak</strong> — 150 energy</div>
            </div>
          </IonCardContent>
        </IonCard>

        <IonCard className="about-card">
          <IonCardHeader>
            <IonCardTitle>Seasons</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p className="about-text">
              The seasons cycle automatically every 20 seconds. Each season brings unique visuals — cherry blossoms in spring, lush greens in summer, falling amber leaves in autumn, and gentle snowfall in winter.
            </p>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Tab3;
