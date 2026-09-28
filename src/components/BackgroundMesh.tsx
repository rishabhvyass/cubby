import React from "react";
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

type BackgroundMeshProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  gridSize?: number;
  lineColor?: string;
  lineOpacity?: number;
  backgroundColor?: string;
  lineWidth?: number;
};

export function BackgroundMesh({
  children,
  style,
  gridSize = 24,
  lineColor = "#D9DAD3",
  lineOpacity = 0.4,
  backgroundColor = "#F4F4EF",
  lineWidth = 1,
}: BackgroundMeshProps) {
  const verticalCount = 20;
  const horizontalCount = 40;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
        },
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      >
        {/* Vertical lines */}
        {Array.from({ length: verticalCount }).map((_, index) => (
          <View
            key={`vertical-${index}`}
            style={{
              position: "absolute",
              left: index * gridSize,
              top: 0,
              bottom: 0,
              width: lineWidth,
              backgroundColor: lineColor,
              opacity: lineOpacity,
            }}
          />
        ))}

        {/* Horizontal lines */}
        {Array.from({ length: horizontalCount }).map((_, index) => (
          <View
            key={`horizontal-${index}`}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: index * gridSize,
              height: lineWidth,
              backgroundColor: lineColor,
              opacity: lineOpacity,
            }}
          />
        ))}
      </View>

      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },

  content: {
    flex: 1,
  },
});