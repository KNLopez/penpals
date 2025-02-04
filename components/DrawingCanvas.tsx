import React, { useEffect, useState } from "react";
import { PanResponder, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

interface Drawing {
  type: "path";
  data: string;
}

interface Position {
  x: number;
  y: number;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({}) => {
  const [drawings, setDrawings] = useState([]);
  const [currentPath, setCurrentPath] = useState("");
  const [localCursor, setLocalCursor] = useState<Position>({ x: 0, y: 0 });
  const [cursors, setCursors] = useState<Record<string, Position>>({});
  const [socketId, setSocketId] = useState<string>("");
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
      handleAddDrawing({ type: "path", data: currentPath });
    },
    onPanResponderRelease: () => {
      setCurrentPath("");
    },
  });

  const handleAddDrawing = (drawing) => {
    // Send new drawing to the server
    socket.emit("add-drawing", drawing);
  };

  useEffect(() => {
    setSocketId(socket.id);

    socket.on("initial-drawings", (initialDrawings) => {
      setDrawings(initialDrawings);
    });

    // Listen for new drawings from other users
    socket.on("new-drawing", (newDrawing) => {
      setDrawings((prev) => [...prev, newDrawing]);
    });

    socket.on("update-cursors", (updatedCursors: Record<string, Position>) => {
      const otherCursors = Object.fromEntries(
        Object.entries(updatedCursors).filter(([id]) => id !== socket.id)
      );
      setCursors(otherCursors);
    });

    return () => {
      socket.off("update-cursors");
    };
  }, []);

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <Svg style={{ flex: 1 }}>
        {drawings.map((drawing: Drawing, index: number) => {
          if (drawing.type === "path") {
            return (
              <Path key={index} d={drawing.data} stroke="black" fill="none" />
            );
          }
          // Add support for other shapes (e.g., circles, rectangles)
          return null;
        })}
        {currentPath && <Path d={currentPath} stroke="black" fill="none" />}
        {Object.entries(cursors).map(
          ([userId, position]: [string, Position]) => (
            <Circle
              key={userId}
              cx={position.x}
              cy={position.y}
              r={10}
              fill="red"
            />
          )
        )}
        <Circle cx={localCursor.x} cy={localCursor.y} r={10} fill="blue" />
      </Svg>
    </View>
  );
};

export default DrawingCanvas;
