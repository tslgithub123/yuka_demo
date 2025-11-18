// server.js
import express from "express";
import mqtt from "mqtt";
import cors from "cors";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// In-memory store: latest data per device
const latestData = new Map();

// MQTT Connection
const client = mqtt.connect("mqtt://mqtt.ambeedata.com:1883", {
  clientId: "techknow_server_" + Math.random().toString(16).substr(2, 8),
  username: "ambee_hw_rw",
  password: "AmbeeH@rdware2022!",
  keepalive: 60,
  reconnectPeriod: 5000,
  clean: true,
});

const TOPICS = ["Techknowgreen ", "Techknowgreen"];

client.on("connect", () => {
  console.log("✅ Connected to mqtt.ambeedata.com");
  client.subscribe(TOPICS, (err) => {
    if (!err) console.log("Subscribed to topics:", TOPICS);
  });
});

client.on("message", (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());

    if (payload.data && Array.isArray(payload.data)) {
      payload.data.forEach((sensor) => {
        const devId = sensor.devId || `unknown_${Date.now()}`;

        const normalized = {
          devId,
          receivedAt: new Date().toISOString(),
          ts: sensor.ts || null,
          temp: sensor.temp != null ? Number(sensor.temp) : null,
          hum: sensor.hum != null ? Number(sensor.hum) : null,
          pressure: sensor.pressure != null ? Number(sensor.pressure) : null,
          lat: sensor.lat != null ? Number(sensor.lat) : null,
          lng: sensor.lng != null ? Number(sensor.lng) : null,
          rssi: sensor.rssi || null,

          pm2d5: sensor.pm2d5 != null ? Number(sensor.pm2d5) : null,
          pm10: sensor.pm10 != null ? Number(sensor.pm10) : null,
          aqi: sensor.aqi != null ? parseInt(sensor.aqi) : null,
          pm25_aqi: sensor.pm25_aqi ?? null,
          pm10_aqi: sensor.pm10_aqi ?? null,
          fw_v: sensor.fw_v ?? null,
          T_Tot: sensor.T_Tot ?? null,
          V_Tot: sensor.V_Tot ?? null,

          Volume: sensor.Volume ?? null,
          Totalizer: sensor.Totalizer ?? null,
          ms: sensor.ms ?? null,
          us: sensor.us ?? null,
          PC: sensor.PC ?? null,
        };

        latestData.set(devId, normalized);
        console.log(`Updated → ${devId}`);
      });
    }
  } catch (err) {
    console.error("Parse error:", err.message);
  }
});

client.on("error", (err) => console.error("MQTT Error:", err));

// Routes
app.get("/api/latest-data", (req, res) => {
  res.json({
    success: true,
    totalDevices: latestData.size,
    serverTime: new Date().toISOString(),
    data: Array.from(latestData.values()),
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "running",
    mqttConnected: client.connected,
    activeDevices: latestData.size,
  });
});

app.get("/", (req, res) => {
  res.send(`
    <h1>Techknowgreen Live API Running</h1>
    <p><a href="/api/latest-data">→ Click here for latest sensor data</a></p>
    <p>Active devices: ${latestData.size}</p>
  `);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\nServer live at http://localhost:${PORT}`);
  console.log(`Latest data → http://localhost:${PORT}/api/latest-data\n`);
});