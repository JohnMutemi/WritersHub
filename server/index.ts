import express, { type Request, Response, NextFunction } from 'express';
import { registerRoutes } from './routes';
import { setupVite, serveStatic, log } from './vite';
import { seedData } from './seed';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + '…';
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await seedData();

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ message });
    throw err;
  });

  if (app.get('env') === 'development') {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 3000;
  const fallbackPort = 5000;

  // 👇 Primary listener (use 'localhost' or '127.0.0.1')
  server.listen(
    {
      port,
      host: 'localhost',
    },
    () => {
      log(`🚀 Server is running at http://localhost:${port}`);
    }
  );

  // 👇 Optional Replit/second port (safely wrapped)
  try {
    server.listen(
      {
        port: fallbackPort,
        host: 'localhost',
      },
      () => {
        log(`⚙️ Replit fallback: http://localhost:${fallbackPort}`);
      }
    );
  } catch (error) {
    log(`❌ Could not bind to port ${fallbackPort}: ${error}`);
  }
})();
