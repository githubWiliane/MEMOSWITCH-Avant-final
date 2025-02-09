// App.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Switch, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ESP32_IP = "http://192.168.4.1";  // Adresse IP du point d'accès ESP32

export default function MemoSwitchApp() {
  const [lamps, setLamps] = useState([
    { id: '1', name: 'Lampe 1', state: false, duration: 0, startTime: null },
    { id: '2', name: 'Lampe 2', state: false, duration: 0, startTime: null },
    { id: '3', name: 'Lampe 3', state: false, duration: 0, startTime: null },
    { id: '4', name: 'Lampe 4', state: false, duration: 0, startTime: null },
    { id: '5', name: 'Lampe 5', state: false, duration: 0, startTime: null },
  ]);

  // Charger l'état des lampes depuis AsyncStorage
  useEffect(() => {
    const loadLamps = async () => {
      try {
        const savedLamps = await AsyncStorage.getItem('lamps');
        if (savedLamps) {
          setLamps(JSON.parse(savedLamps));
        }
      } catch (error) {
        console.error('Erreur de chargement des lampes:', error);
      }
    };
    loadLamps();
  }, []);

  // Sauvegarder les données à chaque modification
  useEffect(() => {
    const saveLamps = async () => {
      try {
        await AsyncStorage.setItem('lamps', JSON.stringify(lamps));
      } catch (error) {
        console.error('Erreur de sauvegarde:', error);
      }
    };
    saveLamps();
  }, [lamps]);

  // Envoyer la commande à l'ESP32
  const sendCommandToESP32 = async (id, newState) => {
    try {
      const response = await fetch(`${ESP32_IP}/switch?id=${id}&state=${newState ? 1 : 0}`);
      if (!response.ok) throw new Error('Réponse invalide de l’ESP32');
    } catch (error) {
      Alert.alert("Erreur", "Impossible de communiquer avec l'ESP32. Vérifiez la connexion Wi-Fi.");
      console.error("Erreur de connexion ESP32:", error);
    }
  };

  // Activer/Désactiver une lampe
  const toggleLamp = async (id) => {
    setLamps((prevLamps) =>
      prevLamps.map((lamp) => {
        if (lamp.id === id) {
          const newState = !lamp.state;
          sendCommandToESP32(id, newState); // Envoi de la commande ESP32
          const currentTime = Date.now();

          if (newState) {
            return { ...lamp, state: newState, startTime: currentTime };
          } else {
            const elapsedTime = lamp.startTime ? (currentTime - lamp.startTime) / 60000 : 0;
            return { ...lamp, state: newState, duration: lamp.duration + elapsedTime, startTime: null };
          }
        }
        return lamp;
      })
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.lampRow}>
      <Text style={styles.lampName}>{item.name}</Text>
      <Switch
        value={item.state}
        onValueChange={() => toggleLamp(item.id)}
        thumbColor={item.state ? '#007ACC' : '#ccc'}
      />
      <Text style={styles.lampDuration}>{item.duration.toFixed(2)} min</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Memo Switch</Text>
      <FlatList
        data={lamps}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002A37',
    padding: 20,
  },
  header: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  lampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#004D5B',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
  },
  lampName: {
    color: '#fff',
    fontSize: 18,
  },
  lampDuration: {
    color: '#fff',
    fontSize: 16,
  },
});
