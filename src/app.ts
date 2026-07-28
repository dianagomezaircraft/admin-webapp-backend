import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { setupSwagger } from './config/swagger';

// Import routes
import authRoutes from './routes/auth.routes';
import airlineRoutes from './routes/airlines.routes';
import userRoutes from './routes/user.routes';
import chapterRoutes from './routes/chapter.routes';
import sectionRoutes from './routes/section.routes';
import contentRoutes from './routes/content.routes';
import contactRoutes from './routes/contact.routes';
import searchRoutes from './routes/search.routes';
import templateRoutes from './routes/template.routes';
import favoritesRouter from './routes/favorites.routes';
import { portalRouter, sofemaCatchAll } from './portal_serve/sofema-proxy';

// Create Express application
const app = express();

// ============================================
// MIDDLEWARE GLOBALES
// ============================================

// Security headers — frameguard off so Softema portal can be iframed (CSP set by proxy)
app.use(
  helmet({
    frameguard: false,
    contentSecurityPolicy: false,
  })
);

// CORS - Allow requests from frontend
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL || 'http://localhost:3000']
      : true, // Allow all origins in development
    credentials: true,
  })
);

const stashRawBody = (req: Request, _res: Response, buf: Buffer) => {
  (req as Request & { rawBody?: Buffer }).rawBody = buf;
};

// Parse JSON bodies
app.use(express.json({ verify: stashRawBody }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, verify: stashRawBody }));

// HTTP request logger (development only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Setup Swagger Documentation
setupSwagger(app);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================
// API ROUTES
// ============================================

// Authentication routes
app.use('/api/auth', authRoutes);

// Airline management routes (SUPER_ADMIN only for create/update/delete)
app.use('/api/airlines', airlineRoutes);

// User management routes (Admin+ with tenant isolation)
app.use('/api/users', userRoutes);

// Manual content routes (Editor+ with tenant isolation)
app.use('/api/chapters', chapterRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/contents', contentRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/favorites', favoritesRouter);

// Softema portal proxy (auth bridge, /__api, then catch-all site proxy)
app.use(portalRouter);
app.use(sofemaCatchAll);

// ============================================
// 404 HANDLER
// ============================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
  });
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;