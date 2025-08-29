import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";

const port = process.env.PORT || 5000;

async function startServer() {
  try {
    const app = express();
    
    // Basic middleware
    app.use(express.json({ limit: '16mb' }));
    app.use(express.urlencoded({ extended: true, limit: '16mb' }));
    
    // Register all API routes and get the HTTP server
    log("Setting up routes...");
    const server = await registerRoutes(app);
    
    // Set up Vite for development
    if (process.env.NODE_ENV !== "production") {
      log("Setting up Vite development server...");
      await setupVite(app, server);
    }
    
    // Start the server
    server.listen(Number(port), "0.0.0.0", () => {
      log(`Server running on http://localhost:${port}`);
      log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Error handling for the server
    server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `Port ${port} is already in use. Attempting to kill existing processes...`,
        );
        try {
          require("child_process").execSync(
            `pkill -f "tsx server/index.ts" && pkill -f "npm run dev"`,
            { stdio: "ignore" },
          );
          console.log("Killed existing processes. Please restart the server.");
        } catch (e) {
          console.error(
            "Could not kill existing processes. Please manually stop other server instances.",
          );
        }
        process.exit(1);
      } else {
        console.error("Server error:", err);
        process.exit(1);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      log('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      log('SIGINT received, shutting down gracefully...');
      server.close(() => {
        log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();