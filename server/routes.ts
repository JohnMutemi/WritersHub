import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertJobSchema, 
  insertBidSchema,
  insertOrderSchema,
  insertTransactionSchema,
  insertWriterQuizSchema
} from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check user role
const hasRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    next();
  };
};

// Process validation errors
const handleZodError = (error: ZodError) => {
  const issues = error.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message
  }));
  return { message: "Validation error", issues };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Jobs routes
  app.get("/api/jobs", isAuthenticated, async (req, res, next) => {
    try {
      const jobs = await storage.getJobs();
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/jobs/:id", isAuthenticated, async (req, res, next) => {
    try {
      const job = await storage.getJob(Number(req.params.id));
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/jobs", hasRole(["client"]), async (req, res, next) => {
    try {
      const parsedData = insertJobSchema.parse({
        ...req.body,
        clientId: req.user.id
      });
      
      const job = await storage.createJob(parsedData);
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(handleZodError(error));
      }
      next(error);
    }
  });
  
  // Bids routes
  app.get("/api/bids", isAuthenticated, async (req, res, next) => {
    try {
      let bids;
      if (req.user.role === 'writer') {
        bids = await storage.getBidsByWriter(req.user.id);
      } else if (req.user.role === 'client') {
        bids = await storage.getBidsByClient(req.user.id);
      } else if (req.user.role === 'admin') {
        bids = await storage.getAllBids();
      } else {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(bids);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/bids", hasRole(["writer"]), async (req, res, next) => {
    try {
      // Check if writer is approved
      if (req.user.approvalStatus !== 'approved') {
        return res.status(403).json({ message: "Your account needs approval before bidding" });
      }
      
      const parsedData = insertBidSchema.parse({
        ...req.body,
        writerId: req.user.id
      });
      
      // Check if job exists and is open
      const job = await storage.getJob(parsedData.jobId);
      if (!job || job.status !== 'open') {
        return res.status(400).json({ message: "Job not available for bidding" });
      }
      
      const bid = await storage.createBid(parsedData);
      res.status(201).json(bid);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(handleZodError(error));
      }
      next(error);
    }
  });
  
  app.post("/api/bids/:id/accept", hasRole(["client"]), async (req, res, next) => {
    try {
      const bidId = Number(req.params.id);
      
      // Check if bid exists
      const bid = await storage.getBid(bidId);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }
      
      // Check if job belongs to client
      const job = await storage.getJob(bid.jobId);
      if (!job || job.clientId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Update bid status
      await storage.updateBidStatus(bidId, 'accepted');
      
      // Create order
      const writer = await storage.getUser(bid.writerId);
      if (!writer) {
        return res.status(404).json({ message: "Writer not found" });
      }
      
      // Calculate deadline date
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + bid.deliveryTime);
      
      const order = await storage.createOrder({
        jobId: job.id,
        bidId: bid.id,
        clientId: req.user.id,
        writerId: bid.writerId,
        amount: bid.amount,
        deadline: deadline
      });
      
      // Update job status
      await storage.updateJobStatus(job.id, 'in_progress');
      
      // Reject other bids for this job
      await storage.rejectOtherBids(job.id, bid.id);
      
      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  });
  
  // Orders routes
  app.get("/api/orders", isAuthenticated, async (req, res, next) => {
    try {
      let orders;
      if (req.user.role === 'writer') {
        orders = await storage.getOrdersByWriter(req.user.id);
      } else if (req.user.role === 'client') {
        orders = await storage.getOrdersByClient(req.user.id);
      } else if (req.user.role === 'admin') {
        orders = await storage.getAllOrders();
      } else {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(orders);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/orders/:id/complete", hasRole(["writer"]), async (req, res, next) => {
    try {
      const orderId = Number(req.params.id);
      
      // Check if order exists
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Check if order belongs to writer
      if (order.writerId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Update order status
      await storage.updateOrderStatus(orderId, 'completed');
      
      // Update job status
      await storage.updateJobStatus(order.jobId, 'completed');
      
      // Add payment to writer balance
      await storage.updateUserBalance(order.writerId, order.amount);
      
      // Create transaction record
      await storage.createTransaction({
        userId: order.writerId,
        amount: order.amount,
        type: 'payment',
        status: 'completed',
        orderId: order.id,
        paymentMethod: null,
        paymentDetails: null
      });
      
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });
  
  // Withdrawal routes
  app.post("/api/withdrawals", hasRole(["writer", "client"]), async (req, res, next) => {
    try {
      const { amount, paymentMethod, paymentDetails } = req.body;
      
      // Check if user has enough balance
      if (req.user.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Validate withdrawal schema
      const parsedData = insertTransactionSchema.parse({
        userId: req.user.id,
        amount: -amount, // Negative for withdrawal
        type: 'withdrawal',
        status: 'pending',
        paymentMethod,
        paymentDetails: JSON.stringify(paymentDetails),
        orderId: null
      });
      
      // Create transaction
      const transaction = await storage.createTransaction(parsedData);
      
      // Update user balance
      await storage.updateUserBalance(req.user.id, -amount);
      
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(handleZodError(error));
      }
      next(error);
    }
  });
  
  // Writer quiz submission
  app.post("/api/writer-quiz", hasRole(["writer"]), async (req, res, next) => {
    try {
      const parsedData = insertWriterQuizSchema.parse({
        ...req.body,
        writerId: req.user.id
      });
      
      const quiz = await storage.submitWriterQuiz(parsedData);
      res.status(201).json(quiz);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(handleZodError(error));
      }
      next(error);
    }
  });
  
  // Admin routes for writer approval
  app.post("/api/admin/writers/:id/approve", hasRole(["admin"]), async (req, res, next) => {
    try {
      const writerId = Number(req.params.id);
      
      // Check if writer exists
      const writer = await storage.getUser(writerId);
      if (!writer || writer.role !== 'writer') {
        return res.status(404).json({ message: "Writer not found" });
      }
      
      // Update writer approval status
      await storage.updateWriterApprovalStatus(writerId, 'approved');
      
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/admin/writers/:id/reject", hasRole(["admin"]), async (req, res, next) => {
    try {
      const writerId = Number(req.params.id);
      
      // Check if writer exists
      const writer = await storage.getUser(writerId);
      if (!writer || writer.role !== 'writer') {
        return res.status(404).json({ message: "Writer not found" });
      }
      
      // Update writer approval status
      await storage.updateWriterApprovalStatus(writerId, 'rejected');
      
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });
  
  // Statistics routes
  app.get("/api/stats/writer", hasRole(["writer"]), async (req, res, next) => {
    try {
      const stats = await storage.getWriterStats(req.user.id);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/stats/client", hasRole(["client"]), async (req, res, next) => {
    try {
      const stats = await storage.getClientStats(req.user.id);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/stats/admin", hasRole(["admin"]), async (req, res, next) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
