import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mediaRoute from './routes/mediaroute';
import videoController from './controller/vidHandler';
import { rateLimit } from './middleware/rateLimit';


import "./services/worker"


const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'UltimateVid Backend API' });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});


app.post("/check", rateLimit,videoController.vidCheck);  
app.get("/download", rateLimit,videoController.vidHandler);
app.use("/media", mediaRoute)


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server rerunning on port ${PORT}`);
});

export default app;
