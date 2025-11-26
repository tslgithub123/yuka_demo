// server.js — FINAL WORKING LEAN EDITION (Node.js v24+ Ready)
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

// ==================== CORS (FIXED!) ====================
app.use(cors({
  origin: (origin, callback) => {
    // Allow localhost & no origin (Postman, etc.)
    if (!origin || /localhost|127\.0\.0\.1/.test(origin)) {
      return callback(null, true);
    }
    // Allow production domains
    const allowed = ["yukayantra.com", "51.21.144.39"];
    const isAllowed = allowed.some(domain => origin.includes(domain));
    return callback(isAllowed ? null : new Error("CORS not allowed"), isAllowed);
  },
  credentials: true
}));

app.use(express.json());

// ==================== REDIS ====================
const redis = createClient();
await redis.connect();

// ==================== MONGODB ====================
const mongo = new MongoClient(MONGO_URI, { serverApi: ServerApiVersion.v1 });
await mongo.connect();
const db = mongo.db(DB_NAME);

// Indexes
await db.collection("devices").createIndex({ mac: 1 }, { unique: true });
await db.collection("yantra_sites").createIndex({ siteId: 1 }, { unique: true });

// ==================== GEOCODING ====================
const getAddressFromCoords = async (lat, lng) => {
  if (!lat || !lng || lat === 0 || lng === 0) return null;

  const existing = await db.collection("devices").findOne({
    lastLat: { $gte: lat - 0.001, $lte: lat + 0.001 },
    lastLng: { $gte: lng - 0.001, $lte: lng + 0.001 }
  });
  if (existing?.lastAddress) return existing.lastAddress;

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
  console.log("MQTT Connected");
  mqttClient.subscribe(["Techknowgreen ", "Techknowgreen"]);
});

mqttClient.on("message", async (topic, msg) => {
  const raw = msg.toString().trim();
  if (!raw) return;

  let payload;
  try { payload = JSON.parse(raw); } catch { return; }

  if (!Array.isArray(payload.data)) return;

  for (const s of payload.data) {
    const devId = s.devId?.trim();
    if (!devId) continue;

    const data = {
      devId,
      receivedAt: new Date().toISOString(),
      temp: Number(s.temp ?? NaN) || null,
      hum: Number(s.hum ?? NaN) || null,
      pressure: Number(s.pressure ?? NaN) || null,
      lat: Number(s.lat ?? NaN) || null,
      lng: Number(s.lng ?? NaN) || null,
      pm2d5: Number(s.pm2d5 ?? NaN) || null,
      pm10: Number(s.pm10 ?? NaN) || null,
      aqi: parseInt(s.aqi ?? "", 10) || null,
      T_Tot: s.T_Tot ?? null,
      V_Tot: s.V_Tot ?? null,
    };

    await redis.setEx(devId, 600, JSON.stringify(data));

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
        }
      }
    }
  }
});

// ==================== API /api/sites ====================
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

    res.json({
      success: true,
      generatedAt: new Date().toISOString(),
      sites: result.filter(s => s.isOnline)
    });
  } catch (err) {
    console.error("API Error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ==================== ADMIN ADD SITE ====================
app.post("/api/admin/add-site", async (req, res) => {
  const { siteId, name, client, inletMac, outletMac, fallbackAddress } = req.body;
  if (!siteId || !inletMac || !outletMac) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  await db.collection("yantra_sites").updateOne(
    { siteId },
    { $set: { name, client, inletMac, outletMac, fallbackAddress, updatedAt: new Date() } },
    { upsert: true }
  );

  res.json({ success: true, message: "Site added/updated" });
});

// ==================== HEALTH & ROOT ====================
app.get("/health", (_, res) => res.json({ status: "OK", time: new Date().toISOString() }));
app.get("/", (_, res) => res.send("<h1>Yuka Yantra — LIVE & STABLE</h1><p>/api/sites → Dashboard Data</p>"));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\nYUKA YANTRA SERVER IS LIVE`);
  console.log(`→ http://localhost:${PORT}/api/sites`);
  console.log(`→ Admin API: POST /api/admin/add-site\n`);
});