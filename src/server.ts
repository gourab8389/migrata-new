import app from './app';
import prisma from './config/database';

const port = process.env.PORT || 8080;
const isDevelopment = process.env.NODE_ENV === 'development';

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✓ Database connection successful');

    const server = app.listen(port, () => {
      console.log(`\nServer Running on Port: ${port}`);
      console.log(`Environment: ${isDevelopment ? 'Development' : 'Production'}`);
      console.log(`Health check: http://localhost:${port}/health\n`);
    });

    process.on('SIGTERM', async () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('\nSIGINT signal received: closing HTTP server');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
