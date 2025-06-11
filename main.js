import morgan from "morgan";
import express from "express";
import cors from "./config/corsPolicy.js";
const app = express();

const config = {
  host: "localhost",
  port: 50500,
  env: process.env.NODE_ENV || "development"
};



// Middleware
app.use(cors);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// Default response
app.get("/", (req, res) => {
  res.status(200).json({ 
    message: "Welcome to the UniPets API",
    documentation: `http://${config.host}:${config.port}/docs` 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    code: 500, 
    message: "Internal Server Error",
    error: config.env === "development" ? err.message : undefined
  });
});

// No route found handler
app.use((req, res) => {
  res.status(404).json({ code: 404, message: "Endpoint not found, try again :/" });
});

// Start server
const server = app.listen(config.port, config.host, () => {
  console.log(`Server running in ${config.env} mode at http://${config.host}:${config.port}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});

export default app;