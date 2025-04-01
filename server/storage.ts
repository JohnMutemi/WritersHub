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
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private jobs: Map<number, Job>;
  private bids: Map<number, Bid>;
  private orders: Map<number, Order>;
  private transactions: Map<number, Transaction>;
  private writerQuizzes: Map<number, WriterQuiz>;
  sessionStore: any;
  
  private userIdCounter: number = 1;
  private jobIdCounter: number = 1;
  private bidIdCounter: number = 1;
  private orderIdCounter: number = 1;
  private transactionIdCounter: number = 1;
  private quizIdCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.jobs = new Map();
    this.bids = new Map();
    this.orders = new Map();
    this.transactions = new Map();
    this.writerQuizzes = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Create admin user
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

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      balance: 0,
      approvalStatus: insertUser.role === 'writer' ? 'pending' : 'approved',
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserBalance(id: number, amount: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { 
      ...user, 
      balance: user.balance + amount 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateWriterApprovalStatus(id: number, status: 'approved' | 'rejected'): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { 
      ...user, 
      approvalStatus: status 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Job methods
  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }
  
  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }
  
  async createJob(job: InsertJob): Promise<Job> {
    const id = this.jobIdCounter++;
    const now = new Date();
    const newJob: Job = {
      ...job,
      id,
      status: 'open',
      createdAt: now
    };
    this.jobs.set(id, newJob);
    return newJob;
  }
  
  async updateJobStatus(id: number, status: 'open' | 'in_progress' | 'completed' | 'cancelled'): Promise<Job> {
    const job = await this.getJob(id);
    if (!job) {
      throw new Error("Job not found");
    }
    
    const updatedJob = { 
      ...job, 
      status
    };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }
  
  // Bid methods
  async getAllBids(): Promise<Bid[]> {
    return Array.from(this.bids.values());
  }
  
  async getBid(id: number): Promise<Bid | undefined> {
    return this.bids.get(id);
  }
  
  async getBidsByJob(jobId: number): Promise<Bid[]> {
    return Array.from(this.bids.values()).filter(bid => bid.jobId === jobId);
  }
  
  async getBidsByWriter(writerId: number): Promise<Bid[]> {
    return Array.from(this.bids.values()).filter(bid => bid.writerId === writerId);
  }
  
  async getBidsByClient(clientId: number): Promise<Bid[]> {
    // Get all jobs by this client
    const clientJobs = Array.from(this.jobs.values()).filter(job => job.clientId === clientId);
    const clientJobIds = clientJobs.map(job => job.id);
    
    // Get all bids for these jobs
    return Array.from(this.bids.values()).filter(bid => clientJobIds.includes(bid.jobId));
  }
  
  async createBid(bid: InsertBid): Promise<Bid> {
    const id = this.bidIdCounter++;
    const now = new Date();
    const newBid: Bid = {
      ...bid,
      id,
      status: 'pending',
      createdAt: now
    };
    this.bids.set(id, newBid);
    return newBid;
  }
  
  async updateBidStatus(id: number, status: 'pending' | 'accepted' | 'rejected'): Promise<Bid> {
    const bid = await this.getBid(id);
    if (!bid) {
      throw new Error("Bid not found");
    }
    
    const updatedBid = { 
      ...bid, 
      status
    };
    this.bids.set(id, updatedBid);
    return updatedBid;
  }
  
  async rejectOtherBids(jobId: number, acceptedBidId: number): Promise<void> {
    const bids = await this.getBidsByJob(jobId);
    
    for (const bid of bids) {
      if (bid.id !== acceptedBidId && bid.status === 'pending') {
        await this.updateBidStatus(bid.id, 'rejected');
      }
    }
  }
  
  // Order methods
  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async getOrdersByWriter(writerId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.writerId === writerId);
  }
  
  async getOrdersByClient(clientId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.clientId === clientId);
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const now = new Date();
    const newOrder: Order = {
      ...order,
      id,
      status: 'in_progress',
      completedAt: null,
      createdAt: now
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }
  
  async updateOrderStatus(id: number, status: 'in_progress' | 'revision' | 'completed' | 'cancelled'): Promise<Order> {
    const order = await this.getOrder(id);
    if (!order) {
      throw new Error("Order not found");
    }
    
    const updatedOrder: Order = { 
      ...order, 
      status,
      completedAt: status === 'completed' ? new Date() : order.completedAt
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  // Transaction methods
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const now = new Date();
    const newTransaction: Transaction = {
      ...transaction,
      id,
      createdAt: now
    };
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }
  
  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      transaction => transaction.userId === userId
    );
  }
  
  // Writer quiz methods
  async submitWriterQuiz(quiz: InsertWriterQuiz): Promise<WriterQuiz> {
    const id = this.quizIdCounter++;
    const now = new Date();
    const newQuiz: WriterQuiz = {
      ...quiz,
      id,
      submittedAt: now
    };
    this.writerQuizzes.set(id, newQuiz);
    return newQuiz;
  }
  
  async getWriterQuiz(writerId: number): Promise<WriterQuiz | undefined> {
    return Array.from(this.writerQuizzes.values()).find(
      quiz => quiz.writerId === writerId
    );
  }
  
  // Stats methods
  async getWriterStats(writerId: number): Promise<WriterStats> {
    const writer = await this.getUser(writerId);
    if (!writer) {
      throw new Error("Writer not found");
    }
    
    const pendingBids = (await this.getBidsByWriter(writerId)).filter(
      bid => bid.status === 'pending'
    ).length;
    
    const orders = await this.getOrdersByWriter(writerId);
    const activeOrders = orders.filter(order => order.status === 'in_progress').length;
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    
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
    
    const postedJobs = Array.from(this.jobs.values()).filter(
      job => job.clientId === clientId
    ).length;
    
    const orders = await this.getOrdersByClient(clientId);
    const activeOrders = orders.filter(order => order.status === 'in_progress').length;
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    
    const completedOrdersArray = orders.filter(order => order.status === 'completed');
    const totalSpent = completedOrdersArray.reduce((sum, order) => sum + order.amount, 0);
    
    return {
      postedJobs,
      activeOrders,
      completedOrders,
      totalSpent
    };
  }
  
  async getAdminStats(): Promise<AdminStats> {
    const totalUsers = this.users.size;
    const totalJobs = this.jobs.size;
    const totalOrders = this.orders.size;
    
    const completedOrders = Array.from(this.orders.values()).filter(
      order => order.status === 'completed'
    );
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.amount * 0.1), 0); // 10% commission
    
    const pendingWriters = Array.from(this.users.values()).filter(
      user => user.role === 'writer' && user.approvalStatus === 'pending'
    ).length;
    
    return {
      totalUsers,
      totalJobs,
      totalOrders,
      totalRevenue,
      pendingWriters
    };
  }
}

export const storage = new MemStorage();
