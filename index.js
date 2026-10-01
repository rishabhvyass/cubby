/**
 * @format
 */

// Wallet connection polyfills must load before anything else.
import 'react-native-get-random-values';
import '@walletconnect/react-native-compat';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
