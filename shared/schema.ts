import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum('user_role', ['writer', 'client', 'admin']);
export const jobStatusEnum = pgEnum('job_status', ['open', 'in_progress', 'completed', 'cancelled']);
export const bidStatusEnum = pgEnum('bid_status', ['pending', 'accepted', 'rejected']);
export const orderStatusEnum = pgEnum('order_status', ['in_progress', 'revision', 'completed', 'cancelled']);
export const paymentMethodEnum = pgEnum('payment_method', ['paypal', 'mpesa', 'bank_transfer']);
export const transactionTypeEnum = pgEnum('transaction_type', ['deposit', 'withdrawal', 'payment', 'refund']);
export const approvalStatusEnum = pgEnum('approval_status', ['pending', 'approved', 'rejected']);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull().default('writer'),
  bio: text("bio"),
  profileImage: text("profile_image"),
  balance: doublePrecision("balance").notNull().default(0),
  approvalStatus: approvalStatusEnum("approval_status").notNull().default('pending'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  budget: doublePrecision("budget").notNull(),
  deadline: integer("deadline").notNull(), // days
  pages: integer("pages"),
  status: jobStatusEnum("status").notNull().default('open'),
  attachments: text("attachments"), // Comma-separated list of file paths
  metadata: text("metadata"), // JSON string for additional job info
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  writerId: integer("writer_id").notNull().references(() => users.id),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  amount: doublePrecision("amount").notNull(),
  deliveryTime: integer("delivery_time").notNull(), // days
  coverLetter: text("cover_letter").notNull(),
  status: bidStatusEnum("status").notNull().default('pending'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  bidId: integer("bid_id").notNull().references(() => bids.id),
  clientId: integer("client_id").notNull().references(() => users.id),
  writerId: integer("writer_id").notNull().references(() => users.id),
  status: orderStatusEnum("status").notNull().default('in_progress'),
  amount: doublePrecision("amount").notNull(),
  deadline: timestamp("deadline").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: doublePrecision("amount").notNull(),
  type: transactionTypeEnum("type").notNull(),
  status: text("status").notNull(),
  paymentMethod: paymentMethodEnum("payment_method"),
  orderId: integer("order_id").references(() => orders.id),
  paymentDetails: text("payment_details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const writerQuizzes = pgTable("writer_quizzes", {
  id: serial("id").primaryKey(),
  writerId: integer("writer_id").notNull().references(() => users.id),
  score: integer("score").notNull(),
  answers: text("answers").notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  balance: true,
  approvalStatus: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertBidSchema = createInsertSchema(bids).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  status: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertWriterQuizSchema = createInsertSchema(writerQuizzes).omit({
  id: true,
  submittedAt: true,
});

// Types for select
export type User = typeof users.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Bid = typeof bids.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type WriterQuiz = typeof writerQuizzes.$inferSelect;

// Types for insert
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type InsertBid = z.infer<typeof insertBidSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertWriterQuiz = z.infer<typeof insertWriterQuizSchema>;

// Stats interfaces
export interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  totalOrders: number;
  totalRevenue: number;
  pendingWriters: number;
}

// Writer stats interface
export interface WriterStats {
  balance: number;
  completedOrders: number;
  activeOrders: number;
  pendingBids: number;
}

// Extended types for frontend use
export interface BidWithDetails extends Bid {
  writerUsername?: string;
  writerName?: string;
  proposal?: string; // For backward compatibility, coverLetter is used in database
  stats?: {
    completedOrders: number;
    activeOrders: number;
    pendingBids: number;
  };
}

export interface OrderWithDetails extends Order {
  jobTitle?: string;
  writerUsername?: string;
  clientUsername?: string;
  revisionNotes?: string;
}
