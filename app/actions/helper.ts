import { Device } from "react-native-ble-plx";
import { Buffer } from "buffer";
const NAVISOR_SERVICE_UUID = "00001000-4E41-5669-736F-722043530000";
const BRIGHTNESS_CHAR_UUID = "00001004-4E41-5669-736F-722043530000";
const NAVIGATION_CHAR_UUID = "00001001-4E41-5669-736F-722043530000";
const AUTOBRIGHTNESS_CHAR_UUID = "00001005-4E41-5669-736F-722043530000";

const performSecureHandshake = async (device: Device | null) => {
  if (!device) return false;

  const CHARACTERISTIC_UUID = "00001007-4E41-5669-736F-722043530000";

  const PRIME = 0xbc8f; // 48271
  const MOD = 0x7fffffff; // 2147483647

  try {
    await device.discoverAllServicesAndCharacteristics();
    const characteristics =
      await device.characteristicsForService(NAVISOR_SERVICE_UUID);

    // Try to find matching characteristic
    const char = characteristics.find(
      (c) => c.uuid.toLowerCase() === CHARACTERISTIC_UUID.toLowerCase(),
    );

    if (!char) {
      console.warn("Characteristic not found");
      return false;
    }

    const readChar = await device.readCharacteristicForService(
      char.serviceUUID,
      char.uuid,
    );

    if (!readChar.value) {
      console.warn("No value received from characteristic.");
      return false;
    }

    // Decode base64 to byte buffer
    const raw = Buffer.from(readChar.value, "base64");
    const readValue = raw.readUInt32BE(0); // Assuming big-endian

    console.log("Read Value:", readValue);

    const newValue = (readValue * PRIME) % MOD;

    const newBuffer = Buffer.alloc(4);
    newBuffer.writeUInt32BE(newValue, 0);
    const base64NewValue = newBuffer.toString("base64");

    await device.writeCharacteristicWithResponseForService(
      char.serviceUUID,
      char.uuid,
      base64NewValue,
    );

    console.log("Secure Handshake complete. Written:", newValue);
    return true;
  } catch (error) {
    console.error("Secure Handshake failed:", error);
    return false;
  }
};

const writeBrightnessValue = async (
  device: Device | null,
  brightness: number,
) => {
  if (!device) return;

  try {
    const buffer = Buffer.alloc(1); // Assuming 1-byte brightness
    buffer.writeUInt8(brightness, 0);
    const base64Value = buffer.toString("base64");

    await device.writeCharacteristicWithResponseForService(
      NAVISOR_SERVICE_UUID,
      BRIGHTNESS_CHAR_UUID,
      base64Value,
    );

    console.log(`Brightness written: ${brightness}`);
  } catch (error) {
    console.error("Failed to write brightness:", error);
  }
};

const requestAutoBrightnessMode = async (
  device: Device | null,
): Promise<boolean | null> => {
  if (!device) return null;

  try {
    const characteristic = await device.readCharacteristicForService(
      NAVISOR_SERVICE_UUID,
      AUTOBRIGHTNESS_CHAR_UUID,
    );
    console.log(characteristic);
    if (!characteristic.value) return null;

    const buffer = Buffer.from(characteristic.value, "base64");
    const mode = buffer.readUInt8(0) === 1;

    console.log(`Auto-brightness read: ${mode}`);
    return mode;
  } catch (error) {
    console.error("Failed to read auto-brightness mode:", error);
    return null;
  }
};

const writeAutoBrightnessMode = async (
  device: Device | null,
  enabled: boolean,
) => {
  if (!device) return;

  try {
    const buffer = Buffer.alloc(1);
    buffer.writeUInt8(enabled ? 1 : 0, 0);
    const base64Value = buffer.toString("base64");

    await device.writeCharacteristicWithResponseForService(
      NAVISOR_SERVICE_UUID,
      AUTOBRIGHTNESS_CHAR_UUID,
      base64Value,
    );

    console.log(`Auto-brightness mode set to: ${enabled}`);
  } catch (error) {
    console.error("Failed to write auto-brightness mode:", error);
  }
};

const sendNavigationCommand = async (
  device: Device | null,
  direction: "L" | "R" | "F",
  metersToTurn: number,
  isReRouting: boolean,
) => {
  if (!device) return;

  let distanceCode = "F"; // default
  if (isReRouting) {
    distanceCode = "Z";
  } else if (metersToTurn < 50) {
    distanceCode = "0";
  } else if (metersToTurn < 151) {
    distanceCode = "1";
  } else if (metersToTurn < 251) {
    distanceCode = "2";
  } else if (metersToTurn < 351) {
    distanceCode = "3";
  }

  const command = `${direction}${distanceCode}`;
  const buffer = Buffer.from(command, "utf-8");
  const base64Value = buffer.toString("base64");

  try {
    await device.writeCharacteristicWithResponseForService(
      NAVISOR_SERVICE_UUID,
      NAVIGATION_CHAR_UUID,
      base64Value,
    );
    console.log(`Navigation command sent: ${command}`);
  } catch (err) {
    console.error("Failed to send navigation command:", err);
  }
};

export default {
  performSecureHandshake,
  writeBrightnessValue,
  requestAutoBrightnessMode,
  writeAutoBrightnessMode,
  sendNavigationCommand,
};
