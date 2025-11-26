// server.js — Full Professional Yuka Yantra Backend (Option C)
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

const MONGO_URI = "mongodb://localhost:27017"; // Change if remote
const DB_NAME = "yuka_yantra";
const COLLECTIONS = {
  sites: "yantra_sites",
  devices: "devices", // caches real addresses from GPS
};

// Smart CORS (all localhost + production)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return callback(null, true);
    }
    const allowed = [
      "http://51.21.144.39",
      "http://yukayantra.com", "https://yukayantra.com",
      "http://www.yukayantra.com", "https://www.yukayantra.com"
    ];
    return callback(allowed.includes(origin) ? null : new Error("CORS blocked"), allowed.includes(origin));
  }
}));
app.use(express.json());

// ==================== REDIS ====================
const redis = createClient({ url: "redis://localhost:6379" });
await redis.connect();
redis.on("error", (err) => console.error("Redis Error:", err));

// ==================== MONGODB ====================
const mongo = new MongoClient(MONGO_URI, { serverApi: ServerApiVersion.v1 });
await mongo.connect();
const db = mongo.db(DB_NAME);
console.log("Connected to MongoDB + Redis");

// ==================== REVERSE GEOCODE CACHE ====================
const getAddressFromCoords = async (lat, lng) => {
  if (!lat || !lng || lat === 0 || lng === 0) return null;
  const cacheKey = `addr:${lat.toFixed(5)}:${lng.toFixed(5)}`;
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  try {
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`
    );
    const addr = res.data.display_name.split(",").slice(-6).join(", ").replace(/, India$/, ", India");
    await redis.setEx(cacheKey, 86400 * 30, addr); // cache 30 days
    return addr;
  } catch (err) {
    console.warn("Geocode failed:", err.message);
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
  try {
    const payload = JSON.parse(message.toString());
    if (!payload.data || !Array.isArray(payload.data)) return;

    for (const sensor of payload.data) {
      const devId = sensor.devId?.trim();
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
        rssi: sensor.rssi || null,
        pm2d5: sensor.pm2d5 != null ? Number(sensor.pm2d5) : null,
        pm10: sensor.pm10 != null ? Number(sensor.pm10) : null,
        aqi: sensor.aqi != null ? parseInt(sensor.aqi) : null,
        T_Tot: sensor.T_Tot ?? null,
        V_Tot: sensor.V_Tot ?? null,
      };

      // Save latest in Redis (expires in 10 min if no update)
      await redis.setEx(devId, 600, JSON.stringify(normalized));

      // Update real address if GPS is valid
      if (normalized.lat && normalized.lng && normalized.lat !== 0 && normalized.lng !== 0) {
        const realAddress = await getAddressFromCoords(normalized.lat, normalized.lng);
        if (realAddress) {
          await db.collection("devices").updateOne(
            { mac: devId },
            { $set: { lastAddress: realAddress, lastLat: normalized.lat, lastLng: normalized.lng, updatedAt: new Date() } },
            { upsert: true }
          );
        }
      }
    }
  } catch (err) {
    console.error("MQTT parse error:", err.message);
  }
});

// ==================== API: GROUPED SITES ====================
app.get("/api/sites", async (req, res) => {
  try {
    const sites = await db.collection(COLLECTIONS.sites).find({}).toArray();
    const latestKeys = await redis.keys("*");
    const latestData = {};
    for (const key of latestKeys) {
      if (key.includes("addr:")) continue;
      const data = await redis.get(key);
      if (data) latestData[key] = JSON.parse(data);
    }

    const deviceCache = await db.collection("devices")
      .find({ mac: { $in: latestKeys.filter(k => !k.includes(":")) } })
      .toArray();
    const addrMap = Object.fromEntries(deviceCache.map(d => [d.mac, d.lastAddress]));

    const result = sites.map(site => {
      const inlet = latestData[site.inletMac] || null;
      const outlet = latestData[site.outletMac] || null;
      const isOnline = !!(inlet || outlet);
      const lastUpdate = inlet?.receivedAt || outlet?.receivedAt || null;

      // Smart location: real → cached → fallback
      let location = site.fallbackAddress || "Location unavailable";
      if (inlet?.lat && inlet.lng && inlet.lat !== 0) {
        location = addrMap[site.inletMac] || location;
      } else if (outlet?.lat && outlet.lng && outlet.lat !== 0) {
        location = addrMap[site.outletMac] || location;
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

    res.json({ success: true, sites: result.filter(s => s.isOnline) });
  } catch (err) {
    console.error("API Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Health + Root
app.get("/health", (req, res) => res.json({ status: "ok", redis: redis.isOpen, mongo: true }));
app.get("/", (req, res) => res.send("<h1>Yuka Yantra Live API — Option C Running</h1><p><a href='/api/sites'>/api/sites</a></p>"));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\nYuka Yantra Backend (Option C) Running on http://localhost:${PORT}`);
  console.log(`→ Dashboard API: http://localhost:${PORT}/api/sites\n`);
});