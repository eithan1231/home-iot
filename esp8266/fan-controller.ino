#include <ESP8266WiFi.h>

#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>

const char* ssid = "ssid";
const char* ssid_password = "password";

const char* server_ip = "192.168.1.1";
const uint16_t server_port = 3001;

const char* identifier = "lab-fan-controller";

const uint8_t pin_fan = 12;

const char* trait = "lab-fan-controller";

WiFiClient wifiClient;

void setup() {
  Serial.begin(9600);

  pinMode(pin_fan, OUTPUT);
  actionFanSpeed(100);

  WiFi.begin(ssid, ssid_password);
  WiFi.setAutoReconnect(true);
  
  Serial.print("Connecting");
  while(WiFi.status() != WL_CONNECTED) {
    Serial.print('.');
    delay(100);
  }

  Serial.print("local ip: ");
  Serial.println(WiFi.localIP());

  Serial.print("gateway ip: ");
  Serial.println(WiFi.gatewayIP());
}

void loop() {

  if(!wifiClient.connected()) {
    if (!wifiClient.connect(server_ip, server_port)) {
      Serial.println("Failed to open socket");
      delay(1000);
      return;
    }

    sendIdentifier();
    sendTrait();
  }

  if(wifiClient.available()) {
    String data = wifiClient.readStringUntil(';');

    int splitIndex = data.indexOf(':');
    if(splitIndex == -1) {
      return;
    }

    String action = data.substring(0, splitIndex);
    String payload = data.substring(splitIndex + 1);

    Serial.print("action: ");
    Serial.print(action);
    Serial.print(", payload: ");
    Serial.print(payload);
    Serial.println();

    if(action == "fan-speed") {
      actionFanSpeed((float)payload.toInt());
    }
  }

  sendPing();
  
  delay(1000);
}

void sendIdentifier() {
  String payload = "hi:";

  payload += String(identifier);

  payload += ";";

  Serial.println(payload);

  wifiClient.write(payload.c_str());
  wifiClient.flush();
}

void sendTrait() {
  String payload = "trait:" + String(trait) + ";";

  Serial.println(payload);

  wifiClient.write(payload.c_str());
  wifiClient.flush();
}

void sendPing() {
  String payload = "ping:PING;";

  Serial.println(payload);

  wifiClient.write(payload.c_str());
  wifiClient.flush();
}

void actionFanSpeed(float percentage) {
  int writeValue = (percentage / 100.0) * 255.0;

  analogWrite(pin_fan, writeValue);
}