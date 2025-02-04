import React, { useState } from "react";
import { PanResponder, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const DrawingCanvas = ({ drawings, onAddDrawing }) => {
  const [currentPath, setCurrentPath] = useState("");

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event, gestureState) => {
      const { x0, y0 } = gestureState;
      setCurrentPath(`M${x0},${y0}`);
    },
    onPanResponderMove: (event, gestureState) => {
      const { moveX, moveY } = gestureState;
      setCurrentPath((prev) => `${prev} L${moveX},${moveY}`);
    },
    onPanResponderRelease: () => {
      onAddDrawing({ type: "path", data: currentPath });
      setCurrentPath("");
    },
  });

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <Svg style={{ flex: 1 }}>
        {drawings.map((drawing, index) => {
          if (drawing.type === "path") {
            return (
              <Path key={index} d={drawing.data} stroke="black" fill="none" />
            );
          }
          // Add support for other shapes (e.g., circles, rectangles)
          return null;
        })}
        {currentPath && <Path d={currentPath} stroke="black" fill="none" />}
      </Svg>
    </View>
  );
};

export default DrawingCanvas;
