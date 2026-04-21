import cors from "cors";
import express from "express";
import morgan from "morgan";
import { env } from "./config/env.js";
import {
  errorHandler,
  notFoundHandler,
} from "./modules/taxi/middlewares/errorMiddleware.js";
import { taxiRouter } from "./modules/taxi/routes/index.js";

export const createApp = () => {
  const app = express();

  const allowedOrigins = env.corsOrigins;

  const corsOptions = {
    origin(origin, callback) {
      // Allow server-to-server requests, curl, Postman, mobile apps without Origin
      if (!origin) {
        return callback(null, true);
      }

      // Allow all only when explicitly configured
      if (allowedOrigins.includes("*")) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  };

  app.use(cors(corsOptions));
  app.options(/.*/, cors(corsOptions));

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

  app.get("/", (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Taxi backend is running",
    });
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Taxi backend is healthy",
    });
  });

  // Keep both mounts during integration so existing clients using /api or /api/v1 continue to work.
  app.use("/api", taxiRouter);
  app.use("/api/v1", taxiRouter);

  app.get(["/api", "/api/v1"], (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Taxi API is mounted",
      routes: {
        admins: ["/api/admin", "/api/v1/admin"],
        users: ["/api/users", "/api/v1/users"],
        drivers: ["/api/drivers", "/api/v1/drivers"],
        rides: ["/api/rides", "/api/v1/rides"],
        deliveries: ["/api/deliveries", "/api/v1/deliveries"],
      },
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
