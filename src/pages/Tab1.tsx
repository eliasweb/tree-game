import { IonContent, IonPage } from '@ionic/react';
import OakTreeGame from '../components/OakTreeGame';
import './Tab1.css';

const Tab1: React.FC = () => {
  return (
    <IonPage>
      <IonContent fullscreen className="game-content">
        <OakTreeGame />
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
