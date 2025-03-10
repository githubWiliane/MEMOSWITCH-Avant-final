import React, { useState, createContext, useContext, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Switch,
  SectionList,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Importation des icônes Ionicons

// Création d'un contexte pour l'historique
const HistoryContext = createContext();

const ESP32_IP = 'http://192.168.4.1';

const MemoSwitchApp = ({ navigation }) => {
  // Initialisation des lampes permanentes avec leur suivi de temps.
  const [lamps, setLamps] = useState([
    { id: '1', name: 'Lampe 1', state: false, pin: 5, permanent: true, activeDuration: 0, inactiveDuration: 0, lastTimestamp: Date.now() },
    { id: '2', name: 'Lampe 2', state: false, pin: 15, permanent: true, activeDuration: 0, inactiveDuration: 0, lastTimestamp: Date.now() },
    { id: '3', name: 'Lampe 3', state: false, pin: 27, permanent: true, activeDuration: 0, inactiveDuration: 0, lastTimestamp: Date.now() },
    { id: '4', name: 'Lampe 4', state: false, pin: 12, permanent: true, activeDuration: 0, inactiveDuration: 0, lastTimestamp: Date.now() },
    { id: '5', name: 'Lampe 5', state: false, pin: 13, permanent: true, activeDuration: 0, inactiveDuration: 0, lastTimestamp: Date.now() },
  ]);

  // Pour disposer d'une référence à l'état actuel des lampes dans les callbacks
  const lampsRef = useRef(lamps);
  useEffect(() => {
    lampsRef.current = lamps;
  }, [lamps]);

  // État pour le nom d'un nouveau switch personnalisé
  const [newSwitchName, setNewSwitchName] = useState('');

  // États pour l'enregistrement des actions et la lecture (play)
  const [isRecording, setIsRecording] = useState(false);
  const [recordedActions, setRecordedActions] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTimeouts, setPlayTimeouts] = useState([]);

  // Récupération de l'historique via le contexte
  const { history, setHistory } = useContext(HistoryContext);

  /**
   * Effectue l'interrogation périodique de l'endpoint /status pour synchroniser l'état physique
   * avec l'interface mobile.
   */
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${ESP32_IP}/status`);
        const data = await response.json();
        // data.relays doit être un tableau d'objets contenant pin et state
        if (data.relays && Array.isArray(data.relays)) {
          setLamps(prevLamps =>
            prevLamps.map(lamp => {
              const relayStatus = data.relays.find(r => r.pin === lamp.pin);
              // Mise à jour de l'état si le relayStatus est trouvé
              if (relayStatus !== undefined) {
                return { ...lamp, state: relayStatus.state };
              }
              return lamp;
            })
          );
        }
      } catch (error) {
        console.error("Erreur lors de l'interrogation du status :", error);
      }
    }, 2000); // Interroge toutes les 2 secondes

    return () => clearInterval(interval);
  }, []);

  /**
   * Bascule l'état d'une lampe (permanente ou personnalisée) en mettant à jour
   * la durée d'activité/inactivité et en enregistrant une entrée dans l'historique.
   */
  const toggleLamp = async (id, pin) => {
    const now = Date.now();
    setLamps((prevLamps) =>
      prevLamps.map((lamp) => {
        if (lamp.id === id) {
          const elapsed = (now - lamp.lastTimestamp) / 60000; // temps écoulé en minutes
          let newHistoryEntry;
          const updatedLamp = { ...lamp, state: !lamp.state, lastTimestamp: now };

          if (lamp.state) {
            updatedLamp.activeDuration = (lamp.activeDuration || 0) + elapsed;
            newHistoryEntry = {
              lamp: lamp.name,
              action: 'OFF',
              duration: elapsed.toFixed(2),
              timestamp: new Date().toLocaleString(),
            };
            if (isRecording) {
              setRecordedActions(prev => [...prev, {
                id: lamp.id,
                pin: lamp.pin,
                lamp: lamp.name,
                action: 'OFF',
                timestamp: now,
              }]);
            }
          } else {
            updatedLamp.inactiveDuration = (lamp.inactiveDuration || 0) + elapsed;
            newHistoryEntry = {
              lamp: lamp.name,
              action: 'ON',
              duration: elapsed.toFixed(2),
              timestamp: new Date().toLocaleString(),
            };
            if (isRecording) {
              setRecordedActions(prev => [...prev, {
                id: lamp.id,
                pin: lamp.pin,
                lamp: lamp.name,
                action: 'ON',
                timestamp: now,
              }]);
            }
          }
          setHistory((prevHistory) => [...prevHistory, newHistoryEntry]);
          return updatedLamp;
        }
        return lamp;
      })
    );

    try {
      await fetch(`${ESP32_IP}/toggle?pin=${pin}`, { method: 'GET' });
    } catch (error) {
      console.error('Erreur lors de la communication avec l’ESP32 :', error);
    }
  };

  /**
   * Fonction qui éteint toutes les lampes en même temps.
   */
  const turnOffAll = async () => {
    const now = Date.now();
    setLamps((prevLamps) =>
      prevLamps.map((lamp) => {
        if (lamp.state) {
          const elapsed = (now - lamp.lastTimestamp) / 60000;
          const updatedLamp = { ...lamp, state: false, lastTimestamp: now };
          updatedLamp.activeDuration = (lamp.activeDuration || 0) + elapsed;
          const newHistoryEntry = {
            lamp: lamp.name,
            action: 'OFF',
            duration: elapsed.toFixed(2),
            timestamp: new Date().toLocaleString(),
          };
          setHistory((prevHistory) => [...prevHistory, newHistoryEntry]);
          if (isRecording) {
            setRecordedActions(prev => [...prev, {
              id: lamp.id,
              pin: lamp.pin,
              lamp: lamp.name,
              action: 'OFF',
              timestamp: now,
            }]);
          }
          fetch(`${ESP32_IP}/toggle?pin=${lamp.pin}`, { method: 'GET' })
            .catch(error => console.error('Erreur lors de la communication avec l’ESP32 :', error));
          return updatedLamp;
        }
        return lamp;
      })
    );
  };

  /**
   * Fonction qui allume toutes les lampes en même temps.
   * Pour chaque lampe qui est éteinte, on met à jour la durée inactive, on crée une entrée d'historique,
   * on envoie la commande d'allumage à l'ESP32 et on met à jour son état.
   */
  const turnOnAll = async () => {
    const now = Date.now();
    setLamps((prevLamps) =>
      prevLamps.map((lamp) => {
        if (!lamp.state) {
          const elapsed = (now - lamp.lastTimestamp) / 60000;
          const updatedLamp = { ...lamp, state: true, lastTimestamp: now };
          updatedLamp.inactiveDuration = (lamp.inactiveDuration || 0) + elapsed;
          const newHistoryEntry = {
            lamp: lamp.name,
            action: 'ON',
            duration: elapsed.toFixed(2),
            timestamp: new Date().toLocaleString(),
          };
          setHistory((prevHistory) => [...prevHistory, newHistoryEntry]);
          if (isRecording) {
            setRecordedActions(prev => [...prev, {
              id: lamp.id,
              pin: lamp.pin,
              lamp: lamp.name,
              action: 'ON',
              timestamp: now,
            }]);
          }
          fetch(`${ESP32_IP}/toggle?pin=${lamp.pin}`, { method: 'GET' })
            .catch(error => console.error('Erreur lors de la communication avec l’ESP32 :', error));
          return updatedLamp;
        }
        return lamp;
      })
    );
  };

  /**
   * Ajoute un nouveau switch personnalisé.
   */
  const addCustomSwitch = () => {
    if (newSwitchName.trim() !== '') {
      const newId = (lamps.length + 1).toString();
      const newLamp = {
        id: newId,
        name: newSwitchName,
        state: false,
        pin: 0,
        permanent: false,
        activeDuration: 0,
        inactiveDuration: 0,
        lastTimestamp: Date.now(),
      };
      setLamps([...lamps, newLamp]);
      setNewSwitchName('');
    }
  };

  /**
   * Supprime un switch personnalisé (les lampes permanentes ne peuvent pas être supprimées).
   */
  const deleteCustomSwitch = (id) => {
    setLamps((prevLamps) =>
      prevLamps.filter((lamp) => lamp.id !== id || lamp.permanent)
    );
  };

  /**
   * Active/désactive l'enregistrement des actions.
   */
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      console.log('Enregistrement arrêté');
    } else {
      setRecordedActions([]);
      setIsRecording(true);
      console.log('Enregistrement démarré');
    }
  };

  /**
   * Démarre ou arrête la lecture des actions enregistrées.
   */
  const playRecording = () => {
    // Si déjà en lecture, on arrête la lecture en annulant tous les timeouts
    if (isPlaying) {
      playTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
      setPlayTimeouts([]);
      setIsPlaying(false);
      console.log('Lecture arrêtée');
      return;
    }
    if (recordedActions.length === 0) {
      console.log('Aucune action enregistrée à rejouer');
      return;
    }
    setIsPlaying(true);
    const startTime = recordedActions[0].timestamp;
    const newTimeouts = [];
    recordedActions.forEach(action => {
      const delay = action.timestamp - startTime;
      const timeoutId = setTimeout(() => {
        // Utiliser la référence pour obtenir l'état actuel des lampes
        const lamp = lampsRef.current.find(l => l.id === action.id);
        if (lamp) {
          if ((action.action === 'ON' && !lamp.state) || (action.action === 'OFF' && lamp.state)) {
            toggleLamp(lamp.id, lamp.pin);
          }
        }
      }, delay);
      newTimeouts.push(timeoutId);
    });
    setPlayTimeouts(newTimeouts);
  };

  // Séparation en deux sections : lampes permanentes et switches personnalisés.
  const permanentLamps = lamps.filter((lamp) => lamp.permanent);
  const customLamps = lamps.filter((lamp) => !lamp.permanent);
  const sections = [
    { title: 'Lampes permanentes', data: permanentLamps },
    { title: 'Lampes ajoutées', data: customLamps },
  ];

  /**
   * Rendu de chaque élément (switch)
   */
  const renderItem = ({ item }) => (
    <View style={styles.lampRow}>
      <Text style={styles.lampName}>{item.name}</Text>
      <View style={styles.switchWrapper}>
        <Text style={[styles.switchLabel, !item.state && styles.activeSwitchLabel]}>OFF</Text>
        <Switch
          value={item.state}
          onValueChange={() => toggleLamp(item.id, item.pin)}
          thumbColor={item.state ? '#28A745' : '#ccc'}
        />
        <Text style={[styles.switchLabel, item.state && styles.activeSwitchLabel]}>ON</Text>
      </View>
      {!item.permanent && (
        <TouchableOpacity
          onPress={() => deleteCustomSwitch(item.id)}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteText}>Supprimer</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  /**
   * Rendu de l'en-tête de chaque section
   */
  const renderSectionHeader = ({ section: { title } }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Memo Switch</Text>
      
      {/* Zone d'ajout d'un nouveau switch personnalisé */}
      <View style={styles.addContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ajouter une lampe"
          placeholderTextColor="#ccc"
          value={newSwitchName}
          onChangeText={setNewSwitchName}
        />
        <TouchableOpacity style={styles.addButton} onPress={addCustomSwitch}>
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>
      
      {/* Boutons pour allumer et éteindre toutes les lampes */}
      <View style={styles.globalControlContainer}>
        <TouchableOpacity style={styles.turnOnButton} onPress={turnOnAll}>
          <Ionicons name="flash" size={30} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.turnOffButton} onPress={turnOffAll}>
          <Ionicons name="power" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Nouveaux boutons Record et Play/Stop */}
      <View style={styles.recordPlayContainer}>
  <TouchableOpacity
    style={[styles.recordButton, isRecording && styles.recording]}
    onPress={toggleRecording}
  >
    <Text style={styles.recordButtonText}>{isRecording ? 'Stop Recording' : 'Record'}</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.playButton} onPress={playRecording}>
    <Text style={styles.playButtonText}>{isPlaying ? 'Stop' : 'Play'}</Text>
  </TouchableOpacity>
</View>
      
      {/* Liste scrollable des lampes réparties en sections */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
      />

      {/* Bouton pour accéder à l'interface Historique */}
      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => navigation.navigate('Historique')}
      >
        <Text style={styles.historyButtonText}>Voir Historique</Text>
      </TouchableOpacity>
    </View>
  );
};

const HistoryScreen = ({ navigation }) => {
  const { history, setHistory } = useContext(HistoryContext);

  /**
   * Vider l'historique
   */
  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Historique</Text>
      
      <TouchableOpacity style={styles.clearHistoryButton} onPress={clearHistory}>
        <Text style={styles.clearHistoryText}>🗑️ Vider l'historique</Text>
      </TouchableOpacity>

      <FlatList
        data={history}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <Text style={styles.historyText}>
              {item.timestamp} – {item.lamp} – {item.action} : {item.duration} min
            </Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Retour</Text>
      </TouchableOpacity>
    </View>
  );
};

const Stack = createStackNavigator();

const App = () => {
  // État global pour l'historique, partagé via le contexte HistoryContext.
  const [history, setHistory] = useState([]);

  return (
    <HistoryContext.Provider value={{ history, setHistory }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="MemoSwitch" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MemoSwitch" component={MemoSwitchApp} />
          <Stack.Screen name="Historique" component={HistoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </HistoryContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002A37',
    padding: 20,
  },
  header: {
    marginTop: 40,
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  addContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#004D5B',
    color: '#fff',
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#007ACC',
    padding: 10,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  globalControlContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  turnOnButton: {
    backgroundColor: '#28A745',
    padding: 10,
    borderRadius: 50,
  },
  turnOffButton: {
    backgroundColor: '#FF6B6B',
    padding: 10,
    borderRadius: 50,
  },
  recordPlayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  recordButton: {
    backgroundColor: '#FFC107',
    padding: 10,
    borderRadius: 10,
    flex: 0.45,
    alignItems: 'center',
  },
  recording: {
    backgroundColor: 'red', // Devient rouge lorsque l'enregistrement est actif
  },
  recordButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  playButton: {
    backgroundColor: '#17A2B8',
    padding: 10,
    borderRadius: 10,
    flex: 0.45,
    alignItems: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  lampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#004D5B',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  lampName: {
    color: '#fff',
    fontSize: 18,
    flex: 1,
  },
  switchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    color: '#ccc',
    fontSize: 14,
    marginHorizontal: 5,
  },
  activeSwitchLabel: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    padding: 5,
    borderRadius: 5,
    marginLeft: 10,
  },
  deleteText: {
    color: '#fff',
    fontSize: 12,
  },
  historyButton: {
    backgroundColor: '#28A745',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  historyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  clearHistoryButton: {
    backgroundColor: '#FF6B6B',
    padding: 10,
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 10,
  },
  clearHistoryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  historyItem: {
    backgroundColor: '#003B46',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
  },
  historyText: {
    color: '#fff',
    fontSize: 16,
  },
  backButton: {
    backgroundColor: '#007ACC',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default App;
