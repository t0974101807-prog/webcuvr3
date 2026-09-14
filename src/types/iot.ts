export interface IotDevice {
  id: string;
  name: string;
  mac_address: string;
  ip_address: string;
  location: string;
  device_type: string;
  status: string; // 'online' | 'offline' | 'warning'
  last_seen: string;
  api_key: string;
}

export interface TelemetryData {
  id?: number;
  device_id: string;
  temperature: number;
  humidity: number;
  air_quality: number;
  pressure: number;
  weather_condition: string;
  created_at?: string;
}

export interface AttendanceEvent {
  id: number;
  device_id: string;
  employee_id: string;
  employee_name: string;
  method: string;
  confidence: number;
  snapshot_url: string;
  timestamp: string;
}

export interface AlarmEvent {
  id: string;
  time: string;
  title: string;
  location: string;
  severity: "critical" | "warning" | "resolved";
  status: "active" | "muted" | "resolved";
  details: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  triggerDevice: string;
  triggerParam: string;
  operator: ">" | "<" | "=" | "changes";
  triggerValue: string;
  actionDevice: string;
  actionCommand: string;
  active: boolean;
}

export const ARDUINO_TEMPLATES = {
  esp32_cam: `/* 
 * ESP32-CAM Smart Attendance & Face Recognition Terminal
 * Legal OS ERP IoT Integration Firmware
 */
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "https://your-erp-domain.com/api/iot/attendance";
const char* deviceId = "DEV-ESP32-CAM-01";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected! IP: " + WiFi.localIP().toString());
}

void sendFaceRecognitionEvent(String empId, String empName, float confidence) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", "iot_secret_key_01"); // Security Token registered for this device

    StaticJsonDocument<256> doc;
    doc["device_id"] = deviceId;
    doc["employee_id"] = empId;
    doc["employee_name"] = empName;
    doc["method"] = "face_id";
    doc["confidence"] = confidence;

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);
    Serial.printf("HTTP Response code: %d\\n", httpResponseCode);
    http.end();
  }
}

void loop() {
  // Simulate continuous FaceID detection scan
  delay(10000);
}`,

  weather: `/* 
 * ESP32 / Arduino DHT22 Weather Station & Environment Monitor
 * Legal OS ERP IoT Integration Firmware
 */
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "https://your-erp-domain.com/api/iot/telemetry";

void setup() {
  Serial.begin(115200);
  dht.begin();
  WiFi.begin(ssid, password);
}

void loop() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  if (!isnan(temp) && !isnan(hum) && WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", "iot_secret_key_02"); // Security Token registered for this device

    String json = "{\\"device_id\\":\\"DEV-WEATHER-01\\",\\"temperature\\":" + String(temp) +
                  ",\\"humidity\\":" + String(hum) + ",\\"weather_condition\\":\\"Nắng nhẹ\\"}";

    int code = http.POST(json);
    Serial.println("Telemetry sent, HTTP code: " + String(code));
    http.end();
  }
  delay(30000); // Update every 30 seconds
}`,

  rfid: `/* 
 * Arduino RFID RC522 Employee Smart Check-in Reader
 * Legal OS ERP IoT Firmware
 */
#include <SPI.h>
#include <MFRC522.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

#define SS_PIN 15
#define RST_PIN 16

MFRC522 rfid(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;

  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  Serial.println("RFID Card Detected: " + uid);
  // Send check-in payload to ERP API
  delay(2000);
}`
};
