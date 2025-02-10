import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Switch,
  SectionList,
  TextInput,
  TouchableOpacity,
} from 'react-native';

const ESP32_IP = 'http://192.168.4.1';

const MemoSwitchApp = () => {
  // Initialisation des lampes permanentes avec la propriété "permanent: true"
  const [lamps, setLamps] = useState([
    { id: '1', name: 'Lampe 1', state: false, pin: 5, permanent: true },
    { id: '2', name: 'Lampe 2', state: false, pin: 15, permanent: true },
    { id: '3', name: 'Lampe 3', state: false, pin: 27, permanent: true },
    { id: '4', name: 'Lampe 4', state: false, pin: 12, permanent: true },
    { id: '5', name: 'Lampe 5', state: false, pin: 13, permanent: true },
  ]);

  // Etat pour le nom du switch personnalisé à ajouter
  const [newSwitchName, setNewSwitchName] = useState('');

  /**
   * Fonction pour basculer l'état d'une lampe (permanente ou personnalisée)
   * @param {string} id - Identifiant de la lampe
   * @param {number} pin - Numéro de pin (ou valeur par défaut pour les switches personnalisés)
   */
  const toggleLamp = async (id, pin) => {
    // Mise à jour locale de l'état de la lampe
    setLamps((prevLamps) =>
      prevLamps.map((lamp) =>
        lamp.id === id ? { ...lamp, state: !lamp.state } : lamp
      )
    );

    try {
      // Appel vers l'ESP32 pour basculer la lampe
      await fetch(`${ESP32_IP}/toggle?pin=${pin}`, { method: 'GET' });
    } catch (error) {
      console.error('Erreur lors de la communication avec l’ESP32 :', error);
    }
  };

  /**
   * Ajoute un nouveau switch personnalisé
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
      };
      setLamps([...lamps, newLamp]);
      setNewSwitchName('');
    }
  };

  /**
   * Supprime un switch personnalisé (les lampes permanentes ne peuvent pas être supprimées)
   * @param {string} id - Identifiant de la lampe à supprimer
   */
  const deleteCustomSwitch = (id) => {
    setLamps((prevLamps) =>
      prevLamps.filter((lamp) => lamp.id !== id || lamp.permanent)
    );
  };

  // Création de deux sections : une pour les lampes permanentes et une pour les switches personnalisés
  const permanentLamps = lamps.filter((lamp) => lamp.permanent);
  const customLamps = lamps.filter((lamp) => !lamp.permanent);

  const sections = [
    { title: 'Lampes permanentes', data: permanentLamps },
    { title: 'Lampes ajouter', data: customLamps },
  ];

  /**
   * Rendu de chaque élément (switch)
   */
  const renderItem = ({ item }) => (
    <View style={styles.lampRow}>
      <Text style={styles.lampName}>{item.name}</Text>
      <Switch
        value={item.state} // État actuel du switch
        onValueChange={() => toggleLamp(item.id, item.pin)} // Action lors du basculement
        thumbColor={item.state ? '#28A745' : '#ccc'}
      />
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
      <Text style={styles.header}>Memo switch</Text>
      
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
      
      {/* SectionList scrollable regroupant les deux sections */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002A37',
    padding: 20,
  },
  header: {
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
});

export default MemoSwitchApp;
