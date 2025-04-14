import { users, jobs, bids, orders, transactions, writerQuizzes } from "@shared/schema";
import type { 
  User, 
  InsertUser, 
  Job, 
  InsertJob, 
  Bid, 
  InsertBid, 
  Order, 
  InsertOrder, 
  Transaction, 
  InsertTransaction, 
  WriterQuiz, 
  InsertWriterQuiz
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

const PostgresStore = connectPg(session);

// Stats interfaces
interface WriterStats {
  balance: number;
  completedOrders: number;
  activeOrders: number;
  pendingBids: number;
}

interface ClientStats {
  postedJobs: number;
  activeOrders: number;
  completedOrders: number;
  totalSpent: number;
}

interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  totalOrders: number;
  totalRevenue: number;
  pendingWriters: number;
}

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  updateUserBalance(id: number, amount: number): Promise<User>;
  updateWriterApprovalStatus(id: number, status: 'approved' | 'rejected'): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Job methods
  getJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJobStatus(id: number, status: 'open' | 'in_progress' | 'completed' | 'cancelled'): Promise<Job>;
  
  // Bid methods
  getAllBids(): Promise<Bid[]>;
  getBid(id: number): Promise<Bid | undefined>;
  getBidsByJob(jobId: number): Promise<Bid[]>;
  getBidsByWriter(writerId: number): Promise<Bid[]>;
  getBidsByClient(clientId: number): Promise<Bid[]>;
  createBid(bid: InsertBid): Promise<Bid>;
  updateBidStatus(id: number, status: 'pending' | 'accepted' | 'rejected'): Promise<Bid>;
  rejectOtherBids(jobId: number, acceptedBidId: number): Promise<void>;
  
  // Order methods
  getAllOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByWriter(writerId: number): Promise<Order[]>;
  getOrdersByClient(clientId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: 'in_progress' | 'revision' | 'completed' | 'cancelled'): Promise<Order>;
  
  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  
  // Writer quiz methods
  submitWriterQuiz(quiz: InsertWriterQuiz): Promise<WriterQuiz>;
  getWriterQuiz(writerId: number): Promise<WriterQuiz | undefined>;
  
  // Stats methods
  getWriterStats(writerId: number): Promise<WriterStats>;
  getClientStats(clientId: number): Promise<ClientStats>;
  getAdminStats(): Promise<AdminStats>;
  
  // Session store
  sessionStore: any; // Use any type for sessionStore
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true
    });
    
    // Try to create admin user if not exists
    this.getUserByUsername("admin").then(user => {
      if (!user) {
        this.createUser({
          username: "admin",
          password: "$scrypt$N=32768,r=8,p=1,maxmem=67108864$c3R4M0AzUU5xcXphNVBCTW4xRlE2RmZiWE00MS9lRlVvL0ZoUkR0cVhsVT0=$L86+twYfb+6ME0W5VP/XXpnKG6pHUxEmjOC3PJK4eIg=", // password = "adminpass"
          email: "admin@sharpquill.com",
          fullName: "Admin User",
          role: "admin",
          bio: "System administrator",
          profileImage: null
        });
      }
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Ensure role is not undefined
    const role = insertUser.role || 'writer';
    
    const result = await db.insert(users).values({
      ...insertUser,
      role, // Explicitly set role to avoid undefined
      balance: 0,
      approvalStatus: role === 'writer' ? 'pending' : 'approved'
    }).returning();
    return result[0];
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error("User not found");
    }
    
    return result[0];
  }
  
  async updateUserBalance(id: number, amount: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const result = await db.update(users)
      .set({ balance: user.balance + amount })
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }
  
  async updateWriterApprovalStatus(id: number, status: 'approved' | 'rejected'): Promise<User> {
    const result = await db.update(users)
      .set({ approvalStatus: status })
      .where(eq(users.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error("User not found");
    }
    
    return result[0];
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  // Job methods
  async getJobs(): Promise<Job[]> {
    return await db.select().from(jobs);
  }
  
  async getJob(id: number): Promise<Job | undefined> {
    const result = await db.select().from(jobs).where(eq(jobs.id, id));
    return result[0];
  }
  
  async createJob(job: InsertJob): Promise<Job> {
    const result = await db.insert(jobs).values({
      ...job,
      status: 'open'
    }).returning();
    return result[0];
  }
  
  async updateJobStatus(id: number, status: 'open' | 'in_progress' | 'completed' | 'cancelled'): Promise<Job> {
    const result = await db.update(jobs)
      .set({ status })
      .where(eq(jobs.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error("Job not found");
    }
    
    return result[0];
  }
  
  // Bid methods
  async getAllBids(): Promise<Bid[]> {
    return await db.select().from(bids);
  }
  
  async getBid(id: number): Promise<Bid | undefined> {
    const result = await db.select().from(bids).where(eq(bids.id, id));
    return result[0];
  }
  
  async getBidsByJob(jobId: number): Promise<Bid[]> {
    return await db.select().from(bids).where(eq(bids.jobId, jobId));
  }
  
  async getBidsByWriter(writerId: number): Promise<Bid[]> {
    return await db.select().from(bids).where(eq(bids.writerId, writerId));
  }
  
  async getBidsByClient(clientId: number): Promise<Bid[]> {
    // Get all jobs by this client first
    const clientJobs = await db.select().from(jobs).where(eq(jobs.clientId, clientId));
    
    if (clientJobs.length === 0) {
      return [];
    }
    
    // For each job, get the bids separately and merge them
    const allBids: Bid[] = [];
    
    for (const job of clientJobs) {
      const jobBids = await db.select().from(bids).where(eq(bids.jobId, job.id));
      allBids.push(...jobBids);
    }
    
    return allBids;
  }
  
  async createBid(bid: InsertBid): Promise<Bid> {
    const result = await db.insert(bids).values({
      ...bid,
      status: 'pending'
    }).returning();
    return result[0];
  }
  
  async updateBidStatus(id: number, status: 'pending' | 'accepted' | 'rejected'): Promise<Bid> {
    const result = await db.update(bids)
      .set({ status })
      .where(eq(bids.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error("Bid not found");
    }
    
    return result[0];
  }
  
  async rejectOtherBids(jobId: number, acceptedBidId: number): Promise<void> {
    // Get all pending bids for this job
    const pendingBids = await db.select()
      .from(bids)
      .where(
        and(
          eq(bids.jobId, jobId),
          eq(bids.status, 'pending')
        )
      );
    
    // Filter out the accepted bid and update the rest
    for (const bid of pendingBids) {
      // Make sure we compare bid.id as a number
      const bidId = Number(bid.id);
      if (bidId !== acceptedBidId) {
        await db.update(bids)
          .set({ status: 'rejected' })
          .where(eq(bids.id, bidId));
      }
    }
  }
  
  // Order methods
  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id));
    return result[0];
  }
  
  async getOrdersByWriter(writerId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.writerId, writerId));
  }
  
  async getOrdersByClient(clientId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.clientId, clientId));
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values({
      ...order,
      status: 'in_progress',
      completedAt: null
    }).returning();
    return result[0];
  }
  
  async updateOrderStatus(id: number, status: 'in_progress' | 'revision' | 'completed' | 'cancelled'): Promise<Order> {
    const updateData: any = { status };
    
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }
    
    const result = await db.update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error("Order not found");
    }
    
    return result[0];
  }
  
  // Transaction methods
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values(transaction).returning();
    return result[0];
  }
  
  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db.select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }
  
  // Writer quiz methods
  async submitWriterQuiz(quiz: InsertWriterQuiz): Promise<WriterQuiz> {
    const result = await db.insert(writerQuizzes).values(quiz).returning();
    return result[0];
  }
  
  async getWriterQuiz(writerId: number): Promise<WriterQuiz | undefined> {
    const result = await db.select()
      .from(writerQuizzes)
      .where(eq(writerQuizzes.writerId, writerId));
    return result[0];
  }
  
  // Stats methods
  async getWriterStats(writerId: number): Promise<WriterStats> {
    const writer = await this.getUser(writerId);
    if (!writer) {
      throw new Error("Writer not found");
    }
    
    // Get pending bids
    const pendingBidsResult = await db.select({ count: bids.id })
      .from(bids)
      .where(
        and(
          eq(bids.writerId, writerId),
          eq(bids.status, 'pending')
        )
      );
    const pendingBids = pendingBidsResult[0]?.count || 0;
    
    // Get active and completed orders
    const activeOrdersResult = await db.select({ count: orders.id })
      .from(orders)
      .where(
        and(
          eq(orders.writerId, writerId),
          eq(orders.status, 'in_progress')
        )
      );
    const activeOrders = activeOrdersResult[0]?.count || 0;
    
    const completedOrdersResult = await db.select({ count: orders.id })
      .from(orders)
      .where(
        and(
          eq(orders.writerId, writerId),
          eq(orders.status, 'completed')
        )
      );
    const completedOrders = completedOrdersResult[0]?.count || 0;
    
    return {
      balance: writer.balance,
      completedOrders,
      activeOrders,
      pendingBids
    };
  }
  
  async getClientStats(clientId: number): Promise<ClientStats> {
    const client = await this.getUser(clientId);
    if (!client) {
      throw new Error("Client not found");
    }
    
    // Get posted jobs count
    const postedJobsResult = await db.select({ count: jobs.id })
      .from(jobs)
      .where(eq(jobs.clientId, clientId));
    const postedJobs = postedJobsResult[0]?.count || 0;
    
    // Get active orders
    const activeOrdersResult = await db.select({ count: orders.id })
      .from(orders)
      .where(
        and(
          eq(orders.clientId, clientId),
          eq(orders.status, 'in_progress')
        )
      );
    const activeOrders = activeOrdersResult[0]?.count || 0;
    
    // Get completed orders
    const completedOrdersResult = await db.select({ count: orders.id })
      .from(orders)
      .where(
        and(
          eq(orders.clientId, clientId),
          eq(orders.status, 'completed')
        )
      );
    const completedOrders = completedOrdersResult[0]?.count || 0;
    
    // Calculate total spent
    const spentResult = await db.select({
      total: orders.amount
    })
    .from(orders)
    .where(
      and(
        eq(orders.clientId, clientId),
        eq(orders.status, 'completed')
      )
    );
    
    const totalSpent = spentResult.reduce((sum, item) => sum + (item.total || 0), 0);
    
    return {
      postedJobs,
      activeOrders,
      completedOrders,
      totalSpent
    };
  }
  
  async getAdminStats(): Promise<AdminStats> {
    // Get total users
    const totalUsersResult = await db.select({ count: users.id }).from(users);
    const totalUsers = totalUsersResult[0]?.count || 0;
    
    // Get total jobs
    const totalJobsResult = await db.select({ count: jobs.id }).from(jobs);
    const totalJobs = totalJobsResult[0]?.count || 0;
    
    // Get total orders
    const totalOrdersResult = await db.select({ count: orders.id }).from(orders);
    const totalOrders = totalOrdersResult[0]?.count || 0;
    
    // Calculate total revenue (10% of completed orders)
    const completedOrdersResult = await db.select({
      total: orders.amount
    })
    .from(orders)
    .where(eq(orders.status, 'completed'));
    
    const totalRevenue = completedOrdersResult.reduce((sum, item) => sum + (item.total * 0.1), 0);
    
    // Get pending writers
    const pendingWritersResult = await db.select({ count: users.id })
      .from(users)
      .where(
        and(
          eq(users.role, 'writer'),
          eq(users.approvalStatus, 'pending')
        )
      );
    const pendingWriters = pendingWritersResult[0]?.count || 0;
    
    return {
      totalUsers,
      totalJobs,
      totalOrders,
      totalRevenue,
      pendingWriters
    };
  }
}

export const storage = new DatabaseStorage();
