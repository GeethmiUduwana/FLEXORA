import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';

const port = Number(process.env.PORT || 5000);

async function start() {
  try {
    await connectDatabase();
    app.listen(port, () => {
      console.log(`Flexora API running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start Flexora API:', error);
    process.exit(1);
  }
}

void start();
