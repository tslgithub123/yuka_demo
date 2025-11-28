// server.js — FINAL PROFESSIONAL EDITION + /api/recent-devices (unique, in-memory, permanent)
import express from "express";
import mqtt from "mqtt";
import cors from "cors";
import { createClient } from "redis";
import { MongoClient, ServerApiVersion } from "mongodb";
import axios from "axios";

const app = express();
const PORT = 5000;

// ==================== CONFIG ====================
const MQTT_BROKER = "mqtt://mqtt.ambeedata.com:1883";
const MQTT_OPTIONS = {
  clientId: "yuka_server_" + Math.random().toString(16).slice(2, 8),
  username: "ambee_hw_rw",
  password: "AmbeeH@rdware2022!",
  keepalive: 60,
  reconnectPeriod: 5000,
};

const MONGO_URI = "mongodb://localhost:27017";
const DB_NAME = "yuka_yantra";

// ==================== IN-MEMORY: UNIQUE DEVICES (Permanent) ====================
const recentUniqueDevices = new Map();  // key: devId → value: latest full sensor object

// ==================== CORS ====================
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /localhost|127\.0\.0\.1/.test(origin)) {
      return callback(null, true);
    }
    const allowed = ["yukayantra.com", "51.21.144.39"];
    const isAllowed = allowed.some(d => origin.includes(d));
    return callback(isAllowed ? null : new Error("CORS blocked"), isAllowed);
  },
  credentials: true
}));
app.use(express.json());

// ==================== REDIS (for live dashboard) ====================
const redis = createClient();
await redis.connect();
console.log("Redis connected");

// ==================== MONGODB ====================
const mongo = new MongoClient(MONGO_URI, { serverApi: ServerApiVersion.v1 });
await mongo.connect();
const db = mongo.db(DB_NAME);
console.log("MongoDB connected");

await db.collection("devices").createIndex({ mac: 1 }, { unique: true });
await db.collection("yantra_sites").createIndex({ siteId: 1 }, { unique: true });

