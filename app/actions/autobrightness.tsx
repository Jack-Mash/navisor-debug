import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Device } from "react-native-ble-plx";
import helpers from "./helper";

type Props = {
  connectedDevice: Device | null;
  secureHandshake: boolean;
};

const AutoBrightnessControls = ({
  connectedDevice,
  secureHandshake,
}: Props) => {
  const [autoMode, setAutoMode] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAutoBrightness = async () => {
    if (!connectedDevice) return;
    setLoading(true);
    const result = await helpers.requestAutoBrightnessMode(connectedDevice);
    setAutoMode(result);
    setLoading(false);
  };

  const toggleAutoBrightness = async () => {
    if (!connectedDevice || autoMode === null) return;
    const newValue = !autoMode;
    await helpers.writeAutoBrightnessMode(connectedDevice, newValue);
    setAutoMode(newValue);
  };

  useEffect(() => {
    if (secureHandshake && connectedDevice) fetchAutoBrightness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedDevice, secureHandshake]);

  return (
    <View style={{ marginTop: 20, padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>
        Auto-Brightness:{" "}
        {loading
          ? "Loading..."
          : autoMode !== null
            ? autoMode
              ? "Enabled"
              : "Disabled"
            : "Unknown"}
      </Text>

      <TouchableOpacity
        onPress={toggleAutoBrightness}
        style={{
          backgroundColor: "#34C759",
          padding: 10,
          borderRadius: 8,
        }}
        disabled={autoMode === null}
      >
        <Text style={{ color: "white", textAlign: "center" }}>
          {autoMode ? "Disable Auto-Brightness" : "Enable Auto-Brightness"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default AutoBrightnessControls;
