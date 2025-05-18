import React, { useEffect, useRef, useState } from "react";
import {
  PermissionsAndroid,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BleManager, Device, State, Subscription } from "react-native-ble-plx";
import helpers from "./actions/helper";
import AutoBrightnessControls from "./actions/autobrightness";
import NavigationControl from "./actions/navigate";

export default function Index() {
  const managerRef = useRef(new BleManager());
  const manager = managerRef.current;

  const [isScanning, setIsScanning] = useState(false);
  const [isSecureHandshakeDone, setSecureHandshakeDone] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  const isConnected = connectedDevice !== null;

  const requestPermissions = async () => {
    if (Platform.OS === "android" && Platform.Version >= 23) {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
    }
  };

  const disconnectDevice = async () => {
    if (!connectedDevice) return;
    const connected = await manager.isDeviceConnected(connectedDevice.id);
    if (connected) {
      await manager.cancelDeviceConnection(connectedDevice.id);
    }
    setConnectedDevice(null);
    setIsScanning(false);
  };

  const startScan = () => {
    if (isScanning || isConnected) return;

    setIsScanning(true);
    manager.startDeviceScan(
      null,
      null,
      async (error, device: Device | null) => {
        if (error || !device) return;

        console.log("Found Device:", device.name);

        if (device.name === "NAVisor") {
          manager.stopDeviceScan();
          try {
            await manager.connectToDevice(device.id);
            setConnectedDevice(device);
          } catch (e) {
            console.warn("Connection failed:", e);
          } finally {
            setIsScanning(false);
          }
        }
      },
    );
  };

  useEffect(() => {
    if (!connectedDevice) return;

    const subscription: Subscription = manager.onDeviceDisconnected(
      connectedDevice.id,
      () => {
        console.log("Device disconnected");
        setConnectedDevice(null);
        setSecureHandshakeDone(false);
        startScan();
      },
    );

    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedDevice]);

  useEffect(() => {
    requestPermissions();

    const stateListener = manager.onStateChange((state) => {
      console.log("Bluetooth state:", state);
      if (state === State.PoweredOn) {
        startScan();
      }
    }, true);

    return () => {
      stateListener.remove();
      manager.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderSecureActionButton = () => (
    <View style={{ marginTop: 20 }}>
      <TouchableOpacity
        onPress={async () => {
          if (!isSecureHandshakeDone) {
            const handshakeDone =
              await helpers.performSecureHandshake(connectedDevice);
            setSecureHandshakeDone(handshakeDone);
          }
        }}
        style={{
          backgroundColor: "#007AFF",
          padding: 10,
          marginVertical: 5,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center" }}>
          Secure Handshake
        </Text>
      </TouchableOpacity>
    </View>
  );
  const renderActionButtons = () => (
    <View style={{ marginTop: 20 }}>
      <AutoBrightnessControls
        connectedDevice={connectedDevice}
        secureHandshake={isSecureHandshakeDone}
      />

      <Text style={{ fontSize: 18, marginBottom: 10 }}>Set Brightness</Text>
      {[0, 64, 128].map((level) => (
        <TouchableOpacity
          key={level}
          onPress={async () =>
            await helpers.writeBrightnessValue(connectedDevice, level)
          }
          style={{
            backgroundColor: "#007AFF",
            padding: 10,
            marginVertical: 5,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>
            Brightness {level}
          </Text>
        </TouchableOpacity>
      ))}

      <NavigationControl connectedDevice={connectedDevice} />
    </View>
  );

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Text style={{ marginBottom: 10, fontSize: 16 }}>
        {isScanning
          ? "Scanning for devices..."
          : isConnected
            ? "Connected to NAVisor"
            : "Idle"}
      </Text>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={isConnected ? disconnectDevice : startScan}
        style={{
          padding: 12,
          borderRadius: 8,
          backgroundColor: "#007AFF",
          marginBottom: 20,
        }}
      >
        <Text style={{ color: "#fff" }}>
          {isConnected ? "Disconnect Device" : "Scan for Devices"}
        </Text>
      </TouchableOpacity>

      {isConnected && !isSecureHandshakeDone && renderSecureActionButton()}
      {isSecureHandshakeDone && renderActionButtons()}
    </View>
  );
}
