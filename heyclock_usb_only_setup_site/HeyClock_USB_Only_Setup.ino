#include <Preferences.h>

Preferences prefs;
String inputBuffer = "";

String getValue(String msg, String key) {
  String search = "\"" + key + "\":\"";
  int start = msg.indexOf(search);
  if (start == -1) return "";

  start += search.length();
  int end = msg.indexOf("\"", start);
  if (end == -1) return "";

  return msg.substring(start, end);
}

void sendJson(String json) {
  Serial.println(json);
  Serial.flush();
}

void handleCommand(String msg) {
  if (msg.indexOf("HELLO") >= 0) {
    sendJson("{\"type\":\"HELLO\",\"name\":\"HeyClock\"}");
  }

  if (msg.indexOf("SAVE_SETUP") >= 0) {
    prefs.begin("heyclock", false);
    prefs.putString("deviceName", getValue(msg, "deviceName"));
    prefs.putString("timezone", getValue(msg, "timezone"));
    prefs.putString("language", getValue(msg, "language"));
    prefs.putString("alarmTime", getValue(msg, "alarmTime"));
    prefs.end();

    sendJson("{\"type\":\"SETUP_SAVED\"}");
  }
}

void setup() {
  Serial.begin(115200);
  delay(1500);
  sendJson("{\"type\":\"BOOT\",\"name\":\"HeyClock\"}");
}

void loop() {
  while (Serial.available()) {
    char c = Serial.read();

    if (c == '\n') {
      inputBuffer.trim();

      if (inputBuffer.length() > 0) {
        handleCommand(inputBuffer);
      }

      inputBuffer = "";
    } else {
      inputBuffer += c;
    }
  }

  delay(10);
}
