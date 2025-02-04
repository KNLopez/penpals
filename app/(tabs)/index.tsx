import { StyleSheet, View } from "react-native";

import DrawingCanvas from "@/components/DrawingCanvas";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <DrawingCanvas />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
