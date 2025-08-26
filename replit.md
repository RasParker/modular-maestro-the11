# Xclusive - Premium Creator Platform

## Overview
Xclusive is a comprehensive creator monetization platform designed to enable content creators to build subscription-based businesses. It provides a full-stack solution for managing subscriptions, content, and fan interactions, targeting a broad market for creators looking to monetize their content directly. The platform supports multiple user roles (fans, creators, admins) with robust role-based access control and comprehensive subscription management capabilities.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with shadcn/ui design system, featuring custom design tokens for premium branding.
- **Styling**: Tailwind CSS for utility-first styling.
- **State Management**: React Query for server state and React Context for authentication.
- **Routing**: React Router with protected routes based on user roles.
- **Build Tool**: Vite for fast development and optimized builds.
- **UI/UX Decisions**: Mobile-first responsive design with edge-to-edge layouts, minimal icon-and-text navigation, Instagram-style borderless post cards, and consistent typography standards across components.
- **Feature Specifications**: Includes fan, creator, and admin dashboards; multi-role authentication; subscription management with tiered access; rich content creation and moderation tools; and a real-time notification system with WebSocket integration.

### Backend Architecture
- **Framework**: Express.js with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM for type-safe operations.
- **Session Management**: Connect-pg-simple for PostgreSQL session storage.
- **API Design**: RESTful endpoints.
- **Core Features**: Multi-role authentication, secure session handling, robust subscription system with multiple tiers, comprehensive content management (creation, scheduling, moderation, tier-based access), and a real-time notification system via WebSockets.
- **System Design Choices**: Emphasis on secure password hashing, proper database relations, and a clear client-server architecture with role-based access control. Implemented data retention policies for activity feeds to optimize performance.

## Recent Changes

### Performance Optimization Updates
- **Date**: August 4, 2025
- **API Optimization**: Reduced notification polling from 10 seconds to 60 seconds and disabled when user is not logged in
- **Authentication**: Removed artificial 300ms delay in authentication verification for immediate response
- **React Query**: Optimized default settings with disabled refetch on window focus/mount/reconnect and better caching
- **Component Optimization**: Added React.memo to NotificationBell, MinimalNavbar, and AppLayout to prevent unnecessary re-renders
- **Loading States**: Improved Suspense fallback with proper spinner instead of plain text
- **TypeScript**: Fixed all TypeScript errors in notification components for better performance
- **Custom Hooks**: Added useDebounce and useIntersectionObserver hooks for future performance optimizations

### Migration to Replit Environment
- **Date**: August 5, 2025
- **Migration**: Successfully migrated project from Replit Agent to standard Replit environment
- **Database**: Set up PostgreSQL database with proper environment variables and complete schema migration (17 tables)
- **Schema Verification**: Verified 100% database schema match with all tables correctly created and configured
- **Connection Optimization**: Optimized PostgreSQL connection pool with proper timeouts and limits for Replit environment
- **Performance**: Implemented lazy loading for React components to improve app loading times
- **Authentication**: Optimized authentication flow with immediate localStorage loading and background verification for faster startup
- **Security**: Ensured proper client/server separation and robust security practices
- **Database Testing**: Verified all CRUD operations and complex queries work correctly
- **Background Services**: Confirmed cron service and database initialization work properly in background
- **Environment Setup**: All required packages installed and environment variables configured
- **Server Stability**: Server running successfully on port 5000 with all services operational
- **Payment Integration**: Configured and tested Paystack payment system with card and mobile money support
- **Payment Features**: All payment endpoints functional - initialization, verification, webhooks, subscription creation
- **Payment Testing**: Verified complete payment flow including metadata handling and subscription activation
- **Notification System**: Fully configured and active notification system with real-time WebSocket integration
- **Notification Features**: Complete notification API - creation, retrieval, marking as read, preferences management
- **Notification Testing**: Verified all notification types work correctly with proper database integration and user enrichment
- **Error Handling**: Added global error handlers to prevent unhandled promise rejections and improve frontend stability  
- **Database Connection**: Verified all authentication endpoints working correctly with proper error responses
- **Payment Integration**: Configured and tested Paystack payment system with card and mobile money support
- **Payment Features**: All payment endpoints functional - initialization, verification, webhooks, subscription creation
- **Payment Testing**: Verified complete payment flow including metadata handling and subscription activation

### Bug Fixes and Database Setup
- **Date**: August 2, 2025
- **Critical Fixes**: Fixed corrupted syntax in server/routes.ts that was preventing server startup
- **Database Setup**: Resolved database initialization issues by using Drizzle's push command instead of SQL file execution
- **Authentication**: Fixed signup and login functionality by ensuring all required database tables exist
- **Server Stability**: Eliminated "address already in use" errors and ensured proper server startup sequence

### Performance Optimization Updates
- **Date**: August 2, 2025
- **Startup Performance**: Optimized server startup time by implementing non-blocking database initialization and cron service startup
- **Database Optimization**: 
  - Reduced database connection pool size for faster startup
  - Implemented schema existence checking to skip unnecessary table creation
  - Created optimized SQL schema file without duplicates (reduced from 269 to ~140 lines)
  - Reduced connection timeouts for faster feedback
- **Background Processing**: Moved database initialization and cron service to background processes to allow immediate server startup
- **Schema Management**: Consolidated duplicate table definitions and added performance indexes

## External Dependencies

### UI & Styling
- **Radix UI**: Accessible component primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **React Hook Form**: Form validation and management.

### Backend & Database
- **Neon Database**: (Used for serverless PostgreSQL hosting during development, though shifted to standard PostgreSQL for production stability).
- **Drizzle ORM**: Type-safe database operations.
- **Express Session**: Session management middleware.
- **Zod**: Runtime schema validation.

### Development Tools
- **Vite**: Fast build tool.
- **TypeScript**: Static type checking.
- **ESBuild**: Fast JavaScript bundler.
- **tsx**: TypeScript execution.