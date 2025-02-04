import React, { useEffect, useState } from "react";
import { PanResponder, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

const DrawingCanvas = ({ drawings, onAddDrawing }) => {
  const [currentPath, setCurrentPath] = useState("");
  const [localCursor, setLocalCursor] = useState({ x: 0, y: 0 });
  const [cursors, setCursors] = useState({});
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
      const newPosition = { x: moveX, y: moveY };
      setLocalCursor(newPosition);
      socket.emit("move-cursor", newPosition); //
      onAddDrawing({ type: "path", data: currentPath });
    },
    onPanResponderRelease: () => {
      setCurrentPath("");
    },
  });

  useEffect(() => {
    socket.on("update-cursors", (updatedCursors) => {
      setCursors(updatedCursors);
    });

    return () => {
      socket.off("update-cursors");
    };
  }, [socket]);

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
        {Object.entries(cursors).map(([userId, position]) => (
          <Circle
            key={userId}
            cx={position.x}
            cy={position.y}
            r={10}
            fill="red"
          />
        ))}
        <Circle cx={localCursor.x} cy={localCursor.y} r={10} fill="blue" />
      </Svg>
    </View>
  );
};

export default DrawingCanvas;
