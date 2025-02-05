import React, { useEffect, useState } from "react";
import { PanResponder, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Socket } from "socket.io-client";

interface Drawing {
  type: "path";
  data: string;
}

interface Position {
  x: number;
  y: number;
}

interface DrawingCanvasProps {
  socket: Socket;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ socket }) => {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [localCursor, setLocalCursor] = useState<Position | null>(null);
  const [cursors, setCursors] = useState<Record<string, Position>>({});

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event, gestureState) => {
      const { x0, y0 } = gestureState;
      setCurrentPath(`M${x0},${y0}`);
      handleCursorMove({ x: x0, y: y0 });
    },
    onPanResponderMove: (event, gestureState) => {
      const { moveX, moveY } = gestureState;
      setCurrentPath((prev) => `${prev} L${moveX},${moveY}`);
      handleCursorMove({ x: moveX, y: moveY });
      handleAddDrawing({ type: "path", data: currentPath });
    },
    onPanResponderRelease: () => {
      setCurrentPath("");
    },
  });

  const handleCursorMove = (newPosition: Position) => {
    setLocalCursor(newPosition);
    socket.emit("move-cursor", newPosition);
  };

  const handleAddDrawing = (drawing: Drawing) => {
    // Send new drawing to the server
    socket.emit("add-drawing", drawing);
  };

  useEffect(() => {
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
      socket.emit("disconnect");
    };
  }, []);

  const otherCursors = Object.fromEntries(
    Object.entries(cursors).filter(([id]) => id !== socket.id)
  );

  console.log(otherCursors, socket.id);

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
        {Object.entries(otherCursors).map(
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
        {localCursor && (
          <Circle cx={localCursor.x} cy={localCursor.y} r={10} fill="blue" />
        )}
      </Svg>
    </View>
  );
};

export default DrawingCanvas;
