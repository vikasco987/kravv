import React from "react";
import { StyleSheet, Text, View } from "react-native";

const InventoryList = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Inventory List Component</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    margin: 10,
  },
  text: {
    fontSize: 16,
    color: "#333",
  },
});

export default InventoryList;
