import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import MemoryStore from "memorystore";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from './storage';
import { NotificationService } from './notification-service';
import type { InsertUser, InsertPost, InsertSubscription, InsertSubscriptionTier, InsertComment, InsertNotification, User, InsertCategory, InsertCreatorCategory } from '@shared/schema';
import { insertUserSchema, insertPostSchema, insertSubscriptionSchema, insertSubscriptionTierSchema, insertCommentSchema, insertReportSchema, insertCreatorPayoutSettingsSchema, insertCategorySchema, insertCreatorCategorySchema } from "@shared/schema";
import { db, pool } from './db';
import { users, posts, comments, post_likes, comment_likes, subscriptions, subscription_tiers, reports, creator_likes, creator_favorites, users as usersTable, posts as postsTable, subscriptions as subscriptionsTable, subscription_tiers as tiersTable, comments as commentsTable, conversations as conversationsTable, messages as messagesTable } from '../shared/schema';
import { eq, desc, and, gte, lte, count, sum, sql, inArray, asc, like, or, isNull, gt, lt } from 'drizzle-orm';
import paymentRoutes from './routes/payment';
import paymentTestRoutes from './routes/payment-test';
import payoutRoutes from './routes/payouts';
import adminRoutes from './routes/admin';
import { authenticateToken } from "./middleware/auth";
import bcrypt from "bcryptjs";
import * as schema from '../shared/schema';
import jwt from 'jsonwebtoken';

// Extend Express session interface
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    user?: any;
  }
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

const JWT_SECRET = process.env.SESSION_SECRET || 'xclusive-secret-key-2024';

