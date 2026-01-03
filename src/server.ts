import dotenv from 'dotenv';
import app from './app';
import testDatabaseConnection from './config/database';

// Cargar variables de entorno
dotenv.config();

// Puerto del servidor
const PORT = process.env.PORT || 3001;

// Probar conexión a la base de datos y iniciar servidor
(async () => {
  console.log('Testing database connection...');
  const isConnected = await testDatabaseConnection();
  if (!isConnected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

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
})();