// ==================== GEOCODING ====================
const getAddressFromCoords = async (lat, lng) => {
  if (!lat || !lng || lat === 0 || lng === 0) return null;

  const cached = await db.collection("devices").findOne({
    lastLat: { $gte: lat - 0.001, $lte: lat + 0.001 },
    lastLng: { $gte: lng - 0.001, $lte: lng + 0.001 }
  });
  if (cached?.lastAddress) return cached.lastAddress;

  try {
    const { data } = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`,
      { timeout: 7000 }
    );
    const addr = data.display_name.split(",").slice(-6).join(", ").replace(/, India$/, ", India");
    return addr;
  } catch {
    return null;
  }
};

// ==================== MQTT ====================
const mqttClient = mqtt.connect(MQTT_BROKER, MQTT_OPTIONS);

mqttClient.on("connect", () => {
  console.log("MQTT Connected to mqtt.ambeedata.com");
  mqttClient.subscribe(["Techknowgreen ", "Techknowgreen"], (err) => {
    if (!err) console.log("Subscribed to Techknowgreen topics");
  });
});

mqttClient.on("message", async (topic, msg) => {
  const raw = msg.toString().trim();
  if (!raw) return;

  let payload;
  try { payload = JSON.parse(raw); } catch { return; }

  if (!Array.isArray(payload.data)) return;

  let updatedCount = 0;

  for (const s of payload.data) {
    const devId = s.devId?.trim();
    if (!devId) continue;

    const data = {
      devId,
      receivedAt: new Date().toISOString(),
      ts: s.ts || null,
      temp: Number(s.temp ?? NaN) || null,
      hum: Number(s.hum ?? NaN) || null,
      pressure: Number(s.pressure ?? NaN) || null,
      lat: Number(s.lat ?? NaN) || null,
      lng: Number(s.lng ?? NaN) || null,
      rssi: s.rssi || null,
      pm2d5: Number(s.pm2d5 ?? NaN) || null,
      pm10: Number(s.pm10 ?? NaN) || null,
      aqi: parseInt(s.aqi ?? "", 10) || null,
      pm25_aqi: s.pm25_aqi ?? null,
      pm10_aqi: s.pm10_aqi ?? null,
      fw_v: s.fw_v ?? null,
      T_Tot: s.T_Tot ?? null,
      V_Tot: s.V_Tot ?? null,
      Volume: s.Volume ?? null,
      Totalizer: s.Totalizer ?? null,
      ms: s.ms ?? null,
      us: s.us ?? null,
      PC: s.PC ?? null,
    };

    // === 1. Update live dashboard (Redis) ===
    await redis.setEx(devId, 600, JSON.stringify(data));
    updatedCount++;

    // === 2. Update in-memory unique devices (permanent) ===
    recentUniqueDevices.set(devId, data);

    // === 3. Update real address if GPS changed ===
    if (data.lat && data.lng && data.lat !== 0) {
      const doc = await db.collection("devices").findOne({ mac: devId });
      const moved = !doc ||
        Math.abs((doc.lastLat || 0) - data.lat) > 0.001 ||
        Math.abs((doc.lastLng || 0) - data.lng) > 0.001;

      if (moved) {
        const addr = await getAddressFromCoords(data.lat, data.lng);
        if (addr) {
          await db.collection("devices").updateOne(
            { mac: devId },
            { $set: { lastAddress: addr, lastLat: data.lat, lastLng: data.lng, updatedAt: new Date() } },
            { upsert: true }
          );
          console.log(`Location updated: ${devId} → ${addr}`);
        }
      }
    }
  }

  if (updatedCount > 0) {
    console.log(`Updated ${updatedCount} device(s) • Total unique seen: ${recentUniqueDevices.size}`);
  }
});

mqttClient.on("error", (err) => console.error("MQTT Error:", err.message));
mqttClient.on("reconnect", () => console.log("MQTT Reconnecting..."));
mqttClient.on("offline", () => console.warn("MQTT Offline"));

// ==================== NEW API: UNIQUE RECENT DEVICES (In-Memory) ====================
app.get("/api/recent-devices", (req, res) => {
  const devices = Array.from(recentUniqueDevices.values())
    .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)); // newest first

  console.log(`/api/recent-devices → ${devices.length} unique device(s) served`);

  res.json({
    success: true,
    totalUniqueDevices: devices.length,
    generatedAt: new Date().toISOString(),
    devices
  });
});

// ==================== API /api/sites (unchanged) ====================
app.get("/api/sites", async (req, res) => {
  try {
    const sites = await db.collection("yantra_sites").find({}).toArray();
    const keys = await redis.keys("*");
    const live = {};

    if (keys.length > 0) {
      const values = await redis.mGet(keys);
      keys.forEach((key, i) => {
        if (values[i]) {
          try { live[key] = JSON.parse(values[i]); } catch { }
        }
      });
    }

    const addrDocs = await db.collection("devices")
      .find({ mac: { $in: Object.keys(live) } })
      .toArray();
    const addrMap = Object.fromEntries(addrDocs.map(d => [d.mac, d.lastAddress]));

    const result = sites.map(site => {
      const inlet = live[site.inletMac] || null;
      const outlet = live[site.outletMac] || null;

      let location = site.fallbackAddress || "Location unavailable";
      if (inlet?.lat && inlet.lat !== 0 && addrMap[site.inletMac]) location = addrMap[site.inletMac];
      else if (outlet?.lat && outlet.lat !== 0 && addrMap[site.outletMac]) location = addrMap[site.outletMac];

      return {
        siteId: site.siteId,
        name: site.name,
        client: site.client || "Ashoka Buildcon",
        location,
        isOnline: !!(inlet || outlet),
        lastUpdate: inlet?.receivedAt || outlet?.receivedAt || null,
        inlet: inlet ? { ...inlet, devId: undefined } : null,
        outlet: outlet ? { ...outlet, devId: undefined } : null,
      };
    });

    const onlineSites = result.filter(s => s.isOnline);

    console.log(`API /api/sites → Served ${onlineSites.length} online site(s)`);

    res.json({
      success: true,
      generatedAt: new Date().toISOString(),
      totalOnline: onlineSites.length,
      sites: onlineSites
    });
  } catch (err) {
    console.error("API Error:", err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ==================== ADMIN ADD SITE ====================
app.post("/api/admin/add-site", async (req, res) => {
  const { siteId, name, client, inletMac, outletMac, fallbackAddress } = req.body;

  if (!siteId || !inletMac || !outletMac) {
    return res.status(400).json({ success: false, message: "siteId, inletMac, outletMac required" });
  }

  try {
    await db.collection("yantra_sites").updateOne(
      { siteId },
      { $set: { name, client, inletMac, outletMac, fallbackAddress, updatedAt: new Date() } },
      { upsert: true }
    );

    console.log(`Admin: Site added → ${siteId} (${name})`);
    res.json({ success: true, message: "Site added" });
  } catch (err) {
    console.error("Add site failed:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
});

// ==================== HEALTH & ROOT ====================
app.get("/health", (_, res) => {
  res.json({
    status: "OK",
    redis: redis.isOpen,
    mqtt: mqttClient.connected,
    uniqueDevicesSeen: recentUniqueDevices.size,
    time: new Date().toISOString()
  });
});

app.get("/", (_, res) => {
  res.send(`
    <div style="font-family: system-ui; padding: 2rem; text-align: center; line-height: 1.8;">
      <h1 style="color: #0d9488;">Yuka Yantra — LIVE</h1>
      <p><strong>Dashboard:</strong> <a href="/api/sites">/api/sites</a></p>
      <p><strong>Unique Devices (Raw):</strong> <a href="/api/recent-devices" style="color:#7c3aed;">/api/recent-devices</a></p>
      <p><strong>Health:</strong> <a href="/health">/health</a></p>
      <p style="color: #6b7280; margin-top: 2rem;">Server running • ${new Date().toLocaleString("en-IN")}</p>
    </div>
  `);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("\n");
  console.log("YUKA YANTRA SERVER — FINAL VERSION");
  console.log("══════════════════════════════════");
  console.log(`Dashboard API      → http://localhost:${PORT}/api/sites`);
  console.log(`Unique Devices Raw  → http://localhost:${PORT}/api/recent-devices`);
  console.log(`Health Check        → http://localhost:${PORT}/health`);
  console.log(`Admin Add Site      → POST /api/admin/add-site`);
  console.log(`Server Time         → ${new Date().toLocaleString("en-IN")}`);
  console.log("══════════════════════════════════\n");
});