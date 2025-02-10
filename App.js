import React, { useState, createContext, useContext } from 'react';
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

  // État pour le nom d'un nouveau switch personnalisé
  const [newSwitchName, setNewSwitchName] = useState('');
  
  // Récupération de l'historique via le contexte
  const { history, setHistory } = useContext(HistoryContext);

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
            // La lampe était allumée : on ajoute le temps à la durée active
            updatedLamp.activeDuration = (lamp.activeDuration || 0) + elapsed;
            newHistoryEntry = {
              lamp: lamp.name,
              action: 'OFF (durée active)',
              duration: elapsed.toFixed(2),
              timestamp: new Date().toLocaleString(),
            };
          } else {
            // La lampe était éteinte : on ajoute le temps à la durée inactive
            updatedLamp.inactiveDuration = (lamp.inactiveDuration || 0) + elapsed;
            newHistoryEntry = {
              lamp: lamp.name,
              action: 'ON (durée inactive)',
              duration: elapsed.toFixed(2),
              timestamp: new Date().toLocaleString(),
            };
          }
          // Mise à jour de l'historique (partagé via le contexte)
          setHistory((prevHistory) => [...prevHistory, newHistoryEntry]);
          return updatedLamp;
        }
        return lamp;
      })
    );

    // Appel à l'ESP32 pour basculer la lampe (fonctionnalité existante)
    try {
      await fetch(`${ESP32_IP}/toggle?pin=${pin}`, { method: 'GET' });
    } catch (error) {
      console.error('Erreur lors de la communication avec l’ESP32 :', error);
    }
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
        pin: 0, // Valeur par défaut pour un switch personnalisé
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
      {/* Conteneur pour le switch et ses labels "OFF" et "ON" */}
      <View style={styles.switchWrapper}>
        <Text style={[styles.switchLabel, !item.state && styles.activeSwitchLabel]}>OFF</Text>
        <Switch
          value={item.state}
          onValueChange={() => toggleLamp(item.id, item.pin)}
          thumbColor={item.state ? '#28A745' : '#ccc'}
        />
        <Text style={[styles.switchLabel, item.state && styles.activeSwitchLabel]}>ON</Text>
      </View>
      {/* Bouton de suppression visible uniquement pour les switches personnalisés */}
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
  // Récupération de l'historique depuis le contexte
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
      
      {/* Bouton avec icône pour vider l'historique */}
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
    marginTop: 40, // Décalage pour que l'en-tête ne soit pas coupé
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
