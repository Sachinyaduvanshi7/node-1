const express = require("express");
const app = express();
const prometheus = require("prom-client");

// Define your metrics
const httpRequestDurationMicroseconds = new prometheus.Histogram({
  name: "http_request_duration_ms",
  help: "Duration of HTTP requests in milliseconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 5, 15, 50, 100, 500],
});

// Middleware to measure HTTP request duration
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    httpRequestDurationMicroseconds
      .labels(req.method, req.route.path, res.statusCode)
      .observe(duration);
  });
  next();
});

// define your routes
app.get("/", (req, res) => {
  res.send("Successful response.");
});

//expose metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", prometheus.register.contentType);
  try {
    const metrics = await prometheus.register.metrics();
    res.end(metrics);
  } catch (error) {
    console.error("Error generating metrics:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(3000, () => console.log("Example app is listening on port 3000."));
