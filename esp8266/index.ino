#include <ESP8266WiFi.h>

#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>

const char* ssid = "ssid";
const char* ssid_password = "password";

const char* server_ip = "192.168.1.1";
const uint16_t server_port = 3001;

const char* identifier = "test";


#define SEALEVELPRESSURE_HPA (1013.25)

Adafruit_BME280 bme;
WiFiClient wifiClient;

void setup() {
  Serial.begin(9600);
  Serial.println(F("BME280 Initialised"));

  bool status = bme.begin(0x76);
  if (!status) {
    Serial.println("Could not find a valid BME280 sensor, check wiring!");
    while (1);
  }

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
  }

  Serial.println("Connected to socket, proceeding.");

  sendTemperaure();

  sendHumidity();

  sendPressure();

  delay(1000);
}

void sendIdentifier() {
  Serial.print("sendIdentifier.");
  Serial.println(identifier);

  String payload = "hi:";

  payload += String(identifier);

  payload += ";";

  wifiClient.write(payload.c_str());
  wifiClient.flush();
}

void sendTemperaure() {
  Serial.println("sendTemperaure.");

  String payload = "temperature:";

  payload += String(bme.readTemperature());

  payload += ";";

  wifiClient.write(payload.c_str());
  wifiClient.flush();
}

void sendHumidity() {
  Serial.println("sendHumidity.");

  String payload = "humidity:";

  payload += String(bme.readHumidity());

  payload += ";";

  wifiClient.write(payload.c_str());
  wifiClient.flush();
}

void sendPressure() {
  Serial.println("sendPressure.");

  String payload = "pressure:";

  payload += String((bme.readPressure() / 100.00F));

  payload += ";";

  wifiClient.write(payload.c_str());
  wifiClient.flush();
}
