import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { View } from 'react-native';
import Welcome from './src/screens/Welcome';
import ConnectWallet from './src/screens/connectWallet';
import Main from './src/screens/Main';
import { AccountsProvider, useAccounts } from './src/state/accounts';
import { WalletProvider } from './src/state/wallet';
import { navigationRef } from './src/navigation';

const Stack = createNativeStackNavigator();

// Waits for saved accounts to load so returning users land straight on their wallet.
function Root() {
  const { ready, active } = useAccounts();
  if (!ready) return <View style={{ flex: 1, backgroundColor: '#F4F4EF' }} />;
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={active ? 'Main' : 'Welcome'}
        screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={Welcome} />
        <Stack.Screen name="Main" component={Main} />
        <Stack.Screen
          name="ConnectWallet"
          component={ConnectWallet}
          options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <AccountsProvider>
        <WalletProvider>
          <Root />
        </WalletProvider>
      </AccountsProvider>
    </SafeAreaProvider>
  );
}

export default App;
