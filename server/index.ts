import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { cronService } from "./services/cronService"; // Assuming cronService.ts exists
import { initializeDatabase } from "./init-db";
import cookieParser from 'cookie-parser';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log('Starting route registration...');
    const server = await registerRoutes(app);
    console.log('Route registration completed');

    // Initialize database tables in background (non-blocking)
    console.log('Starting database initialization in background...');
    initializeDatabase().catch(err => {
      console.error('Background database initialization failed:', err);
    });
    console.log('Database initialization started in background');

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error('Express error:', err);
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "production") {
      console.log('Setting up static file serving for production...');
      serveStatic(app);
      console.log('Static file serving setup completed');
    } else {
      console.log('Setting up Vite for development...');
      await setupVite(app, server);
      console.log('Vite setup completed');
    }

    // Start cron service for automated post publishing (non-blocking)
    console.log('Starting cron service in background...');
    setTimeout(() => {
      try {
        cronService.start();
        console.log('Cron service started successfully');
      } catch (error) {
        console.error('Error starting cron service:', error);
      }
    }, 1000); // Delay cron service start by 1 second

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('Shutting down server...');
      // cronService.stop(); // Temporarily disabled to debug startup issues
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('Shutting down server...');
      // cronService.stop(); // Temporarily disabled to debug startup issues
      process.exit(0);
    });

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    console.log(`Starting server on port ${port}...`);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error('Fatal error during server startup:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    process.exit(1);
  }
})();