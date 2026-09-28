
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Welcome from './src/screens/Welcome';
import { StyleSheet } from 'react-native';
import { ColorLight } from './src/constant/colors/ColorLight';
import { BackgroundMesh } from './src/components/BackgroundMesh';

console.log(Welcome)
function App() {


  return (

    <SafeAreaProvider>



      <BackgroundMesh style={styles.meshContainer}>
        <Welcome />

      </BackgroundMesh>

    </SafeAreaProvider >

  );
}

const styles = StyleSheet.create({
  meshContainer: {
    backgroundColor: ColorLight.bg
  },
})

export default App;
