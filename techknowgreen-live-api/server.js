// server.js — FINAL FINAL FINAL (Crash-Proof Edition)
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
  clientId: "techknow_server_" + Math.random().toString(16).substr(2, 8),
  username: "ambee_hw_rw",
  password: "AmbeeH@rdware2022!",
  keepalive: 60,
  reconnectPeriod: 5000,
};

const MONGO_URI = "mongodb://localhost:27017";
const DB_NAME = "yuka_yantra";

// CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /localhost|127\.0\.0\.1/.test(origin)) return callback(null, true);
    const allowed = ["yukayantra.com", "51.21.144.39"];
    const ok = allowed.some(d => origin.includes(d));
    callback(ok ? null : new Error("CORS"), ok);
  },
  credentials: true
}));
app.use(express.json());

// ==================== REDIS ====================
const redis = createClient({ url: "redis://localhost:6379" });
await redis.connect();

// ==================== MONGODB ====================
const mongo = new MongoClient(MONGO_URI, { serverApi: ServerApiVersion.v1 });
await mongo.connect();
const db = mongo.db(DB_NAME);

// Indexes
await db.collection("devices").createIndex({ mac: 1 }, { unique: true });
await db.collection("yantra_sites").createIndex({ siteId: 1 }, { unique: true });

// ==================== SAFE JSON PARSE ====================
const safeJsonParse = (str, fallback = null) => {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn("Invalid JSON received, skipping:", str.substring(0, 100));
    return fallback;
  }
};

// ==================== GEOCODING (ONCE PER DEVICE) ====================
const getAddressFromCoords = async (lat, lng) => {
  const key = `geo:${lat.toFixed(5)}:${lng.toFixed(5)}`;
  const cached = await redis.get(key);
  if (cached) return cached;

  try {
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`,
      { timeout: 8000 }
    );
    const addr = res.data.display_name.split(",").slice(-6).join(", ").replace(/, India$/, ", India");
    await redis.setEx(key, 7776000, addr); // 90 days
    return addr;
  } catch (e) {
    return null;
  }
};

// ==================== MQTT ====================
const mqttClient = mqtt.connect(MQTT_BROKER, MQTT_OPTIONS);

mqttClient.on("connect", () => {
  console.log("MQTT Connected");
  mqttClient.subscribe(["Techknowgreen ", "Techknowgreen"]);
});

mqttClient.on("message", async (topic, message) => {
  const raw = message.toString().trim();
  if (!raw) return;

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (e) {
    console.warn("Non-JSON message ignored:", raw.substring(0, 100));
    return;
  }

  if (!payload.data || !Array.isArray(payload.data)) return;

  for (const sensor of payload.data) {
    const devId = sensor.devId?.toString().trim();
    if (!devId) continue;

    const normalized = {
      devId,
      receivedAt: new Date().toISOString(),
      ts: sensor.ts || null,
      temp: sensor.temp != null ? Number(sensor.temp) : null,
      hum: sensor.hum != null ? Number(sensor.hum) : null,
      pressure: sensor.pressure != null ? Number(sensor.pressure) : null,
      lat: sensor.lat != null ? Number(sensor.lat) : null,
      lng: sensor.lng != null ? Number(sensor.lng) : null,
      rssi: sensor.rssi ?? null,
      pm2d5: sensor.pm2d5 != null ? Number(sensor.pm2d5) : null,
      pm10: sensor.pm10 != null ? Number(sensor.pm10) : null,
      aqi: sensor.aqi != null ? parseInt(sensor.aqi, 10) : null,
      T_Tot: sensor.T_Tot ?? null,
      V_Tot: sensor.V_Tot ?? null,
    };

    // Save to Redis (10 min TTL)
    await redis.setEx(devId, 600, JSON.stringify(normalized));

    // Intelligent geocoding — only once or if moved >100m
    if (normalized.lat && normalized.lng && normalized.lat !== 0 && normalized.lng !== 0) {
      const existing = await db.collection("devices").findOne({ mac: devId });

      const moved = existing &&
        (Math.abs(existing.lastLat - normalized.lat) > 0.001 ||
          Math.abs(existing.lastLng - normalized.lng) > 0.001);

      if (!existing || !existing.lastAddress || moved) {
        const addr = await getAddressFromCoords(normalized.lat, normalized.lng);
        if (addr) {
          await db.collection("devices").updateOne(
            { mac: devId },
            {
              $set: {
                lastAddress: addr,
                lastLat: normalized.lat,
                lastLng: normalized.lng,
                lastGeocodedAt: new Date(),
                updatedAt: new Date()
              }
            },
            { upsert: true }
          );
          console.log(`Geocoded: ${devId} → ${addr}`);
        }
      }
    }
  }
});

// ==================== API /api/sites ====================
app.get("/api/sites", async (req, res) => {
  try {
    const sites = await db.collection("yantra_sites").find({}).toArray();

    // Get all latest data from Redis
    const keys = await redis.keys("*");
    const latestData = {};
    for (const k of keys) {
      if (k.startsWith("geo:")) continue;
      const val = await redis.get(k);
      if (val) {
        const parsed = safeJsonParse(val);
        if (parsed) latestData[k] = parsed;
      }
    }

    // Address map
    const addrDocs = await db.collection("devices")
      .find({ mac: { $in: Object.keys(latestData) } })
      .toArray();
    const addrMap = Object.fromEntries(addrDocs.map(d => [d.mac, d.lastAddress]));

    const result = sites.map(site => {
      const inlet = latestData[site.inletMac] || null;
      const outlet = latestData[site.outletMac] || null;
      const isOnline = !!(inlet || outlet);
      const lastUpdate = inlet?.receivedAt || outlet?.receivedAt || null;

      let location = site.fallbackAddress || "Location unavailable";
      if (inlet?.lat && inlet.lat !== 0 && addrMap[site.inletMac]) {
        location = addrMap[site.inletMac];
      } else if (outlet?.lat && outlet.lat !== 0 && addrMap[site.outletMac]) {
        location = addrMap[site.outletMac];
      }

      return {
        siteId: site.siteId,
        name: site.name,
        client: site.client || "Ashoka Buildcon",
        location,
        isOnline,
        lastUpdate,
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
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== ADMIN ADD SITE ====================
app.post("/api/admin/add-site", async (req, res) => {
  try {
    const { siteId, name, client, inletMac, outletMac, fallbackAddress } = req.body;
    if (!siteId || !inletMac || !outletMac) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }
    await db.collection("yantra_sites").updateOne(
      { siteId },
      { $set: { name, client, inletMac, outletMac, fallbackAddress, addedAt: new Date() } },
      { upsert: true }
    );
    res.json({ success: true, message: "Site saved" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Health
app.get("/health", (req, res) => res.json({ status: "OK", time: new Date().toISOString() }));
app.get("/", (req, res) => res.send("<h1>Yuka Yantra — FINAL FINAL FINAL — Running</h1>"));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\nYuka Yantra Server Running → http://localhost:${PORT}`);
  console.log(`Dashboard → http://localhost:5173/ashoka-buildcon\n`);
});