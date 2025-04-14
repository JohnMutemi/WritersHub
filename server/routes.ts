import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  insertJobSchema, 
  insertBidSchema,
  insertOrderSchema,
  insertTransactionSchema,
  insertWriterQuizSchema
} from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";

// Set up multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedFileTypes = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, RTF, JPG, PNG files are allowed.'));
  }
};

const upload = multer({ 
  storage: storage_config, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max file size
});

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
    
    if (!roles.includes(req.user!.role)) {
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
  
  // File upload endpoint for jobs
  app.post("/api/upload/job-files", hasRole(["client", "writer"]), upload.array('files', 5), (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files were uploaded" });
      }
      
      const fileData = files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: `/uploads/${file.filename}`,
        size: file.size,
        mimeType: file.mimetype
      }));
      
      res.status(200).json(fileData);
    } catch (error: any) {
      res.status(500).json({ 
        message: "Error uploading files", 
        error: error?.message || "Unknown error occurred" 
      });
    }
  });
  
  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    // Security check to prevent directory traversal
    if (req.url.includes('..')) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  }, express.static(uploadsDir));
  
  app.post("/api/jobs", hasRole(["client"]), async (req, res, next) => {
    try {
      // Get attachments, reference files, and other data
      const { attachments, referenceFiles, ...jobData } = req.body;
      
      // Format file attachments if present
      let formattedAttachments = null;
      if (referenceFiles && referenceFiles.length > 0) {
        // Create a comma-separated list of file paths from the uploaded files
        formattedAttachments = referenceFiles.map((file: { path: string }) => file.path).join(',');
      }
      
      const parsedData = insertJobSchema.parse({
        ...jobData,
        clientId: req.user!.id,
        // Store the attachments paths
        attachments: formattedAttachments || attachments || null,
        // Store reference file details in metadata for future reference
        metadata: JSON.stringify({
          ...JSON.parse(req.body.metadata || '{}'),
          referenceFiles: referenceFiles || []
        })
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
      if (req.user!.role === 'writer') {
        bids = await storage.getBidsByWriter(req.user!.id);
      } else if (req.user!.role === 'client') {
        bids = await storage.getBidsByClient(req.user!.id);
      } else if (req.user!.role === 'admin') {
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
      if (req.user!.approvalStatus !== 'approved') {
        return res.status(403).json({ message: "Your account needs approval before bidding" });
      }
      
      const parsedData = insertBidSchema.parse({
        ...req.body,
        writerId: req.user!.id
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
  
  // Get bids for a specific job with writer details
  app.get("/api/jobs/:id/bids", hasRole(["client", "admin"]), async (req, res, next) => {
    try {
      const jobId = Number(req.params.id);
      
      // Check if job exists
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // If user is a client, check if job belongs to them
      if (req.user!.role === 'client' && job.clientId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Get bids for the job
      const bids = await storage.getBidsByJob(jobId);
      
      // Enhance bids with writer details and stats
      const bidsWithDetails = await Promise.all(
        bids.map(async (bid) => {
          const writer = await storage.getUser(bid.writerId);
          const writerStats = await storage.getWriterStats(bid.writerId);
          
          return {
            ...bid,
            writerUsername: writer?.username,
            writerName: writer?.fullName,
            proposal: bid.coverLetter,
            // Include writer stats
            stats: {
              completedOrders: writerStats.completedOrders,
              activeOrders: writerStats.activeOrders,
              pendingBids: writerStats.pendingBids
            }
          };
        })
      );
      
      res.json(bidsWithDetails);
    } catch (error) {
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
      if (!job || job.clientId !== req.user!.id) {
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
        clientId: req.user!.id,
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
      if (req.user!.role === 'writer') {
        orders = await storage.getOrdersByWriter(req.user!.id);
      } else if (req.user!.role === 'client') {
        orders = await storage.getOrdersByClient(req.user!.id);
      } else if (req.user!.role === 'admin') {
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
      if (order.writerId !== req.user!.id) {
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
      if (req.user!.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Validate withdrawal schema
      const parsedData = insertTransactionSchema.parse({
        userId: req.user!.id,
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
      await storage.updateUserBalance(req.user!.id, -amount);
      
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
        writerId: req.user!.id
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
      const stats = await storage.getWriterStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/stats/client", hasRole(["client"]), async (req, res, next) => {
    try {
      const stats = await storage.getClientStats(req.user!.id);
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
  
  // Charts data for admin analytics
  app.get("/api/stats/admin/charts", hasRole(["admin"]), async (req, res, next) => {
    try {
      // Get time range from query parameter
      const timeRange = req.query.timeRange as string || '6m';
      
      // Generate appropriate date ranges based on timeRange
      const now = new Date();
      let startDate = new Date();
      
      if (timeRange === '1m') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (timeRange === '6m') {
        startDate.setMonth(now.getMonth() - 6);
      } else if (timeRange === '1y') {
        startDate.setFullYear(now.getFullYear() - 1);
      } else {
        // Default to all time - use a far past date
        startDate = new Date(2020, 0, 1);
      }
      
      // Get all data needed for charts
      const jobs = await storage.getJobs();
      const orders = await storage.getAllOrders();
      
      // Filter by date range if applicable
      const filteredJobs = jobs.filter(job => new Date(job.createdAt) >= startDate);
      const filteredOrders = orders.filter(order => new Date(order.createdAt) >= startDate);
      
      // Group data by month for jobs, orders and revenue
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const jobData = [];
      const orderData = [];
      const revenueData = [];
      
      // Generate a map of months to include in response
      const monthsMap = new Map();
      
      if (timeRange === '1m') {
        // For 1 month, we show days instead
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
          monthsMap.set(i.toString(), {
            jobs: 0,
            orders: 0,
            revenue: 0
          });
        }
        
        // Process jobs, orders by day
        filteredJobs.forEach(job => {
          const date = new Date(job.createdAt);
          const day = date.getDate().toString();
          if (monthsMap.has(day)) {
            const data = monthsMap.get(day);
            data.jobs++;
            monthsMap.set(day, data);
          }
        });
        
        filteredOrders.forEach(order => {
          const date = new Date(order.createdAt);
          const day = date.getDate().toString();
          if (monthsMap.has(day)) {
            const data = monthsMap.get(day);
            data.orders++;
            data.revenue += order.amount;
            monthsMap.set(day, data);
          }
        });
        
        // Convert map to arrays
        monthsMap.forEach((value, key) => {
          jobData.push({ month: key, jobs: value.jobs });
          orderData.push({ month: key, orders: value.orders });
          revenueData.push({ month: key, revenue: value.revenue });
        });
      } else {
        // For other time ranges, group by month
        const startMonth = startDate.getMonth();
        const startYear = startDate.getFullYear();
        const endMonth = now.getMonth();
        const endYear = now.getFullYear();
        
        // Create array of all months in range
        let currentMonth = startMonth;
        let currentYear = startYear;
        
        while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
          const monthKey = `${monthNames[currentMonth]} ${currentYear}`;
          monthsMap.set(monthKey, {
            jobs: 0,
            orders: 0,
            revenue: 0
          });
          
          currentMonth++;
          if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
          }
        }
        
        // Process jobs by month
        filteredJobs.forEach(job => {
          const date = new Date(job.createdAt);
          const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
          if (monthsMap.has(monthKey)) {
            const data = monthsMap.get(monthKey);
            data.jobs++;
            monthsMap.set(monthKey, data);
          }
        });
        
        // Process orders by month
        filteredOrders.forEach(order => {
          const date = new Date(order.createdAt);
          const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
          if (monthsMap.has(monthKey)) {
            const data = monthsMap.get(monthKey);
            data.orders++;
            data.revenue += order.amount;
            monthsMap.set(monthKey, data);
          }
        });
        
        // Convert map to arrays, preserving chronological order
        const monthKeys = Array.from(monthsMap.keys()).sort((a, b) => {
          const [aMonth, aYear] = a.split(' ');
          const [bMonth, bYear] = b.split(' ');
          
          if (aYear !== bYear) {
            return parseInt(aYear) - parseInt(bYear);
          }
          
          return monthNames.indexOf(aMonth) - monthNames.indexOf(bMonth);
        });
        
        monthKeys.forEach(key => {
          const value = monthsMap.get(key);
          const monthName = key.split(' ')[0]; // Just use month name for display
          jobData.push({ month: monthName, jobs: value.jobs });
          orderData.push({ month: monthName, orders: value.orders });
          revenueData.push({ month: monthName, revenue: value.revenue });
        });
      }
      
      // Generate status distribution data
      const statusCounts = {
        'open': 0,
        'in_progress': 0,
        'completed': 0,
        'cancelled': 0
      };
      
      jobs.forEach(job => {
        if (statusCounts[job.status] !== undefined) {
          statusCounts[job.status]++;
        }
      });
      
      const statusData = [
        { name: 'Open', value: statusCounts.open },
        { name: 'In Progress', value: statusCounts.in_progress },
        { name: 'Completed', value: statusCounts.completed },
        { name: 'Cancelled', value: statusCounts.cancelled }
      ];
      
      // Generate user composition data
      const users = await Promise.all(
        (await storage.getJobs()).map(job => storage.getUser(job.clientId))
      );
      
      // Remove duplicates and count by role
      const uniqueUsers = users.filter((user, index, self) => 
        user && index === self.findIndex(u => u && u.id === user.id)
      );
      
      const roleCounts = {
        'writer': 0,
        'client': 0,
        'admin': 0
      };
      
      uniqueUsers.forEach(user => {
        if (user && roleCounts[user.role] !== undefined) {
          roleCounts[user.role]++;
        }
      });
      
      const userData = [
        { name: 'Writers', value: roleCounts.writer },
        { name: 'Clients', value: roleCounts.client },
        { name: 'Admins', value: roleCounts.admin }
      ];
      
      res.json({
        jobData,
        orderData,
        revenueData,
        statusData,
        userData
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Admin API routes
  app.get("/api/admin/users", hasRole(["admin"]), async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/admin/jobs", hasRole(["admin"]), async (req, res, next) => {
    try {
      const jobs = await storage.getJobs();
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/admin/orders", hasRole(["admin"]), async (req, res, next) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      next(error);
    }
  });

  // Admin user approval routes
  app.post("/api/admin/users/:id/approve", hasRole(["admin"]), async (req, res, next) => {
    try {
      const userId = Number(req.params.id);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'writer') {
        return res.status(404).json({ message: "Writer not found" });
      }
      
      // Update writer approval status
      await storage.updateWriterApprovalStatus(userId, 'approved');
      
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/admin/users/:id/reject", hasRole(["admin"]), async (req, res, next) => {
    try {
      const userId = Number(req.params.id);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'writer') {
        return res.status(404).json({ message: "Writer not found" });
      }
      
      // Update writer approval status
      await storage.updateWriterApprovalStatus(userId, 'rejected');
      
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

  // Client-specific routes
  
  // Get jobs posted by the authenticated client
  app.get("/api/client/jobs", hasRole(["client"]), async (req, res, next) => {
    try {
      // Get all jobs and filter by clientId
      const allJobs = await storage.getJobs();
      const clientJobs = allJobs.filter(job => job.clientId === req.user!.id);
      res.json(clientJobs);
    } catch (error) {
      next(error);
    }
  });

  // Get orders for the authenticated client
  app.get("/api/client/orders", hasRole(["client"]), async (req, res, next) => {
    try {
      const orders = await storage.getOrdersByClient(req.user!.id);
      
      // Enhance orders with job details
      const ordersWithDetails = await Promise.all(orders.map(async order => {
        const job = await storage.getJob(order.jobId);
        const writer = await storage.getUser(order.writerId);
        
        return {
          ...order,
          jobTitle: job?.title || "Unknown Job",
          writerUsername: writer?.username || "Unknown Writer"
        };
      }));
      
      res.json(ordersWithDetails);
    } catch (error) {
      next(error);
    }
  });
  
  // Get bids for all jobs of the authenticated client
  app.get("/api/client/bids", hasRole(["client"]), async (req, res, next) => {
    try {
      const bids = await storage.getBidsByClient(req.user!.id);
      
      // Group bids by job ID
      const bidsByJob: Record<number, any[]> = {};
      for (const bid of bids) {
        if (!bidsByJob[bid.jobId]) {
          bidsByJob[bid.jobId] = [];
        }
        
        // Enhance bid with writer details
        const writer = await storage.getUser(bid.writerId);
        const writerStats = await storage.getWriterStats(bid.writerId);
        
        bidsByJob[bid.jobId].push({
          ...bid,
          writerUsername: writer?.username,
          writerName: writer?.fullName,
          proposal: bid.coverLetter, // For compatibility with frontend
          stats: {
            completedOrders: writerStats.completedOrders,
            activeOrders: writerStats.activeOrders,
            pendingBids: writerStats.pendingBids
          }
        });
      }
      
      res.json(bidsByJob);
    } catch (error) {
      next(error);
    }
  });
  
  // Get stats for the authenticated client
  app.get("/api/client/stats", hasRole(["client"]), async (req, res, next) => {
    try {
      const stats = await storage.getClientStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  // Writer-specific routes
  
  // Get available jobs for writers
  app.get("/api/writer/jobs", hasRole(["writer"]), async (req, res, next) => {
    try {
      const allJobs = await storage.getJobs();
      // Return only open jobs
      const availableJobs = allJobs.filter(job => job.status === 'open');
      res.json(availableJobs);
    } catch (error) {
      next(error);
    }
  });
  
  // Get bids placed by the authenticated writer
  app.get("/api/writer/bids", hasRole(["writer"]), async (req, res, next) => {
    try {
      const bids = await storage.getBidsByWriter(req.user!.id);
      
      // Enhance bids with job details
      const bidsWithJobDetails = await Promise.all(bids.map(async bid => {
        const job = await storage.getJob(bid.jobId);
        return {
          ...bid,
          jobTitle: job?.title || "Unknown Job",
          description: job?.description || "",
          deadline: job?.deadline || null
        };
      }));
      
      res.json(bidsWithJobDetails);
    } catch (error) {
      next(error);
    }
  });
  
  // Get orders assigned to the authenticated writer
  app.get("/api/writer/orders", hasRole(["writer"]), async (req, res, next) => {
    try {
      const orders = await storage.getOrdersByWriter(req.user!.id);
      
      // Enhance orders with job details
      const ordersWithDetails = await Promise.all(orders.map(async order => {
        const job = await storage.getJob(order.jobId);
        const client = await storage.getUser(order.clientId);
        
        return {
          ...order,
          jobTitle: job?.title || "Unknown Job",
          clientUsername: client?.username || "Unknown Client"
        };
      }));
      
      res.json(ordersWithDetails);
    } catch (error) {
      next(error);
    }
  });
  
  // Get stats for the authenticated writer
  app.get("/api/writer/stats", hasRole(["writer"]), async (req, res, next) => {
    try {
      const stats = await storage.getWriterStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