export async function registerRoutes(app: Express): Promise<Server> {
  // Use memory store for development
  const MemoryStoreSession = MemoryStore(session);
  const sessionStore = new MemoryStoreSession({
    checkPeriod: 86400000, // Prune expired entries every 24h
  });

  // Configure session middleware
  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadsDir));

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log('Login attempt received:', { email: req.body?.email });
      const { email, password } = req.body;

      if (!email || !password) {
        console.log('Missing email or password');
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Demo users for development
      const DEMO_USERS = [
        {
          id: 1,
          email: 'admin@xclusive.com',
          username: 'admin',
          role: 'admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          email: 'creator@example.com',
          username: 'amazingcreator',
          role: 'creator',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5fd?w=150&h=150&fit=crop&crop=face',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 3,
          email: 'fan@example.com',
          username: 'loyalfan',
          role: 'fan',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      // Check demo users first (for development)
      if (password === 'demo123') {
        const demoUser = DEMO_USERS.find(u => u.email === email);
        if (demoUser) {
          console.log('Demo user login successful:', demoUser.email);
          // Set session data
          req.session.userId = demoUser.id;
          req.session.user = demoUser;
          return res.json({ user: demoUser });
        }
      }

      // Try database authentication
      console.log('Attempting database authentication for:', email);
      const user = await storage.getUserByEmail(email);

      if (!user) {
        console.log('User not found:', email);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await storage.verifyPassword(password, user.password);
      if (!isValidPassword) {
        console.log('Invalid password for user:', email);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check if user is suspended
      if (user.status === 'suspended') {
        console.log('User suspended:', email);
        return res.status(403).json({ 
          error: "Your account has been suspended. Please contact support for assistance.",
          suspended: true 
        });
      }

      const { password: _, ...userWithoutPassword } = user;

      // Set session data
      req.session.userId = user.id;
      req.session.user = userWithoutPassword;

      console.log('Database user login successful:', user.email);
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Login failed", details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      console.log('Registration request received:', req.body);

      // Extract category data from request
      const { primaryCategoryId, ...userData } = req.body;

      // Validate input data
      const validatedData = insertUserSchema.parse(userData);
      console.log('Validated data:', { ...validatedData, password: '[HIDDEN]' });

      // Check if user already exists by email
      try {
        const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
        if (existingUserByEmail) {
          console.log('Email already exists:', validatedData.email);
          return res.status(400).json({ error: "Email already exists" });
        }
      } catch (error) {
        console.log('Email check error (user probably doesn\'t exist):', error);
      }

      // Check if user already exists by username
      try {
        const existingUserByUsername = await storage.getUserByUsername(validatedData.username);
        if (existingUserByUsername) {
          console.log('Username already exists:', validatedData.username);
          return res.status(400).json({ error: "Username already exists" });
        }
      } catch (error) {
        console.log('Username check error (user probably doesn\'t exist):', error);
      }

      // For creators, validate primary category exists
      if (validatedData.role === 'creator' && primaryCategoryId) {
        const category = await storage.getCategory(primaryCategoryId);
        if (!category) {
          return res.status(400).json({ error: "Invalid category selected" });
        }
      }

      // Create the user with primary category
      console.log('Creating user...');
      const userDataWithCategory = {
        ...validatedData,
        primary_category_id: validatedData.role === 'creator' ? primaryCategoryId : null
      };
      const user = await storage.createUser(userDataWithCategory);
      console.log('User created successfully:', user.id);

      if (!user) {
        throw new Error('Failed to create user account');
      }

      // Add creator to category if category was selected
      if (validatedData.role === 'creator' && primaryCategoryId) {
        try {
          await storage.addCreatorToCategory({
            creator_id: user.id,
            category_id: primaryCategoryId,
            is_primary: true
          });
          console.log('Creator added to primary category:', primaryCategoryId);
        } catch (error) {
          console.error('Failed to add creator to category:', error);
          // Don't fail registration if category assignment fails
        }
      }

      const { password: _, ...userWithoutPassword } = user;

      // Set session data
      req.session.userId = user.id;
      req.session.user = userWithoutPassword;

      console.log('Registration successful for user:', user.id);
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Registration error:', error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('duplicate key')) {
          return res.status(400).json({ error: "User already exists" });
        }
        if (error.message.includes('validation')) {
          return res.status(400).json({ error: "Invalid input data" });
        }
      }

      res.status(500).json({ 
        error: "Failed to create user account", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Session verification endpoint
  app.get("/api/auth/verify", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Return user data from session
      res.json({ user: req.session.user });
    } catch (error) {
      console.error('Session verification error:', error);
      res.status(500).json({ error: "Failed to verify session" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          return res.status(500).json({ error: "Failed to logout" });
        }
        res.json({ success: true });
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: "Failed to logout" });
    }
  });

  // User routes (more specific routes first)
  app.get("/api/users/username/:username", async (req, res) => {
    try {
      const username = req.params.username;
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Add caching headers for user profiles
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Add caching headers for user profiles
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Delete user account (this would typically cascade delete related data)
      const deleted = await storage.deleteUser(userId);

      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete account" });
      }

      res.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // Post routes
  // Get all posts for feed and creator content
  // Get all posts endpoint
  app.get("/api/posts", async (req, res) => {
    try {
      const { status, creatorId, includeAll } = req.query;

      console.log('Fetching posts with params:', { status, creatorId, includeAll });

      let query = `
        SELECT 
          posts.*,
          users.username,
          users.avatar,
          users.display_name,
          json_build_object(
            'id', users.id,
            'username', users.username,
            'display_name', users.display_name,
            'avatar', users.avatar
          ) as creator
        FROM posts 
        LEFT JOIN users ON posts.creator_id = users.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (includeAll === 'true') {
        // For Content Manager - include all posts regardless of status or schedule
        // No additional status filtering
      } else if (status && status !== 'all') {
        query += ` AND posts.status = $${params.length + 1}`;
        params.push(status);
      } else {
        // Default behavior for profile views - show only published posts and scheduled posts that are due
        query += ` AND (posts.status = 'published' OR (posts.status = 'scheduled' AND posts.scheduled_for <= NOW()))`;
      }

      if (creatorId) {
        query += ` AND posts.creator_id = $${params.length + 1}`;
        params.push(parseInt(creatorId as string));
      }

      query += ` ORDER BY posts.created_at DESC`;

      const result = await pool.query(query, params);

      console.log(`Found ${result.rows.length} posts`);

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      const user = await storage.getUser(post.creator_id);
      const postWithUser = {
        ...post,
        creator: user ? {
          id: user.id,
          username: user.username,
          avatar: user.avatar
        } : null
      };

      res.json(postWithUser);
    } catch (error) {
      console.error('Get post error:', error);
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });

  // Create post
  app.post('/api/posts', async (req, res) => {
    try {
      const { creator_id, title, content, media_type, media_urls, tier, status, scheduled_for } = req.body;

      console.log('Creating post with data:', { creator_id, content, media_type, media_urls, tier, status });

      // Validate required fields
      if (!creator_id) {
        return res.status(400).json({ error: 'Creator ID is required' });
      }

      if (!content && (!media_urls || media_urls.length === 0)) {
        return res.status(400).json({ error: 'Post must have content or media' });
      }

      if (!tier) {
        return res.status(400).json({ error: 'Access tier is required' });
      }

      const postData: any = {
        creator_id: parseInt(creator_id),
        title: title || 'Untitled Post',
        content: content || '',
        media_type: media_type || 'text',
        media_urls: Array.isArray(media_urls) ? media_urls : (media_urls ? [media_urls] : []),
        tier,
        status: status || 'published',
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Only add scheduled_for if it's provided and status is scheduled
      if (scheduled_for && status === 'scheduled') {
        const scheduledDate = new Date(scheduled_for);
        if (scheduledDate <= new Date()) {
          return res.status(400).json({ error: 'Scheduled date must be in the future' });
        }
        postData.scheduled_for = scheduledDate;
      }

      const newPost = await db.insert(posts).values(postData).returning();

      console.log('Post created successfully:', newPost[0].id);

      // If post is published, notify all subscribers
      if (postData.status === 'published') {
        try {
          // Get all subscribers for this creator
          const subscribersResult = await db
            .select({ fan_id: subscriptions.fan_id })
            .from(subscriptions)
            .where(and(
              eq(subscriptions.creator_id, parseInt(creator_id)),
              eq(subscriptions.status, 'active')
            ));

          const subscriberIds = subscribersResult.map(sub => sub.fan_id);

          if (subscriberIds.length > 0) {
            await NotificationService.notifyNewPost(
              parseInt(creator_id),
              subscriberIds,
              newPost[0].title,
              newPost[0].id
            );
            console.log(`Sent notifications to ${subscriberIds.length} subscribers for new post`);
          }
        } catch (notificationError) {
          console.error('Failed to send notifications for new post:', notificationError);
          // Don't fail the post creation if notifications fail
        }
      }

      res.json(newPost[0]);
    } catch (error) {
      console.error('Error creating post:', error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('foreign key')) {
          res.status(400).json({ error: 'Invalid creator ID or tier' });
        } else if (error.message.includes('duplicate')) {
          res.status(400).json({ error: 'Post already exists' });
        } else {
          res.status(500).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: 'Failed to create post' });
      }
    }
  });

  app.put("/api/posts/:id", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);

      // Handle date conversion for scheduled_for field
      const updateData = { ...req.body };
      if (updateData.scheduled_for && typeof updateData.scheduled_for === 'string') {
        updateData.scheduled_for = new Date(updateData.scheduled_for);
      }

      const post = await storage.updatePost(postId, updateData);

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      res.json(post);
    } catch (error) {
      console.error('Update post error:', error);
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  app.delete("/api/posts/:id", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);

      // Check if post exists
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Delete the post
      const deleted = await storage.deletePost(postId);

      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete post" });
      }

      res.json({ success: true, message: "Post deleted successfully" });
    } catch (error) {
      console.error('Delete post error:', error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  // Comment routes
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const comments = await storage.getComments(postId);

      // Enrich comments with user information and organize replies
      const commentsWithUsers = await Promise.all(
        comments.map(async (comment) => {
          const user = await storage.getUser(comment.user_id);
          return {
            ...comment,
            user: user ? {
              id: user.id,
              username: user.username,
              avatar: user.avatar
            } : null
          };
        })
      );

      // Organize comments and replies
      const topLevelComments = commentsWithUsers.filter(c => !c.parent_id);
      const repliesMap = new Map();

      commentsWithUsers.filter(c => c.parent_id).forEach(reply => {
        const parentId = reply.parent_id;
        if (!repliesMap.has(parentId)) {
          repliesMap.set(parentId, []);
        }
        repliesMap.get(parentId).push(reply);
      });

      const organizedComments = topLevelComments.map(comment => ({
        ...comment,
        replies: repliesMap.get(comment.id) || []
      }));

      res.json(organizedComments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/posts/:postId/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      console.log('Creating comment with data:', { ...req.body, post_id: postId });

      const validatedData = insertCommentSchema.parse({
        ...req.body,
        user_id: parseInt(req.body.user_id),
        post_id: postId
      });

      const comment = await storage.createComment(validatedData);
      const user = await storage.getUser(comment.user_id);

      const commentWithUser = {
        ...comment,
        user: user ? {
          id: user.id,
          username: user.username,
          avatar: user.avatar
        } : null
      };

      // Send notification to post creator
      const post = await storage.getPost(postId);
      if (post && post.creator_id !== comment.user_id) { // Don't notify if creator comments on their own post
        console.log(`Sending comment notification to creator ${post.creator_id} for post ${postId} from user ${comment.user_id}`);
        try {
          await NotificationService.notifyNewComment(
            post.creator_id,
            comment.user_id,
            postId,
            post.title || post.content || 'your post',
            comment.content
          );
          console.log('Comment notification sent successfully');
        } catch (notificationError) {
          console.error('Failed to send comment notification:', notificationError);
        }
      } else if (post && post.creator_id === comment.user_id) {
        console.log('Skipping notification - creator commented on their own post');
      } else {
        console.log('Post not found for comment notification');
      }

      res.json(commentWithUser);
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  // Like routes
  app.post("/api/posts/:postId/like", async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const { userId } = req.body;

      const success = await storage.likePost(postId, userId);

      if (success) {
        // Get post details for notification
        const post = await storage.getPost(postId);

        if (post && post.creator_id !== userId) { // Don't notify if creator likes their own post
          console.log(`Sending like notification to creator ${post.creator_id} for post ${postId} from user ${userId}`);
          try {
            await NotificationService.notifyPostLike(
              post.creator_id, 
              userId, 
              postId, 
              post.title || post.content || 'your post'
            );
            console.log('Like notification sent successfully');
          } catch (notificationError) {
            console.error('Failed to send like notification:', notificationError);
          }
        } else if (post && post.creator_id === userId) {
          console.log('Skipping notification - creator liked their own post');
        } else {
          console.log('Post not found for like notification');
        }
      }

      res.json({ success });
    } catch (error) {
      console.error('Error liking post:', error);
      res.status(500).json({ error: "Failed to like post" });
    }
  });

  app.delete("/api/posts/:postId/like", async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const { userId } = req.body;

      const success = await storage.unlikePost(postId, userId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to unlike post" });
    }
  });

  app.get("/api/posts/:postId/like/:userId", async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const userId = parseInt(req.params.userId);

      const liked = await storage.isPostLiked(postId, userId);
      res.json({ liked });
    } catch (error) {
      res.status(500).json({ error: "Failed to check like status" });
    }
  });

  app.post("/api/comments/:commentId/like", async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const { userId } = req.body;

      const success = await storage.likeComment(commentId, userId);

      if (success) {
        // Get comment details for notification
        const comment = await storage.getComment(commentId);

        if (comment && comment.user_id !== userId) { // Don't notify if user likes their own comment
          // Get the post details to include in notification
          const post = await storage.getPost(comment.post_id);

          if (post) {
            console.log(`Sending comment like notification to comment author ${comment.user_id} for comment ${commentId} from user ${userId}`);
            try {
              await NotificationService.notifyCommentLike(
                comment.user_id,
                userId,
                commentId,
                comment.post_id,
                post.title || post.content || 'a post'
              );
              console.log('Comment like notification sent successfully');
            } catch (notificationError) {
              console.error('Failed to send comment like notification:', notificationError);
            }
          }
        } else if (comment && comment.user_id === userId) {
          console.log('Skipping notification - user liked their own comment');
        } else {
          console.log('Comment not found for like notification');
        }
      }

      res.json({ success });
    } catch (error) {
      console.error('Error liking comment:', error);
      res.status(500).json({ error: "Failed to like comment" });
    }
  });

  app.delete("/api/comments/:commentId/like", async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const { userId } = req.body;

      const success = await storage.unlikeComment(commentId, userId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to unlike comment" });
    }
  });

  app.get("/api/comments/:commentId/like/:userId", async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const userId = parseInt(req.params.userId);

      const liked = await storage.isCommentLiked(commentId, userId);
      res.json({ liked });
    } catch (error) {
      res.status(500).json({ error: "Failed to check like status" });
    }
  });

  // Subscription tier routes
  app.get("/api/creators/:creatorId/tiers", async (req, res) => {
    try {
      const creatorId = parseInt(req.params.creatorId);
      const tiers = await storage.getSubscriptionTiers(creatorId);
      res.json(tiers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscription tiers" });
    }
  });

  // Get subscription tier performance data
  app.get("/api/creator/:creatorId/tier-performance", async (req, res) => {
    try {
      const creatorId = parseInt(req.params.creatorId);
      const tierPerformance = await storage.getSubscriptionTierPerformance(creatorId);

      // Ensure all numeric fields are properly converted
      const formattedTierPerformance = tierPerformance.map(tier => ({
        ...tier,
        subscribers: Number(tier.subscribers),
        revenue: Number(tier.revenue),
        price: Number(tier.price)
      }));

      console.log('Tier performance data being sent:', formattedTierPerformance);
      res.json(formattedTierPerformance);
    } catch (error) {
      console.error('Error fetching tier performance:', error);
      res.status(500).json({ error: "Failed to fetch tier performance" });
    }
  });

  app.post("/api/creators/:creatorId/tiers", async (req, res) => {
    try {
      const creatorId = parseInt(req.params.creatorId);
      console.log('Creating tier for creator:', creatorId, 'with data:', req.body);

      // Process the request data to match schema requirements
      const tierData = {
        ...req.body,
        creator_id: creatorId,
        // Keep benefits as array - don't stringify it
        benefits: Array.isArray(req.body.benefits) ? req.body.benefits : (req.body.benefits ? [req.body.benefits] : [])
      };

      // Skip schema validation for now due to benefits array issue
      const tier = await storage.createSubscriptionTier(tierData as any);
      res.json(tier);
    } catch (error) {
      console.error('Create subscription tier error:', error);
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to create subscription tier" });
      }
    }
  });

  app.put("/api/tiers/:tierId", async (req, res) => {
    try {
      const tierId = parseInt(req.params.tierId);
      const tier = await storage.updateSubscriptionTier(tierId, req.body);

      if (!tier) {
        return res.status(404).json({ error: "Tier not found" });
      }

      res.json(tier);
    } catch (error) {
      res.status(500).json({ error: "Failed to update subscription tier" });
    }
  });

  app.delete("/api/tiers/:tierId", async (req, res) => {
    try {
      const tierId = parseInt(req.params.tierId);
      const deleted = await storage.deleteSubscriptionTier(tierId);
      if (!deleted) {
        return res.status(404).json({ error: "Tier not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete subscription tier" });
    }
  });

  // Subscription routes
  app.get("/api/users/:userId/subscriptions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const subscriptions = await storage.getSubscriptions(userId);
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  // Check if user is subscribed to specific creator
  app.get("/api/subscriptions/user/:userId/creator/:creatorId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const creatorId = parseInt(req.params.creatorId);

      console.log(`Checking subscription API: user ${userId} to creator ${creatorId}`);

      const subscription = await storage.getUserSubscriptionToCreator(userId, creatorId);

      console.log('Found subscription:', subscription);

      // Only return subscription if it exists and is active
      if (subscription && subscription.status === 'active') {
        console.log(`✓ Active subscription found: ${subscription.id}`);
        // Include tier information for proper access control
        const enrichedSubscription = {
          ...subscription,
          tier_name: subscription.tier_name || 'unknown'
        };
        res.json(enrichedSubscription);
      } else {
        console.log(`✗ No active subscription found`);
        res.status(404).json(null);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      res.status(500).json({ error: "Failed to check subscription status" });
    }
  });

  app.post("/api/subscriptions", async (req, res) => {
    try {
      console.log('Creating subscription with data:', req.body);

      // Convert data types before validation
      const processedData = {
        ...req.body,
        fan_id: parseInt(req.body.fan_id),
        creator_id: parseInt(req.body.creator_id),
        tier_id: parseInt(req.body.tier_id),
        started_at: req.body.started_at ? new Date(req.body.started_at) : new Date(),
        next_billing_date: req.body.next_billing_date ? new Date(req.body.next_billing_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ends_at: req.body.ends_at ? new Date(req.body.ends_at) : null,
        auto_renew: req.body.auto_renew !== undefined ? req.body.auto_renew : true // Default to true
      };

      // Remove undefined values and handle null properly
      Object.keys(processedData).forEach(key => {
        if (processedData[key] === undefined) {
          delete processedData[key];
        }
      });

      const validatedData = insertSubscriptionSchema.parse(processedData);
      console.log('Validated data:', validatedData);

      // Check if user already has active subscription to this creator
      const existingSubscription = await storage.getUserSubscriptionToCreator(
        validatedData.fan_id,
        validatedData.creator_id
      );

      if (existingSubscription) {
        console.log('User already has subscription:', existingSubscription);
        return res.status(400).json({ error: "Already subscribed to this creator" });
      }

      const subscription = await storage.createSubscription(validatedData);
      console.log('Created subscription:', subscription);

      // Update creator's total subscriber count
      try {
        const currentSubscribers = await storage.getCreatorSubscribers(validatedData.creator_id);
        const subscriberCount = currentSubscribers.length;
        await storage.updateUser(validatedData.creator_id, { 
          total_subscribers: subscriberCount 
        });
        console.log("Updated creator " + validatedData.creator_id + " subscriber count to " + subscriberCount);
      } catch (error) {
        console.error('Error updating creator subscriber count:', error);
        // Don't fail the subscription creation if count update fails
      }

      // Notify creator of new subscriber
      try {
          // Get tier name for the notification
          const tier = await storage.getSubscriptionTier(validatedData.tier_id);
          const tierName = tier?.name || 'unknown';

          console.log(`Creating new subscriber notification: creator=${validatedData.creator_id}, fan=${validatedData.fan_id}, tier=${tierName}`);

          await NotificationService.notifyNewSubscriber(
              validatedData.creator_id,
              validatedData.fan_id,
              tierName
          );
          console.log(`✅ Sent notification to creator ${validatedData.creator_id} for new subscriber ${validatedData.fan_id} (${tierName} tier)`);
      } catch (notificationError) {
          console.error('❌ Failed to send new subscriber notification:', notificationError);
          // Don't fail the subscription creation if notification fails
      }

      res.json(subscription);
    } catch (error) {
      console.error('Subscription creation error:', error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  // Update subscription status (pause/resume) or auto-renew setting
  app.put("/api/subscriptions/:id", async (req, res) => {
    try {
      const subscriptionId = parseInt(req.params.id);
      const { status, auto_renew } = req.body;

      if (!status && auto_renew === undefined) {
        return res.status(400).json({ error: "Status or auto_renew is required" });
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (auto_renew !== undefined) updateData.auto_renew = auto_renew;

      await db
        .update(subscriptionsTable)
        .set(updateData)
        .where(eq(subscriptionsTable.id, subscriptionId));

      res.json({ success: true, message: "Subscription updated successfully" });
    } catch (error) {
      console.error('Error updating subscription:', error);
      res.status(500).json({ error: "Failed to update subscription" });
    }
  });

  // Cancel subscription endpoint
  app.put("/api/subscriptions/:subscriptionId/cancel", async (req, res) => {
    try {
      const subscriptionId = parseInt(req.params.subscriptionId);
      const success = await storage.cancelSubscription(subscriptionId);

      if (!success) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      res.json({ message: "Subscription cancelled successfully" });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  // Get fan subscriptions
  app.get('/api/subscriptions/fan/:fanId', async (req, res) => {
    try {
      const fanId = parseInt(req.params.fanId);

      console.log('Fetching subscriptions for fan ID:', fanId);

      const subscriptions = await db
        .select({
          id: subscriptionsTable.id,
          status: subscriptionsTable.status,
          current_period_end: subscriptionsTable.next_billing_date,
          created_at: subscriptionsTable.created_at,
          auto_renew: subscriptionsTable.auto_renew,
          creator: {
            id: usersTable.id,
            username: usersTable.username,
            display_name: usersTable.display_name,
            avatar: usersTable.avatar
          },
          tier: {
            name: tiersTable.name,
            price: tiersTable.price
          }
        })
        .from(subscriptionsTable)
        .innerJoin(usersTable, eq(subscriptionsTable.creator_id, usersTable.id))
        .innerJoin(tiersTable, eq(subscriptionsTable.tier_id, tiersTable.id))
        .where(eq(subscriptionsTable.fan_id, fanId));

      console.log('Found subscriptions:', subscriptions);

      res.json(subscriptions);
    } catch (error) {
      console.error('Error fetching fan subscriptions:', error);
      res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
  });

  // Get recent activity for a fan
  app.get('/api/fan/:fanId/recent-activity', async (req, res) => {
    try {
      const fanId = parseInt(req.params.fanId);
      const limit = parseInt(req.query.limit as string) || 20; // Default to 20, increased from 10
      const offset = parseInt(req.query.offset as string) || 0;

      // Get subscribed creators
      const subscribedCreators = await db
        .select({
          creator_id: subscriptionsTable.creator_id
        })
        .from(subscriptionsTable)
        .where(and(
          eq(subscriptionsTable.fan_id, fanId),
          eq(subscriptionsTable.status, 'active')
        ));

      if (subscribedCreators.length === 0) {
        return res.json({ activities: [], total: 0, hasMore: false });
      }

      const creatorIds = subscribedCreators.map(sub => sub.creator_id);

      // Data retention policy: Only show activity from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get total count for pagination (within 30-day window)
      const totalCountResult = await db
        .select({ count: count() })
        .from(postsTable)
        .where(and(
          inArray(postsTable.creator_id, creatorIds),
          eq(postsTable.status, 'published'),
          gte(postsTable.created_at, thirtyDaysAgo)
        ));

      const totalCount = totalCountResult[0]?.count || 0;

      // Get recent posts from subscribed creators with pagination (last 30 days only)
      const recentPosts = await db
        .select({
          id: postsTable.id,
          title: postsTable.title,
          content: postsTable.content,
          media_type: postsTable.media_type,
          created_at: postsTable.created_at,
          creator: {
            id: usersTable.id,
            username: usersTable.username,
            display_name: usersTable.display_name,
            avatar: usersTable.avatar
          }
        })
        .from(postsTable)
        .innerJoin(usersTable, eq(postsTable.creator_id, usersTable.id))
        .where(and(
          inArray(postsTable.creator_id, creatorIds),
          eq(postsTable.status, 'published'),
          gte(postsTable.created_at, thirtyDaysAgo)
        ))
        .orderBy(desc(postsTable.created_at))
        .limit(limit)
        .offset(offset);

      // Format the activity data
      const activities = recentPosts.map(post => ({
        id: post.id.toString(),
        type: 'new_post',
        creator: post.creator.display_name || post.creator.username,
        message: "shared a new " + (post.media_type === 'video' ? 'video' : 'post'),
        time: formatTimeAgo(new Date(post.created_at)),
        avatar: post.creator.avatar || '/placeholder.svg'
    }));

    // For backward compatibility, return just the array if no pagination params
    if (!req.query.limit && !req.query.offset) {
      return res.json(activities.slice(0, 10)); // Keep original behavior for dashboard
    }

    res.json({
      activities,
      total: totalCount,
      hasMore: offset + limit < totalCount,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

  app.delete("/api/subscriptions/:subscriptionId", async (req, res) => {
    try {
      const subscriptionId = parseInt(req.params.subscriptionId);
      const cancelled = await storage.cancelSubscription(subscriptionId);

      if (!cancelled) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  // Admin routes
  app.use('/api/admin', adminRoutes);

  // Admin routes
  app.get('/api/admin/users', async (req, res) => {
    try {
      const users = await db.select({
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        role: usersTable.role,
        status: usersTable.status,
        created_at: usersTable.created_at,
        avatar: usersTable.avatar,
        total_subscribers: usersTable.total_subscribers,
        total_earnings: usersTable.total_earnings
      }).from(usersTable);

      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Admin route - Update user status (suspend/activate)
  app.put("/api/admin/users/:id/status", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { status } = req.body;

      if (!['active', 'suspended'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const updatedUser = await db.update(users)
        .set({ 
          status: status,
          updated_at: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      if (updatedUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = updatedUser[0];
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Failed to update user status:', error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  // Creator routes
  app.get("/api/creators", async (req, res) => {
    try {
      // Fetch all users with creator role
      const creators = await storage.getCreators();
      res.json(creators);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch creators" });
    }
  });

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const includeInactive = req.query.include_inactive === 'true';
      const categories = await storage.getCategories(includeInactive);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error('Create category error:', error);
      res.status(400).json({ error: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const categoryData = insertCategorySchema.parse(req.body);
      const updated = await storage.updateCategory(categoryId, categoryData);

      if (!updated) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const deleted = await storage.deleteCategory(categoryId);

      if (!deleted) {
        return res.status(400).json({ error: "Cannot delete category - it may be in use by creators" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  app.put("/api/categories/:id/toggle", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const toggled = await storage.toggleCategoryStatus(categoryId);

      if (!toggled) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle category status" });
    }
  });

  // Get creator categories
  app.get("/api/creators/:id/categories", async (req, res) => {
    try {
      const creatorId = parseInt(req.params.id);
      const categories = await storage.getCreatorCategories(creatorId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch creator categories" });
    }
  });

  app.get("/api/categories/all", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all categories" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const category = await storage.getCategory(categoryId);

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  app.get("/api/categories/:id/creators", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const creators = await storage.getCreatorsByCategory(categoryId);
      res.json(creators);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch creators for category" });
    }
  });

  // Creator category routes
  app.get("/api/creators/:id/primary-category", async (req, res) => {
    try {
      const creatorId = parseInt(req.params.id);
      const category = await storage.getCreatorPrimaryCategory(creatorId);
      res.json(category || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch creator primary category" });
    }
  });

  app.post("/api/creators/:id/categories", async (req, res) => {
    try {
      const creatorId = parseInt(req.params.id);
      const creatorCategoryData = insertCreatorCategorySchema.parse({
        ...req.body,
        creator_id: creatorId
      });
      const creatorCategory = await storage.addCreatorToCategory(creatorCategoryData);
      res.status(201).json(creatorCategory);
    } catch (error) {
      console.error('Add creator to category error:', error);
      res.status(400).json({ error: "Failed to add creator to category" });
    }
  });

  app.delete("/api/creators/:id/categories/:categoryId", async (req, res) => {
    try {
      const creatorId = parseInt(req.params.id);
      const categoryId = parseInt(req.params.categoryId);
      const removed = await storage.removeCreatorFromCategory(creatorId, categoryId);

      if (!removed) {
        return res.status(404).json({ error: "Creator category association not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove creator from category" });
    }
  });

  app.put("/api/creators/:id/primary-category", async (req, res) => {
    try {
      const creatorId = parseInt(req.params.id);
      const { categoryId } = req.body;
      const updated = await storage.updateCreatorPrimaryCategory(creatorId, categoryId);

      if (!updated) {
        return res.status(400).json({ error: "Failed to update primary category" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update creator primary category" });
    }
  });

  // Creator subscriber routes
  app.get("/api/creators/:creatorId/subscribers", async (req, res) => {
    try {
      const creatorId = parseInt(req.params.creatorId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const recent = req.query.recent === 'true';

      console.log('Fetching subscribers for creator:', creatorId);

      // Get subscribers with user information
      const subscribersQuery = await db
        .select({
          id: subscriptionsTable.id,
          fan_id: subscriptionsTable.fan_id,
          creator_id: subscriptionsTable.creator_id,
          tier_id: subscriptionsTable.tier_id,
          status: subscriptionsTable.status,
          created_at: subscriptionsTable.created_at,
          next_billing_date: subscriptionsTable.next_billing_date,
          auto_renew: subscriptionsTable.auto_renew,
          // User information
          username: usersTable.username,
          email: usersTable.email,
          avatar: usersTable.avatar,
          display_name: usersTable.display_name,
          // Tier information
          tier_name: tiersTable.name,
          tier_price: tiersTable.price
        })
        .from(subscriptionsTable)
        .innerJoin(usersTable, eq(subscriptionsTable.fan_id, usersTable.id))
        .leftJoin(tiersTable, eq(subscriptionsTable.tier_id, tiersTable.id))
        .where(and(
          eq(subscriptionsTable.creator_id, creatorId),
          eq(subscriptionsTable.status, 'active')
        ))
        .orderBy(desc(subscriptionsTable.created_at));

      let subscribers = subscribersQuery.map(sub => ({
        ...sub,
        joined: new Date(sub.created_at).toLocaleDateString(),
        tier: sub.tier_name || 'Basic'
      }));

      console.log('Found subscribers:', subscribers.length, subscribers);

      if (recent) {
        // Sort by created_at descending for recent subscribers
        subscribers = subscribers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      if (limit) {
        subscribers = subscribers.slice(0, limit);
      }

      res.json(subscribers);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      res.status(500).json({ error: "Failed to fetch subscribers" });
    }
  });

  // Creator analytics endpoint
  app.get("/api/creator/:creatorId/analytics", async (req, res) => {
    try {
      const creatorId = parseInt(req.params.creatorId);

      // Get subscriber count
      const subscribers = await storage.getCreatorSubscribers(creatorId);
      const subscriberCount = subscribers.length;

      // Calculate monthly earnings from active subscriptions
      const tierPerformance = await storage.getSubscriptionTierPerformance(creatorId);
      const monthlyEarnings = tierPerformance.reduce((total, tier) => total + tier.revenue, 0);

      // Get creator's posts for engagement calculation
      const creatorPosts = await db
        .select({
          id: posts.id,
          likes_count: posts.likes_count,
          comments_count: posts.comments_count,
          created_at: posts.created_at
        })
        .from(posts)
        .where(and(
          eq(posts.creator_id, creatorId),
          eq(posts.status, 'published')
        ));

      // Calculate engagement rate based on actual data
      let engagementRate = 0;
      if (creatorPosts.length > 0 && subscriberCount > 0) {
        const totalEngagements = creatorPosts.reduce((sum, post) => 
          sum + (post.likes_count || 0) + (post.comments_count || 0), 0
        );
        const totalPossibleEngagements = creatorPosts.length * subscriberCount;
        engagementRate = Math.round((totalEngagements / totalPossibleEngagements) * 100);
      }

      const postsThisMonth = creatorPosts.filter(post => {
        const postDate = new Date(post.created_at);
        const now = new Date();
        return postDate.getMonth() === now.getMonth() && postDate.getFullYear() === now.getFullYear();
      }).length;

      // Calculate total earnings (simplified - using monthly * 12 for demo)
      const totalEarnings = monthlyEarnings * 12;

      // Calculate growth rate based on recent subscriber activity
      let growthRate = 0;
      if (subscriberCount > 0) {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const recentSubscribers = subscribers.filter(sub => {
          const subDate = new Date(sub.created_at);
          return subDate >= lastMonth;
        }).length;

        if (subscriberCount > recentSubscribers) {
          growthRate = Math.round((recentSubscribers / (subscriberCount - recentSubscribers)) * 100);
        }
      }

      const analytics = {
        subscribers: subscriberCount,
        monthlyEarnings,
        totalEarnings,
        growthRate,
        engagementRate,
        postsThisMonth
      };

      res.json(analytics);
    } catch (error) {
      console.error('Error fetching creator analytics:', error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Creator content endpoint
  app.get("/api/creator/:creatorId/content", async (req, res) => {
    try {
      const creatorId = parseInt(req.params.creatorId);

      // Get all posts for this creator with user information
      const creatorPosts = await db
        .select({
          id: postsTable.id,
          creator_id: postsTable.creator_id,
          title: postsTable.title,
          content: postsTable.content,
          media_type: postsTable.media_type,
          media_urls: postsTable.media_urls,
          tier: postsTable.tier,
          status: postsTable.status,
          scheduled_for: postsTable.scheduled_for,
          likes_count: postsTable.likes_count,
          comments_count: postsTable.comments_count,
          created_at: postsTable.created_at,
          updated_at: postsTable.updated_at,
          username: usersTable.username,
          avatar: usersTable.avatar
        })
        .from(postsTable)
        .leftJoin(usersTable, eq(postsTable.creator_id, usersTable.id))
        .where(eq(postsTable.creator_id, creatorId))
        .orderBy(desc(postsTable.created_at));

      res.json(creatorPosts);
    } catch (error) {
      console.error('Error fetching creator content:', error);
      res.status(500).json({ error: "Failed to fetch creator content" });
    }
  });

  // Creator goals endpoint
  app.get("/api/creator/:creatorId/goals", async (req, res) => {
    try {
      const creatorId = parseInt(req.params.creatorId);

      // Get stored goals from storage
      const storedGoals = await storage.getCreatorGoals(creatorId);

      // Get current metrics
      const subscribers = await storage.getCreatorSubscribers(creatorId);
      const subscriberCount = subscribers.length;

      const tierPerformance = await storage.getSubscriptionTierPerformance(creatorId);
      const monthlyRevenue = tierPerformance.reduce((total, tier) => total + tier.revenue, 0);

      const userPosts = await storage.getPosts();
      const creatorPosts = userPosts.filter(post => post.creator_id === creatorId);
      const postsThisMonth = creatorPosts.filter(post => {
        const postDate = new Date(post.created_at);
        const now = new Date();
        return postDate.getMonth() === now.getMonth() && postDate.getFullYear() === now.getFullYear();
      }).length;

      // Return goals with current progress
      const goals = {
        subscriberGoal: storedGoals?.subscriberGoal || 30,
        revenueGoal: storedGoals?.revenueGoal || 1000,
        postsGoal: storedGoals?.postsGoal || 15,
        currentSubscribers: subscriberCount,
        currentRevenue: monthlyRevenue,
        currentPosts: postsThisMonth
      };

      console.log('Returning goals:', goals);

      res.json(goals);
    } catch (error) {
      console.error('Error fetching creator goals:', error);
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  // Save creator goals endpoint
  app.post("/api/creator/:creatorId/goals", async (req, res) => {
    try {
      const creatorId = parseInt(req.params.creatorId);
      const { subscriberGoal, revenueGoal, postsGoal } = req.body;

      // Save goals to storage
      await storage.saveCreatorGoals(creatorId, {
        subscriberGoal: parseInt(subscriberGoal) || 0,
        revenueGoal: parseInt(revenueGoal) || 0,
        postsGoal: parseInt(postsGoal) || 0
      });

      res.json({ success: true, message: "Goals saved successfully" });
    } catch (error) {
      console.error('Error saving creator goals:', error);
      res.status(500).json({ error: "Failed to save goals" });
    }
  });

  // File upload routes
  app.post("/api/upload/profile-photo", upload.single('profilePhoto'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const photoUrl = "/uploads/" + req.file.filename;

      // Update user's avatar in database if user is authenticated
      if (req.session?.userId) {
        try {
          await db.update(users)
            .set({ avatar: photoUrl })
            .where(eq(users.id, req.session.userId));
          console.log("Updated avatar for user " + req.session.userId + ": " + photoUrl);
        } catch (dbError) {
          console.error('Failed to update avatar in database:', dbError);
          // Continue with response even if DB update fails
        }
      }

      res.json({ 
        success: true, 
        url: photoUrl,
        message: 'Profile photo uploaded successfully' 
      });
    } catch (error) {
      console.error('Profile photo upload error:', error);
      res.status(500).json({ success: false, message: 'Upload failed' });
    }
  });

  app.post("/api/upload/cover-photo", upload.single('coverPhoto'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const photoUrl = "/uploads/" + req.file.filename;

      // Update user's cover image in database if user is authenticated
      if (req.session?.userId) {
        try {
          await db.update(users)
            .set({ cover_image: photoUrl })
            .where(eq(users.id, req.session.userId));
          console.log("Updated cover image for user " + req.session.userId + ": " + photoUrl);
        } catch (dbError) {
          console.error('Failed to update cover image in database:', dbError);
          // Continue with response even if DB update fails
        }
      }

      res.json({ 
        success: true, 
        url: photoUrl,
        message: 'Cover photo uploaded successfully' 
      });
    } catch (error) {
      console.error('Cover photo upload error:', error);
      res.status(500).json({ success: false, message: 'Upload failed' });
    }
  });

  app.post("/api/upload/post-media", upload.single('media'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Generate the URL for the uploaded file
      const fileUrl = "/uploads/" + req.file.filename;

      res.json({ 
        success: true, 
        url: fileUrl,
        filename: req.file.filename,
        message: "Media uploaded successfully" 
      });
    } catch (error) {
      console.error('Post media upload error:', error);
      res.status(500).json({ error: "Failed to upload media" });
    }
  });

  // Report routes
  app.post("/api/reports", async (req, res) => {
    try {
      const validatedData = insertReportSchema.parse(req.body);
      const report = await storage.createReport(validatedData);
      res.json(report);
    } catch (error) {
      console.error('Create report error:', error);
      res.status(500).json({ error: "Failed to create report" });
    }
  });

  app.get("/api/admin/reports", async (req, res) => {
    try {
      const allReports = await storage.getReports();
      res.json(allReports);
    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.put("/api/admin/reports/:id/status", async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const { status, adminNotes } = req.body;
      const resolvedBy = req.session?.userId;

      const report = await storage.updateReportStatus(reportId, status, adminNotes, resolvedBy);
      res.json(report);
    } catch (error) {
      console.error('Update report status error:', error);
      res.status(500).json({ error: "Failed to update report status" });
    }
  });

  // Update user profile
  app.put('/api/users/profile', async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { display_name, bio } = req.body;

      const updatedUser = await db.update(users)
        .set({ 
          display_name: display_name || null,
          bio: bio || null,
          updated_at: new Date()
        })
        .where(eq(users.id, req.session.userId))
        .returning();

      if (updatedUser.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ success: true, user: updatedUser[0] });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Sync profile data to database
  app.post('/api/users/sync-profile', async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { displayName, bio, profilePhotoUrl, coverPhotoUrl, socialLinks } = req.body;

      const updateData: any = { updated_at: new Date() };

      if (displayName !== undefined) updateData.display_name = displayName;
      if (bio !== undefined) updateData.bio = bio;
      if (profilePhotoUrl !== undefined) updateData.avatar = profilePhotoUrl;
      if (coverPhotoUrl !== undefined) updateData.cover_image = coverPhotoUrl;
      if (socialLinks !== undefined) updateData.social_links = socialLinks;

      const updatedUser = await db.update(users)
        .set(updateData)
        .where(eq(users.id, req.session.userId))
        .returning();

      if (updatedUser.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ success: true, user: updatedUser[0] });
    } catch (error) {
      console.error('Profile sync error:', error);
      res.status(500).json({ error: 'Failed to sync profile' });
    }
  });

  // User settings endpoints
  app.get('/api/user/settings', async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userId = req.session.userId;
      const userData = await db
        .select({
          comments_enabled: users.comments_enabled,
          auto_post_enabled: users.auto_post_enabled,
          watermark_enabled: users.watermark_enabled,
          profile_discoverable: users.profile_discoverable,
          activity_status_visible: users.activity_status_visible,
          is_online: users.is_online,
          last_seen: users.last_seen,
          social_links: users.social_links,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userData.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(userData[0]);
    } catch (error) {
      console.error('Error fetching user settings:', error);
      res.status(500).json({ error: 'Failed to fetch user settings' });
    }
  });

  app.post('/api/user/content-settings', async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userId = req.session.userId;
      const { comments_enabled, auto_post_enabled, watermark_enabled } = req.body;

      const updateData: any = { updated_at: new Date() };
      if (comments_enabled !== undefined) updateData.comments_enabled = comments_enabled;
      if (auto_post_enabled !== undefined) updateData.auto_post_enabled = auto_post_enabled;
      if (watermark_enabled !== undefined) updateData.watermark_enabled = watermark_enabled;

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId));

      res.json({ success: true });
    } catch (error) {
      console.error('Error saving content settings:', error);
      res.status(500).json({ error: 'Failed to save content settings' });
    }
  });

  // Change user password
  app.post("/api/user/change-password", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
      }

      // Get current user data
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await db.update(usersTable)
        .set({
          password: hashedNewPassword,
          updated_at: new Date()
        })
        .where(eq(usersTable.id, userId));

      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  });

  // Update user privacy settings
  app.post("/api/user/privacy-settings", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { profile_discoverable, activity_status_visible, profile_visibility, allow_direct_messages } = req.body;

      // Update user privacy settings
      await db.update(usersTable)
        .set({
          profile_discoverable: profile_discoverable !== undefined ? profile_discoverable : undefined,
          activity_status_visible: activity_status_visible !== undefined ? activity_status_visible : undefined,
          updated_at: new Date()
        })
        .where(eq(users.id, userId));

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      res.status(500).json({ error: 'Failed to update privacy settings' });
    }
  });

  // Get user notification preferences
  app.get("/api/user/notification-preferences", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // For now, return default values since we don't have a notifications table
      // In a real app, you'd fetch these from a user_preferences table
      res.json({
        email_notifications: true,
        push_notifications: false,
      });
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      res.status(500).json({ error: 'Failed to fetch notification preferences' });
    }
  });

  // Update user notification preferences
  app.post("/api/user/notification-preferences", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { email_notifications, push_notifications } = req.body;

      // For now, we'll just return success since we don't have a notifications table
      // In a real app, you'd store these preferences in a user_preferences table
      console.log(`User ${userId} notification preferences:`, { email_notifications, push_notifications });

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      res.status(500).json({ error: 'Failed to update notification preferences' });
    }
  });

  // Get online status for a user (respects privacy settings)
  app.get('/api/users/:id/online-status', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      const userData = await db
        .select({
          is_online: users.is_online,
          last_seen: users.last_seen,
          activity_status_visible: users.activity_status_visible,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userData.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userData[0];

      // Check if user has allowed their activity status to be visible
      if (!user.activity_status_visible) {
        return res.json({ 
          is_online: false, 
          last_seen: null,
          activity_status_visible: false 
        });
      }

      res.json({
        is_online: user.is_online,
        last_seen: user.last_seen,
        activity_status_visible: user.activity_status_visible
      });
    } catch (error) {
      console.error('Error fetching online status:', error);
      res.status(500).json({ error: 'Failed to fetch online status' });
    }
  });

  // Check if comments are enabled for a creator
  app.get('/api/creators/:id/comments-enabled', async (req, res) => {
    try {
      const creatorId = parseInt(req.params.id);

      const result = await db
        .select({
          comments_enabled: users.comments_enabled,
        })
        .from(users)
        .where(eq(users.id, creatorId))
        .limit(1);

      if (result.length === 0) {
        return res.status(404).json({ error: 'Creator not found' });
      }

      res.json({ comments_enabled: result[0].comments_enabled });
    } catch (error) {
      console.error('Error checking comments enabled:', error);
      res.status(500).json({ error: 'Failed to check comments enabled' });
    }
  });

  // Creator payout settings endpoint
  app.get('/api/creators/:id/payout-settings', async (req, res) => {
    try {
      const creatorId = parseInt(req.params.id);

      // Ensure user can only access their own settings or if they're admin
      if (!req.session?.userId || (req.session.userId !== creatorId && req.session.user?.role !== 'admin')) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const settings = await storage.getCreatorPayoutSettings(creatorId);
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error('Error fetching payout settings:', error);
      res.status(500).json({ error: 'Failed to fetch payout settings' });
    }
  });

  app.post('/api/creators/:id/payout-settings', async (req, res) => {
    try {
      const creatorId = parseInt(req.params.id);

      // Ensure user can only update their own settings
      if (!req.session?.userId || req.session.userId !== creatorId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const validatedData = insertCreatorPayoutSettingsSchema.parse({
        ...req.body,
        creator_id: creatorId
      });

      const settings = await storage.saveCreatorPayoutSettings(validatedData);
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error('Error saving payout settings:', error);
      res.status(500).json({ error: 'Failed to save payout settings' });
    }
  });

  app.put('/api/creators/:id/payout-settings', async (req, res) => {
    try {
      const creatorId = parseInt(req.params.id);

      // Ensure user can only update their own settings
      if (!req.session?.userId || req.session.userId !== creatorId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const settings = await storage.updateCreatorPayoutSettings(creatorId, req.body);
      if (!settings) {
        return res.status(404).json({ error: 'Settings not found' });
      }

      res.json({ success: true, data: settings });
    } catch (error) {
      console.error('Error updating payout settings:', error);
      res.status(500).json({ error: 'Failed to update payout settings' });
    }
  });

  // Payment routes
  app.use('/api/payments', paymentRoutes);
  app.use('/api/payment-test', paymentTestRoutes);
  app.use('/api/payouts', payoutRoutes);
  app.use('/api/admin', adminRoutes);

// Platform settings endpoints
app.get('/api/admin/platform-settings', async (req, res) => {
  try {
    const settings = await storage.getPlatformSettings();
    res.json({ success: true, data: settings });
  } catch (error: any) {
    console.error('Error fetching platform settings:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch platform settings' 
    });
  }
});

app.put('/api/admin/platform-settings', async (req, res) => {
  try {
    const { commission_rate, ...otherSettings } = req.body;

    // Validate commission rate
    if (commission_rate !== undefined) {
      const rate = parseFloat(commission_rate);
      if (isNaN(rate) || rate < 0 || rate > 1) {
        return res.status(400).json({
          success: false,
          message: 'Commission rate must be between 0 and 1 (0% to 100%)'
        });
      }
    }

    await storage.updatePlatformSettings({
      commission_rate: commission_rate ? parseFloat(commission_rate) : 0.05,
      ...otherSettings
    });

    res.json({ 
      success: true, 
      message: 'Platform settings updated successfully' 
    });
  } catch (error: any) {
    console.error('Error updating platform settings:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to update platform settings' 
    });
  }
});

// Check current commission rate
app.get('/api/admin/commission-rate', async (req, res) => {
  try {
    const settings = await storage.getPlatformSettings();
    const commissionPercentage = (settings.commission_rate * 100).toFixed(1);

    res.json({ 
      success: true, 
      commission_rate_decimal: settings.commission_rate,
      commission_rate_percentage: commissionPercentage + "%",
      message: "Current commission rate is " + commissionPercentage + "%"
    });
  } catch (error: any) {
    console.error('Error fetching commission rate:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch commission rate' 
    });
  }
});

  // Notification API routes
  app.get("/api/notifications", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const notifications = await storage.getNotifications(userId, limit);

      // Enrich notifications with actor data
      const enrichedNotifications = await Promise.all(
        notifications.map(async (notification) => {
          let actor = null;
          if (notification.actor_id) {
            actor = await storage.getUser(notification.actor_id);
          }

          return {
            ...notification,
            actor: actor ? {
              id: actor.id,
              username: actor.username,
              display_name: actor.display_name,
              avatar: actor.avatar
            } : null,
            time_ago: formatTimeAgo(notification.created_at)
          };
        })
      );

      res.json(enrichedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const notificationId = parseInt(req.params.id);
      const success = await storage.markNotificationAsRead(notificationId);

      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Notification not found" });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/mark-all-read", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const success = await storage.markAllNotificationsAsRead(userId);

      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to mark notifications as read" });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const notificationId = parseInt(req.params.id);
      const success = await storage.deleteNotification(notificationId);

      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Notification not found" });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  app.get("/api/notification-preferences", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      let preferences = await storage.getNotificationPreferences(userId);

      // Create default preferences if they don't exist
      if (!preferences) {
        preferences = await storage.createNotificationPreferences({ user_id: userId });
      }

      res.json(preferences);
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      res.status(500).json({ error: "Failed to fetch notification preferences" });
    }
  });

  app.patch("/api/notification-preferences", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const updates = req.body;
      let preferences = await storage.updateNotificationPreferences(userId, updates);

      // Create preferences if they don't exist
      if (!preferences) {
        preferences = await storage.createNotificationPreferences({ user_id: userId, ...updates });
      }

      res.json(preferences);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      res.status(500).json({ error: "Failed to update notification preferences" });
    }
  });

  // Messaging API routes
  // Get conversations for current user
app.get('/api/conversations', async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    console.log('Fetching conversations for user:', userId);

    // Get conversations where current user is participant1 (fan) and exclude self-conversations
    const fanConversations = await db
      .select({
        id: conversationsTable.id,
        other_participant_id: conversationsTable.participant_2_id,
        participant_1_id: conversationsTable.participant_1_id,
        participant_2_id: conversationsTable.participant_2_id,
        updated_at: conversationsTable.updated_at,
        creator_username: usersTable.username,
        creator_display_name: usersTable.display_name,
        creator_avatar: usersTable.avatar,
      })
      .from(conversationsTable)
      .leftJoin(usersTable, eq(conversationsTable.participant_2_id, usersTable.id))
      .where(and(
        eq(conversationsTable.participant_1_id, userId),
        sql`${conversationsTable.participant_1_id} != ${conversationsTable.participant_2_id}`
      ))
      .orderBy(desc(conversationsTable.updated_at));

    // Get conversations where current user is participant2 (creator) and exclude self-conversations
    const creatorConversations = await db
      .select({
        id: conversationsTable.id,
        other_participant_id: conversationsTable.participant_1_id,
        participant_1_id: conversationsTable.participant_1_id,
        participant_2_id: conversationsTable.participant_2_id,
        updated_at: conversationsTable.updated_at,
        fan_username: usersTable.username,
        fan_display_name: usersTable.display_name,
        fan_avatar: usersTable.avatar,
      })
      .from(conversationsTable)
      .leftJoin(usersTable, eq(conversationsTable.participant_1_id, usersTable.id))
      .where(and(
        eq(conversationsTable.participant_2_id, userId),
        sql`${conversationsTable.participant_1_id} != ${conversationsTable.participant_2_id}`
      ))
      .orderBy(desc(conversationsTable.updated_at));

    // Get last message for each conversation
    const allConversationIds = [
      ...fanConversations.map(c => c.id),
      ...creatorConversations.map(c => c.id)
    ];

    let lastMessages = new Map();
    if (allConversationIds.length > 0) {
      const messages = await db
        .select({
          conversation_id: messagesTable.conversation_id,
          content: messagesTable.content,
          created_at: messagesTable.created_at,
        })
        .from(messagesTable)
        .where(inArray(messagesTable.conversation_id, allConversationIds))
        .orderBy(desc(messagesTable.created_at));

      // Group by conversation and get the latest message
      messages.forEach(message => {
        if (!lastMessages.has(message.conversation_id)) {
          lastMessages.set(message.conversation_id, message.content);
        }
      });
    }

    // Combine and format conversations
    let allConversations: any[] = [];

    // Add fan conversations (where current user is the fan)
    fanConversations.forEach(conv => {
      // Double-check to prevent self-conversations
      if (conv.other_participant_id !== userId) {
        allConversations.push({
          id: conv.id,
          other_participant_id: conv.other_participant_id,
          creator: {
            username: conv.creator_username,
            display_name: conv.creator_display_name,
            avatar: conv.creator_avatar,
          },
          last_message: lastMessages.get(conv.id) || 'No messages yet',
          timestamp: conv.updated_at,
          unread: false,
          unread_count: 0,
        });
      }
    });

    // Add creator conversations (where current user is the creator)
    creatorConversations.forEach(conv => {
      // Double-check to prevent self-conversations
      if (conv.other_participant_id !== userId) {
        allConversations.push({
          id: conv.id,
          other_participant_id: conv.other_participant_id,
          creator: {
            username: conv.fan_username,
            display_name: conv.fan_display_name,
            avatar: conv.fan_avatar,
          },
          last_message: lastMessages.get(conv.id) || 'No messages yet',
          timestamp: conv.updated_at,
          unread: false,
          unread_count: 0,
        });
      }
    });

    // Sort by timestamp
    allConversations.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    console.log('Found conversations:', allConversations.length);
    res.json(allConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a conversation
app.get('/api/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.session?.userId;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    console.log('Fetching messages for conversation:', conversationId, 'user:', currentUserId);

    // Verify user has access to this conversation
    const conversation = await db
      .select()
      .from(conversationsTable)
      .where(
        and(
          eq(conversationsTable.id, parseInt(conversationId)),
          or(
            eq(conversationsTable.participant_1_id, currentUserId),
            eq(conversationsTable.participant_2_id, currentUserId)
          )
        )
      )
      .limit(1);

    if (conversation.length === 0) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }

    // Get messages
    const messages = await db
      .select({
        id: messagesTable.id,
        sender: usersTable.username,
        content: messagesTable.content,
        timestamp: messagesTable.created_at,
        type: sql<'sent' | 'received'>`CASE WHEN ${messagesTable.sender_id} = ${currentUserId} THEN 'sent' ELSE 'received' END`,
      })
      .from(messagesTable)
      .leftJoin(usersTable, eq(messagesTable.sender_id, usersTable.id))
      .where(eq(messagesTable.conversation_id, parseInt(conversationId)))
      .orderBy(asc(messagesTable.created_at));

    console.log('Found messages:', messages.length);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message
app.post('/api/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const senderId = req.session?.userId;

    if (!senderId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get the conversation to determine recipient ID
    const conversation = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, parseInt(conversationId)))
      .limit(1);

    if (conversation.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Determine recipient ID (the participant who is not the sender)
    const recipientId = conversation[0].participant_1_id === senderId 
      ? conversation[0].participant_2_id 
      : conversation[0].participant_1_id;

    console.log('Sending message in conversation:', conversationId, 'from:', senderId, 'to:', recipientId);

    // Create message
    const [message] = await db
      .insert(messagesTable)
      .values({
        conversation_id: parseInt(conversationId),
        sender_id: senderId,
        recipient_id: recipientId,
        content,
      })
      .returning();

    // Update conversation timestamp
    await db
      .update(conversationsTable)
      .set({
        updated_at: new Date(),
      })
      .where(eq(conversationsTable.id, parseInt(conversationId)));

    // Get sender information for real-time message
    const senderInfo = await db
      .select({
        username: usersTable.username,
        display_name: usersTable.display_name,
        avatar: usersTable.avatar,
      })
      .from(usersTable)
      .where(eq(usersTable.id, senderId))
      .limit(1);

    // Broadcast real-time message to all participants
    if (senderInfo.length > 0) {
      const realTimeMessage = {
        id: message.id.toString(),
        sender: senderInfo[0].display_name || senderInfo[0].username,
        content: message.content,
        timestamp: message.created_at.toISOString(),
        type: 'received' // Will be adjusted on client side based on current user
      };

      // Broadcast to both sender and recipient
      if (app.locals.broadcastNotificationToUser) {
        // Send to recipient
        app.locals.broadcastNotificationToUser(recipientId, {
          type: 'new_message_realtime',
          conversationId: conversationId,
          message: realTimeMessage
        });

        // Send to sender (for multi-device sync)
        app.locals.broadcastNotificationToUser(senderId, {
          type: 'new_message_realtime',
          conversationId: conversationId,
          message: realTimeMessage
        });
      }
    }

    // Create notification for recipient
    await NotificationService.notifyNewMessage(recipientId, senderId, content);

    console.log('Message sent successfully:', message.id);
    res.json({ message: 'Message sent successfully', messageId: message.id });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Create or get conversation
app.post('/api/conversations', async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const currentUserId = req.session?.userId;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Prevent self-conversations
    if (currentUserId === otherUserId) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' });
    }

    console.log('Creating conversation between:', currentUserId, 'and', otherUserId);

    // Check if conversation already exists
    const existingConversation = await db
      .select()
      .from(conversationsTable)
      .where(
        or(
          and(
            eq(conversationsTable.participant_1_id, currentUserId),
            eq(conversationsTable.participant_2_id, otherUserId)
          ),
          and(
            eq(conversationsTable.participant_1_id, otherUserId),
            eq(conversationsTable.participant_2_id, currentUserId)
          )
        )
      )
      .limit(1);

    if (existingConversation.length > 0) {
      console.log('Found existing conversation:', existingConversation[0].id);
      return res.json({ conversationId: existingConversation[0].id });
    }

    // Create new conversation
    const [newConversation] = await db
      .insert(conversationsTable)
      .values({
        participant_1_id: currentUserId,
        participant_2_id: otherUserId,
      })
      .returning();

    console.log('Created new conversation:', newConversation.id);
    res.json({ conversationId: newConversation.id });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

  // Database health check endpoint
  app.get("/api/health/database", async (req, res) => {
    try {
      // Check if users table has data
      const userCount = await db.select({ count: count() }).from(users);
      const postCount = await db.select({ count: count() }).from(posts);
      const subscriptionCount = await db.select({ count: count() }).from(subscriptions);

      res.json({
        status: "healthy",
        data: {
          users: userCount[0]?.count || 0,
          posts: postCount[0]?.count || 0,
          subscriptions: subscriptionCount[0]?.count || 0
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Database health check failed:', error);
      res.status(500).json({
        status: "error",
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Test endpoint to create sample notifications
  app.post("/api/test-notifications", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Create various test notifications using NotificationService for real-time broadcasting
      const testNotifications = [
        {
          user_id: userId,
          type: 'new_subscriber',
          title: 'New Subscriber!',
          message: 'John Doe subscribed to your Premium tier',
          action_url: '/creator/subscribers',
          metadata: null
        },
        {
          user_id: userId,
          type: 'new_message',
          title: 'New Message',
          message: 'Sarah Wilson: Hey! Love your content...',
          action_url: '/fan/messages',
          metadata: {}
        },
        {
          user_id: userId,
          type: 'payment_success',
          title: 'Payment Successful',
          message: 'Your payment of GHS 50 for Premium tier was processed successfully',
          action_url: '/fan/subscriptions',
          metadata: {}
        },
        {
          user_id: userId,
          type: 'new_post',
          title: 'New Content',
          message: 'FitnessGuru posted: "5 Tips for Building Muscle"',
          action_url: '/fan/posts/123',
          metadata: {}
        }
      ];

      // Use NotificationService to create notifications with real-time broadcasting
      for (const notification of testNotifications) {
        await NotificationService.createNotification(notification);
      }

      res.json({ message: "Test notifications created and broadcasted successfully", count: testNotifications.length });
    } catch (error) {
      console.error('Error creating test notifications:', error);
      res.status(500).json({ error: "Failed to create test notifications" });
    }
  });

  // Real-time notification test endpoint
  app.post("/api/test-realtime-notification", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { type = 'test', title = 'Test Notification', message = 'This is a real-time test notification' } = req.body;

      // Create a single test notification with real-time broadcasting
      await NotificationService.createNotification({
        user_id: userId,
        type,
        title,
        message,
        action_url: '/fan/notifications',
        metadata: {}
      });

      res.json({ message: "Real-time test notification sent successfully" });
    } catch (error) {
      console.error('Error creating real-time test notification:', error);
      res.status(500).json({ error: "Failed to create test notification" });
    }
  });

  // Push notification subscription endpoints
  app.post("/api/push-subscription", async (req, res) => {
    try {
      const { subscription, userId } = req.body;

      if (!userId || !subscription) {
        return res.status(400).json({ error: "Missing userId or subscription" });
      }

      // Store the push subscription in the database
      // For now, we'll store it in memory or you can add a push_subscriptions table
      console.log('Push subscription registered for user:', userId);
      console.log('Subscription details:', JSON.stringify(subscription, null, 2));

      // You can store this in a push_subscriptions table
      // await storage.savePushSubscription(userId, subscription);

      res.json({ success: true, message: "Push subscription registered successfully" });
    } catch (error) {
      console.error('Error registering push subscription:', error);
      res.status(500).json({ error: "Failed to register push subscription" });
    }
  });

  app.delete("/api/push-subscription", async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      console.log('Push subscription removed for user:', userId);

      // Remove the push subscription from the database
      // await storage.removePushSubscription(userId);

      res.json({ success: true, message: "Push subscription removed successfully" });
    } catch (error) {
      console.error('Error removing push subscription:', error);
      res.status(500).json({ error: "Failed to remove push subscription" });
    }
  });

  // Test push notification endpoint
  app.post("/api/test-push-notification", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { title = 'Test Push Notification', message = 'This is a test push notification from Xclusive Creator Hub'} = req.body;

      // In a real implementation, you would:
      // 1. Get the user's push subscription from the database
      // 2. Use a library like web-push to send the notification
      // For now, we'll just log it
      console.log(`Test push notification for user ${userId}:`, { title, message });

      res.json({ success: true, message: "Test push notification triggered" });
    } catch (error) {
      console.error('Error sending test push notification:', error);
      res.status(500).json({ error: "Failed to send test push notification" });
    }
  });

  // Test subscription notification endpoint
  app.post("/api/test-subscription-notification", async (req, res) => {
    try {
      const { creatorId, fanId, tierName = 'Test Tier' } = req.body;

      if (!creatorId || !fanId) {
        return res.status(400).json({ error: "creatorId and fanId are required" });
      }

      console.log(`Testing subscription notification: creator=${creatorId}, fan=${fanId}, tier=${tierName}`);

      await NotificationService.notifyNewSubscriber(
        parseInt(creatorId),
        parseInt(fanId),
        tierName
      );

      res.json({ 
        success: true, 
        message: `Test subscription notification sent to creator ${creatorId} for fan ${fanId}` 
      });
    } catch (error) {
      console.error('Error sending test subscription notification:', error);
      res.status(500).json({ error: "Failed to send test subscription notification" });
    }
  });

  // Creator Like Routes
  app.post("/api/creators/:creatorId/like", async (req, res) => {
    try {
      const creatorId = parseInt(req.params.creatorId);
      const { fanId } = req.body;

      if (!fanId) {
        return res.status(400).json({ error: "fanId is required" });
      }

      const existingLike = await db
        .select()
        .from(creator_likes)
        .where(and(
          eq(creator_likes.fan_id, fanId),
          eq(creator_likes.creator_id, creatorId)
        ))
        .limit(1);

      if (existingLike.length > 0) {
        return res.status(400).json({ error: "Creator already liked" });
      }

      await db.insert(creator_likes).values({
        fan_id: fanId,
        creator_id: creatorId,
      });

      res.json({ success: true, message: "Creator liked successfully" });
    } catch (error) {
      console.error('Error liking creator:', error);
      res.status(500).json({ error: "Failed to like creator" });
    }
  });

  app.delete("/api/creators/:creatorId/like", async (req, res) => {
    try {
      const creatorId = parseInt(req.params.creatorId);
      const { fanId } = req.body;

      if (!fanId) {
        return res.status(400).json({ error: "fanId is required" });
      }

      await db
        .delete(creator_likes)
        .where(and(
          eq(creator_likes.fan_id, fanId),
          eq(creator_likes.creator_id, creatorId)
        ));

      res.json({ success: true, message: "Creator unliked successfully" });
    } catch (error) {
      console.error('Error unliking creator:', error);
      res.status(500).json({ error: "Failed to unlike creator" });
    }
  });

  app.get("/api/creators/:creatorId/like/:fanId", async (req, res) => {
    try {
      const creatorId = parseInt(req.params.creatorId);
      const fanId = parseInt(req.params.fanId);

      const like = await db
        .select()
        .from(creator_likes)
        .where(and(
          eq(creator_likes.fan_id, fanId),
          eq(creator_likes.creator_id, creatorId)
        ))
        .limit(1);

      res.json({ liked: like.length > 0 });
    } catch (error) {
      console.error('Error checking creator like status:', error);
      res.status(500).json({ error: "Failed to check like status" });
    }
  });

  // Creator Favorite Routes
  app.post("/api/creators/:creatorId/favorite", async (req, res) => {
    try {
      const creatorId = parseInt(req.params.creatorId);
      const { fanId } = req.body;

      if (!fanId) {
        return res.status(400).json({ error: "fanId is required" });
      }

      const existingFavorite = await db
        .select()
        .from(creator_favorites)
        .where(and(
          eq(creator_favorites.fan_id, fanId),
          eq(creator_favorites.creator_id, creatorId)
        ))
        .limit(1);

      if (existingFavorite.length > 0) {
        return res.status(400).json({ error: "Creator already favorited" });
      }

      await db.insert(creator_favorites).values({
        fan_id: fanId,
        creator_id: creatorId,
      });

      res.json({ success: true, message: "Creator added to favorites successfully" });
    } catch (error) {
      console.error('Error favoriting creator:', error);
      res.status(500).json({ error: "Failed to favorite creator" });
    }
  });

  app.delete("/api/creators/:creatorId/favorite", async (req, res) => {
    try {
      const creatorId = parseInt(req.params.creatorId);
      const { fanId } = req.body;

      if (!fanId) {
        return res.status(400).json({ error: "fanId is required" });
      }

      await db
        .delete(creator_favorites)
        .where(and(
          eq(creator_favorites.fan_id, fanId),
          eq(creator_favorites.creator_id, creatorId)
        ));

      res.json({ success: true, message: "Creator removed from favorites successfully" });
    } catch (error) {
      console.error('Error unfavoriting creator:', error);
      res.status(500).json({ error: "Failed to unfavorite creator" });
    }
  });

  app.get("/api/creators/:creatorId/favorite/:fanId", async (req, res) => {
    try {
      const creatorId = parseInt(req.params.creatorId);
      const fanId = parseInt(req.params.fanId);

      const favorite = await db
        .select()
        .from(creator_favorites)
        .where(and(
          eq(creator_favorites.fan_id, fanId),
          eq(creator_favorites.creator_id, creatorId)
        ))
        .limit(1);

      res.json({ favorited: favorite.length > 0 });
    } catch (error) {
      console.error('Error checking creator favorite status:', error);
      res.status(500).json({ error: "Failed to check favorite status" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup for real-time notifications
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    verifyClient: (info: any) => {
      // Basic verification - you could add session validation here
      return true;
    },
    // Add ping/pong to maintain connection
    clientTracking: true,
    perMessageDeflate: false,
    maxPayload: 16 * 1024 * 1024 // 16MB
  });

  // Store active WebSocket connections by user ID
  const activeConnections = new Map<number, Set<WebSocket>>();

  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');

    let userId: number | null = null;
    let pingInterval: NodeJS.Timeout | null = null;

    // Start ping/pong heartbeat
    const startHeartbeat = () => {
      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          if (pingInterval) clearInterval(pingInterval);
        }
      }, 30000); // Ping every 30 seconds
    };

    // Handle pong responses
    ws.on('pong', () => {
      // Connection is alive
    });

    // Handle incoming messages from client
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'auth' && message.userId) {
          userId = parseInt(message.userId);

          // Add connection to user's active connections
          if (!activeConnections.has(userId)) {
            activeConnections.set(userId, new Set());
          }
          activeConnections.get(userId)!.add(ws);

          // Update user's online status in the database
          try {
            await db.update(users)
              .set({ 
                is_online: true, 
                last_seen: new Date(),
                updated_at: new Date()
              })
              .where(eq(users.id, userId));
          } catch (error) {
            console.error('Error updating online status:', error);
          }

          console.log(`User ${userId} connected via WebSocket`);

          // Start heartbeat after authentication
          startHeartbeat();

          // Send confirmation
          ws.send(JSON.stringify({
            type: 'auth_success',
            message: 'Authentication successful'
          }));
        } else if (message.type === 'ping') {
          // Respond to client ping
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Handle connection close
    ws.on('close', async (code, reason) => {
      console.log('WebSocket client disconnected', { code, reason: reason.toString() });

      // Clean up heartbeat
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }

      if (userId && activeConnections.has(userId)) {
        activeConnections.get(userId)!.delete(ws);

        // Remove user entry if no more connections
        if (activeConnections.get(userId)!.size === 0) {
          activeConnections.delete(userId);

          // Update user's offline status in the database
          try {
            await db.update(users)
              .set({ 
                is_online: false, 
                last_seen: new Date(),
                updated_at: new Date()
              })
              .where(eq(users.id, userId));
          } catch (error) {
            console.error('Error updating offline status:', error);
          }
        }
      }
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);

      // Clean up heartbeat on error
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
    });
  });

  // Function to broadcast notification to specific user
  const broadcastNotificationToUser = (userId: number, notification: any) => {
    const userConnections = activeConnections.get(userId);

    if (userConnections && userConnections.size > 0) {
      const message = JSON.stringify({
        type: 'new_notification',
        notification
      });

      userConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });

      console.log(`Broadcast notification to user ${userId} on ${userConnections.size} connection(s)`);
    }
  };

  // Attach broadcast function to app for use in other routes
  app.locals.broadcastNotificationToUser = broadcastNotificationToUser;

  // Connect the notification service to the broadcast function
  NotificationService.setBroadcastFunction(broadcastNotificationToUser);

  // Get user by username
  app.get('/api/users/username/:username', async (req, res) => {
    try {
      const { username } = req.params;

      // Decode the username parameter
      const decodedUsername = decodeURIComponent(username);

      console.log('Looking for user with username:', decodedUsername);

      const user = await db.select().from(users).where(eq(users.username, decodedUsername)).limit(1);

      if (user.length === 0) {
        console.log('User not found:', decodedUsername);
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('Found user:', user[0]);
      res.json(user[0]);
    } catch (error) {
      console.error('Error fetching user by username:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Helper function to format time ago
  function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return diffInMinutes + " minute" + (diffInMinutes === 1 ? '' : 's') + " ago";
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return diffInHours + " hour" + (diffInHours === 1 ? '' : 's') + " ago";
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return diffInDays + " day" + (diffInDays === 1 ? '' : 's') + " ago";
    }

    return date.toLocaleDateString();
  }

  // Applying debugging logs to the notification and unread-count endpoints.
  // Add debugging logs to notification endpoints
  app.get('/api/notifications', async (req, res) => {
    try {
      const userId = req.session.userId;
      console.log('Fetching notifications for user:', userId);

      if (!userId) {
        console.log('No user ID found in request');
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const notifications = await storage.getNotifications(userId, limit);
      console.log('Found notifications:', notifications?.length || 0);

      // Enrich notifications with actor data
      const enrichedNotifications = await Promise.all(
        notifications.map(async (notification) => {
          let actor = null;
          if (notification.actor_id) {
            actor = await storage.getUser(notification.actor_id);
          }

          return {
            ...notification,
            actor: actor ? {
              id: actor.id,
              username: actor.username,
              display_name: actor.display_name,
              avatar: actor.avatar
            } : null,
            time_ago: formatTimeAgo(notification.created_at)
          };
        })
      );
      res.json(enrichedNotifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  // Add debugging to unread count endpoint
  app.get('/api/notifications/unread-count', async (req, res) => {
    try {
      const userId = req.session.userId;
      console.log('Fetching unread count for user:', userId);

      if (!userId) {
        console.log('No user ID found for unread count');
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const count = await storage.getUnreadNotificationCount(userId);
      console.log('Unread notification count:', count);
      res.json({ count: count || 0 });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  });

  // Payment verification endpoint
  app.get('/api/payments/verify/:reference', async (req, res) => {
    try {
      const { reference } = req.params;

      // In development, simulate successful payment
      if (process.env.NODE_ENV === 'development') {
        res.json({
          success: true,
          data: {
            status: 'success',
            reference,
            amount: 1500, // GHS 15.00
            customer: {
              email: 'test@example.com'
            }
          }
        });
        return;
      }

      // In production, verify with Paystack
      const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const paystackData = await paystackResponse.json();

      if (paystackData.status && paystackData.data.status === 'success') {
        // Update subscription status in database
        // This would typically involve creating a subscription record

        res.json({
          success: true,
          data: paystackData.data
        });
      } else {
        res.json({
          success: false,
          message: 'Payment verification failed'
        });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  // Payment callback route - serve the React app for payment callback handling
  app.get('/payment/callback', (req, res) => {
    // This will be handled by the React router, just serve the main HTML
    res.sendFile(path.join(__dirname, '../client/index.html'));
  });

  return httpServer;
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes + " minute" + (diffInMinutes === 1 ? '' : 's') + " ago";
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours + " hour" + (diffInHours === 1 ? '' : 's') + " ago";
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return diffInDays + " day" + (diffInDays === 1 ? '' : 's') + " ago";
  }

  return date.toLocaleDateString();
}

// Adding register endpoint with proper error handling and logout and auth verification endpoints.