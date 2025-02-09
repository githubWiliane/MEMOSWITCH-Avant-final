import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Switch,
  FlatList,
} from 'react-native';

const ESP32_IP = 'http://192.168.4.1'; // Adresse de l'ESP32 en mode point d'accès

const MemoSwitchApp = () => {
  const [lamps, setLamps] = useState([
    { id: '1', name: 'Lampe 1', state: false, pin: 5 },
    { id: '2', name: 'Lampe 2', state: false, pin: 15 },
    { id: '3', name: 'Lampe 3', state: false, pin: 27 },
    { id: '4', name: 'Lampe 4', state: false, pin: 12 },
    { id: '5', name: 'Lampe 5', state: false, pin: 13 },
  ]);

  const toggleLamp = async (id, pin) => {
    setLamps((prevLamps) =>
      prevLamps.map((lamp) =>
        lamp.id === id ? { ...lamp, state: !lamp.state } : lamp
      )
    );

    try {
      await fetch(`${ESP32_IP}/toggle?pin=${pin}`, { method: 'GET' });
    } catch (error) {
      console.error('Erreur lors de la communication avec :', error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.lampRow}>
      <Text style={styles.lampName}>{item.name}</Text>
      <Switch
        value={item.state}
        onValueChange={() => toggleLamp(item.id, item.pin)}
        thumbColor={item.state ? '#28A745' : '#ccc'}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Memo Switch</Text>
      <FlatList data={lamps} keyExtractor={(item) => item.id} renderItem={renderItem} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#002A37', padding: 20 },
  header: { color: '#fff', fontSize: 30, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  lampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#004D5B',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
  },
  lampName: { color: '#fff', fontSize: 18 },
});

export default MemoSwitchApp;
