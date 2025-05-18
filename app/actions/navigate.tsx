import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Switch } from "react-native";
import helpers from "./helper";
import { Device } from "react-native-ble-plx";

type Props = {
  connectedDevice: Device | null;
};

const NavigationControl = ({ connectedDevice }: Props) => {
  const [meters, setMeters] = useState("100");
  const [isReRouting, setIsReRouting] = useState(false);

  const handleCommand = async (direction: "L" | "R" | "F") => {
    const metersValue = parseInt(meters, 10);
    if (isNaN(metersValue)) return alert("Invalid distance");
    if (!connectedDevice) return alert("Device not connected");

    await helpers.sendNavigationCommand(
      connectedDevice,
      direction,
      metersValue,
      isReRouting,
    );
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Navigation Command</Text>

      <TextInput
        placeholder="Meters to turn"
        keyboardType="numeric"
        value={meters}
        onChangeText={setMeters}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 10,
          marginBottom: 10,
          borderRadius: 8,
        }}
      />

      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}
      >
        <Text style={{ marginRight: 10 }}>Re-routing?</Text>
        <Switch value={isReRouting} onValueChange={setIsReRouting} />
      </View>

      {["L", "R", "F"].map((dir) => (
        <TouchableOpacity
          key={dir}
          onPress={() => handleCommand(dir as "L" | "R" | "F")}
          style={{
            backgroundColor: "#007AFF",
            padding: 10,
            marginBottom: 10,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>
            Send {dir === "L" ? "Left" : dir === "R" ? "Right" : "Forward"}{" "}
            Command
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default NavigationControl;
