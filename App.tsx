
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Welcome from './src/screens/Welcome';
import ConnectWallet from './src/screens/connectWallet';
import Main from './src/screens/Main';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
// import { BackgroundMesh } from './src/components/BackgroundMesh';

const Stack = createNativeStackNavigator();
function App() {
  return (

    <SafeAreaProvider>

      {/* <SafeAreaView> */}



        <NavigationContainer>


          <Stack.Navigator
            initialRouteName="Welcome"
            screenOptions={{
              headerShown: false,
            }}>
            <Stack.Screen
              name="Welcome"
              component={Welcome}
            />
            <Stack.Screen name="Main" component={Main} />
            <Stack.Screen
              name="ConnectWallet"
              component={ConnectWallet}
              options={{
                presentation: 'transparentModal',
                animation: 'slide_from_bottom',
              }}
            />


          </Stack.Navigator>

        </NavigationContainer>

      {/* </SafeAreaView> */}
    </SafeAreaProvider >

  );
}


export default App;
