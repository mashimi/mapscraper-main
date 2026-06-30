import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import scraperController from './controllers/scraper.controller';

const app = express();
const server = http.createServer(app);

// Socket.io initialization
const io = new Server(server, {
    cors: {
        origin: "*", // In production, restrict this to your frontend URL
        methods: ["GET", "POST"]
    }
});

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100000 // relaxed limit for batch CLI orchestrator
});
app.use(limiter);

// Routes
app.post('/api/jobs', (req, res) => scraperController.startScrape(req, res, io));
app.get('/api/jobs/:jobId', (req, res) => scraperController.getJobStatus(req, res));

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Socket connection handling
io.on('connection', (socket) => {
    console.log(`[Socket] New client connected: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`[Server] Professional scraper running on port ${PORT}`);
});
