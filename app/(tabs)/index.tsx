import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from './COMPOSANTES/SplashScreen/SplashScreen';
import DashboardScreen from './COMPOSANTES/TableauBord/DashboardScreen';
import TemperatureScreen from './COMPOSANTES/TemperatureScreen/TemperatureScreen';
import AlimentationScreen from './COMPOSANTES/AlimentationScreen/AlimentationScreen';
import EnergieScreen from './COMPOSANTES/EnergieScreen/EnergieScreen';
import ODScreen from './COMPOSANTES/ODScreen/ODScreen';
import PhScreen from './COMPOSANTES/PhScreen/PhScreen';
import SaliniteScreen from './COMPOSANTES/SaliniteScreen/SaliniteScreen';
import HumiditeAirScreen from './COMPOSANTES/HumiditeAir/HumiditeAir'
import PressionAtmScreen from './COMPOSANTES/PressionAtmospherique/PressionAtmospherique';
//import TemperatureAirScreen from './COMPOSANTES/TemperatureAir/TemperatureAir';


// Importez les autres écrans ...

const Stack = createStackNavigator();

const App = () => {
  useEffect(() => {
    setTimeout(() => {
      // Simule la durée de l'écran splash
    }, 3000);
  }, []);

  return (
   
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Temperature" component={TemperatureScreen} />
        <Stack.Screen name="PH" component={PhScreen} />
        <Stack.Screen name="Salinité" component={SaliniteScreen}/>
        <Stack.Screen name="Oxygen" component={ODScreen}/>
        <Stack.Screen name="Alimentation" component={AlimentationScreen}/>
        <Stack.Screen name="Energie" component={EnergieScreen}/>
        <Stack.Screen name="Humidité" component={HumiditeAirScreen}/>
        <Stack.Screen name="PressionAtmospherique" component={PressionAtmScreen}/>
     
        {/* Ajoutez d'autres écrans de paramètres */}
     </Stack.Navigator>
    </NavigationContainer>
 
  );
};

export default App;
