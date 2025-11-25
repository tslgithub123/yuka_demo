// server.js
import express from "express";
import mqtt from "mqtt";
import cors from "cors";

const app = express();
const PORT = 5000;

// PRODUCTION DOMAINS ONLY (strict)
const PRODUCTION_ORIGINS = [
  'http://51.21.144.39',
  'http://yukayantra.com',
  'http://www.yukayantra.com',
  'https://yukayantra.com',
  'https://www.yukayantra.com'
];

// Smart CORS: Allow ALL localhost + strict production
const corsOptions = {
  origin: (origin, callback) => {
    console.log(`CORS request from origin: ${origin || '(no origin)'}`);

    // Allow requests with no origin (Postman, mobile apps, server scripts)
    if (!origin) {
      console.log("No origin → Allowing (non-browser request)");
      return callback(null, true);
    }

    // Allow ANY localhost or 127.0.0.1 (any port) → perfect for Vite, React, etc.
    if (
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin.startsWith('https://localhost') ||
      origin.startsWith('https://127.0.0.1')
    ) {
      console.log(`Local development origin allowed: ${origin}`);
      return callback(null, true);
    }

    // Production: strict whitelist
    if (PRODUCTION_ORIGINS.includes(origin)) {
      console.log(`Production origin allowed: ${origin}`);
      return callback(null, true);
    }

    // Blocked
    const msg = `CORS blocked: ${origin} is not allowed`;
    console.error(msg);
    return callback(new Error(msg), false);
  },
  credentials: true, // optional: for cookies, auth
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// In-memory store: latest data per device
const latestData = new Map();

// MQTT Connection
const mqttBrokerUrl = "mqtt://mqtt.ambeedata.com:1883";
const mqttOptions = {
  clientId: "techknow_server_" + Math.random().toString(16).substr(2, 8),
  username: "ambee_hw_rw",
  password: "AmbeeH@rdware2022!",
  keepalive: 60,
  reconnectPeriod: 5000,
  clean: true,
};

console.log(`Connecting to MQTT broker: ${mqttBrokerUrl}`);
const client = mqtt.connect(mqttBrokerUrl, mqttOptions);

const TOPICS = ["Techknowgreen ", "Techknowgreen"]; // Keep both for now

client.on("connect", () => {
  console.log("Successfully connected to MQTT broker.");
  client.subscribe(TOPICS, (err) => {
    if (err) {
      console.error(`Subscription error: ${err.message}`);
    } else {
      console.log(`Subscribed to topics: ${TOPICS.join(", ")}`);
    }
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
      });
      console.log(`Updated ${payload.data.length} device(s). Total active: ${latestData.size}`);
    }
  } catch (err) {
    console.error(`MQTT message parse error: ${err.message}`);
    console.error(`Raw: ${message.toString().substring(0, 200)}...`);
  }
});

client.on("error", (err) => console.error(`MQTT Error: ${err.message}`));
client.on("close", () => console.warn("MQTT connection closed"));
client.on("reconnect", () => console.log("MQTT reconnecting..."));
client.on("offline", () => console.warn("MQTT offline"));

// Routes
app.get("/api/latest-data", (req, res) => {
  console.log(`API request: /api/latest-data → ${latestData.size} devices`);
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
    uptime: process.uptime(),
    memoryUsageMB: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
    timestamp: new Date().toISOString()
  });
});

app.get("/", (req, res) => {
  res.send(`
    <h1>Techknowgreen Live API Running</h1>
    <p><a href="/api/latest-data">Latest Sensor Data</a></p>
    <p>Active devices: ${latestData.size} | MQTT: ${client.connected ? 'Connected' : 'Disconnected'}</p>
    <hr>
    <small>Ashoka Buildcon Yuka Yantra Dashboard Backend</small>
  `);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Express Error:", err.message || err);
  res.status(500).json({ success: false, message: "Server Error" });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\nServer running at http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/latest-data`);
  console.log(`Health: http://localhost:${PORT}/health\n`);
});