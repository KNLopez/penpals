import { StyleSheet, View } from "react-native";

import DrawingCanvas from "@/components/DrawingCanvas";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

export default function HomeScreen() {
  const [drawings, setDrawings] = useState([]);

  useEffect(() => {
    // Listen for initial drawings
    socket.on("initial-drawings", (initialDrawings) => {
      setDrawings(initialDrawings);
    });

    // Listen for new drawings from other users
    socket.on("new-drawing", (newDrawing) => {
      setDrawings((prev) => [...prev, newDrawing]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleAddDrawing = (drawing) => {
    // Send new drawing to the server
    socket.emit("add-drawing", drawing);
  };

  return (
    <View style={styles.container}>
      <DrawingCanvas drawings={drawings} onAddDrawing={handleAddDrawing} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
