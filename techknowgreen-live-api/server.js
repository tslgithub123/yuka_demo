import express from "express";
import mqtt from "mqtt";
import cors from "cors";

const app = express();
const PORT = 5000;
const allowedOrigins = [
  'http://localhost',
  'http://51.21.144.39',
  'http://yukayantra.com',
  'http://www.yukayantra.com',
  'https://yukayantra.com',
  'https://www.yukayantra.com'
];

console.log("CORS allowed origins:", allowedOrigins); // Log allowed origins

const corsOptions = {
  origin: (origin, callback) => {
    console.log(`CORS request received from origin: ${origin}`); // Log incoming origin
    if (!origin) {
        console.log("No origin provided, allowing."); // Allow requests without origin (e.g., some server-to-server)
        return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `CORS policy violation: Origin ${origin} is not allowed.`;
      console.error(msg); // Log the specific violation
      return callback(new Error(msg), false);
    }
    console.log(`CORS policy: Origin ${origin} is allowed.`);
    return callback(null, true);
  }
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
console.log(`Attempting to connect to MQTT broker: ${mqttBrokerUrl}`); // Log MQTT connection attempt
const client = mqtt.connect(mqttBrokerUrl, mqttOptions);

const TOPICS = ["Techknowgreen ", "Techknowgreen"]; // Note: Trailing space in first topic might be an issue

client.on("connect", () => {
  console.log("✅ Successfully connected to MQTT broker.");
  console.log(`Attempting to subscribe to topics: ${JSON.stringify(TOPICS)}`);
  client.subscribe(TOPICS, (err) => {
    if (err) {
      console.error(`❌ MQTT subscription error: ${err.message}`);
    } else {
      console.log(`✅ Successfully subscribed to topics: ${JSON.stringify(TOPICS)}`);
    }
  });
});

client.on("message", (topic, message) => {
  console.log(`Received message on topic: ${topic}`); // Log received topic
  try {
    const payload = JSON.parse(message.toString());
    console.log(`Parsed payload (first 100 chars): ${JSON.stringify(payload).substring(0, 100)}...`); // Log partial payload

    if (payload.data && Array.isArray(payload.data)) {
      console.log(`Processing ${payload.data.length} data entries.`);
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
        console.log(`Updated data for device: ${devId}`);
      });
    } else {
        console.warn("Received message with no 'data' array or empty 'data' field.");
    }
  } catch (err) {
    console.error(`Error processing MQTT message: ${err.message}`);
    console.error(`Raw message content: ${message.toString()}`); // Log raw message on parse error
  }
});

client.on("error", (err) => {
    console.error(`❌ MQTT Connection Error: ${err.message}`);
    // You might want to add logic here to retry connection or alert someone
});
client.on("close", () => {
    console.warn("MQTT connection closed.");
});
client.on("reconnect", () => {
    console.log("MQTT client is reconnecting...");
});
client.on("offline", () => {
    console.warn("MQTT client is offline.");
});


// Routes
app.get("/api/latest-data", (req, res) => {
  console.log(`GET /api/latest-data requested. Total devices in cache: ${latestData.size}`);
  res.json({
    success: true,
    totalDevices: latestData.size,
    serverTime: new Date().toISOString(),
    data: Array.from(latestData.values()),
  });
});

app.get("/health", (req, res) => {
  const healthStatus = {
    status: "running",
    mqttConnected: client.connected,
    activeDevices: latestData.size,
    uptime: process.uptime(), // Add uptime for better health check
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
  };
  console.log(`GET /health requested. Status: ${JSON.stringify(healthStatus)}`);
  res.json(healthStatus);
});

app.get("/", (req, res) => {
  console.log("GET / requested.");
  res.send(`
    <h1>Techknowgreen Live API Running</h1>
    <p><a href="/api/latest-data">→ Click here for latest sensor data</a></p>
    <p>Active devices: ${latestData.size}</p>
    <p>MQTT Connected: ${client.connected}</p>
  `);
});

// Error handling for Express routes
app.use((err, req, res, next) => {
  console.error(`Express Error: ${err.stack}`);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\nServer listening on port ${PORT} on all interfaces (0.0.0.0).`);
  console.log(`Access the API at: http://<your-ec2-public-ip>:${PORT}`);
  console.log(`Latest data endpoint: http://<your-ec2-public-ip>:${PORT}/api/latest-data\n`);
  console.log(`Health check endpoint: http://<your-ec2-public-ip>:${PORT}/health\n`);
});