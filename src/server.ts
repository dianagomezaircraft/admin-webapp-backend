import dotenv from 'dotenv';
import app from './app';

// Cargar variables de entorno
dotenv.config();

// Puerto del servidor
const PORT = process.env.PORT || 3001;

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log('Server started successfully!');
  console.log(`API running on: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Auth endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`Chapters endpoint: http://localhost:${PORT}/api/chapters/`);
  console.log(`Contents endpoint: http://localhost:${PORT}/api/contents/`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Manejo de señales de cierre
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});