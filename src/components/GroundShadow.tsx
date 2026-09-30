import React from 'react';
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

type GroundShadowProps = {
  style?: StyleProp<ViewStyle>;
  width?: number;
  height?: number;
};

const GroundShadow = ({
  style,
  width = 330,
  height = 34,
}: GroundShadowProps) => {
  return (
    <View
      style={[
        styles.shadow,
        {
          width,
          height,
        },
        style,
      ]}
    />
  );
};

export default GroundShadow;

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 999,
    backgroundColor: 'rgba(10,10,10,0.16)',
  },
});