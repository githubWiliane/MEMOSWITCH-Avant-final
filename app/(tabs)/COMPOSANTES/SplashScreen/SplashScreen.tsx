import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const SplashScreen = ({ navigation }) => {
  setTimeout(() => {
    navigation.replace('Dashboard');
  }, 3000); // Après 3 secondes, aller au Dashboard

  return (
    <View style={styles.container}>
      <Image
        source={require('../SplashScreen/splash.png')}
        style={styles.image}
        resizeMode="contain" // Ajustement pour que l'image reste dans les proportions
      />
      <Text style={styles.title}>AA-PSC-24</Text>
      <Text style={styles.subtitle}>SMART PISCICULTURE</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  image: {
    width: '80%',   // Utilisation de pourcentages pour s'adapter aux écrans
    height: '50%',  // Ajustez selon votre image et vos préférences
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
  },
});

export default SplashScreen;
