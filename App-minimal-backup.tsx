import React from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const App: React.FC = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <StatusBar style="auto" />
      <Text>Minimal App Test</Text>
    </View>
  );
};

export default App;