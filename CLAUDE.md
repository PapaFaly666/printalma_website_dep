# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

**Development:**
```bash
npm run dev          # Start development server on port 5174
npm run build        # Build for production (TypeScript + Vite)
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

**Note:** The frontend runs on port 5174 and proxies API requests to the backend at localhost:3004.

## Project Architecture

This is a React + TypeScript e-commerce platform called "PrintAlma" for custom product printing with design placement capabilities.

### Frontend Architecture
- **Framework:** React 19 with TypeScript, Vite build tool, TailwindCSS + shadcn/ui components
- **State Management:** React Context (AuthContext, CategoryContext) + TanStack React Query for server state
- **Routing:** React Router v7 with role-based protected routes (Public/Admin/Vendor)
- **Design System:** Fabric.js for canvas manipulation, design positioning, and product customization

### Key Architecture Patterns

**1. Role-Based Access Control:**
- `PublicRoute`: Open to all users
- `AdminRoute`: Requires admin authentication  
- `VendeurRoute`: Requires vendor authentication
- `ProtectedRoute`: Generic authenticated route

**2. Multi-User System:**
- **Admins:** Full system access, product/vendor management, design validation
- **Vendors:** Can create and sell designs, manage their products
- **Customers:** Browse, customize, and purchase products

**3. Product & Design System:**
- Products have "delimitations" (design placement boundaries)
- Vendors can upload designs and position them on products
- Real-time design preview with Fabric.js canvas
- Cascade validation system for design/product approval workflow

**4. API Architecture:**
- Backend at `localhost:3004` with proxy configuration
- Centralized API config in `src/config/api.ts`
- Services layer for all API interactions (auth, products, designs, etc.)
- Comprehensive error handling with type-safe error messages

### Important Directories

**Core Application:**
- `src/pages/` - Route components organized by user role (admin/, vendor/, public)
- `src/components/` - Reusable components organized by domain (admin/, auth/, cascade/, vendor/, ui/)
- `src/hooks/` - Custom React hooks for state management and API calls
- `src/services/` - API service layer for all backend communications
- `src/contexts/` - React context providers (Auth, Category)

**Business Logic:**
- `src/types/` - TypeScript type definitions for API contracts
- `src/utils/` - Helper functions for image processing, validation, API helpers
- `src/config/` - Application configuration (API endpoints, validation rules)

### Key Features

**Design System:**
- Interactive design positioning with Fabric.js
- Real coordinate system with percentage-based positioning  
- Design transform persistence via localStorage and API
- Boundary validation system for design placement

**Vendor Workflow:**
- Design upload and positioning interface
- Cascade validation system with status tracking
- Product creation with design integration
- Extended vendor profiles with shop management

**Admin Tools:**
- Product validation and management interfaces
- Design positioning tools for admins
- Order management and analytics dashboards
- Theme and category management

## Development Notes

**API Integration:**
- All API endpoints are defined in `src/config/api.ts`
- Services use consistent error handling patterns
- Authentication state managed globally via AuthContext
- File uploads handled via multipart/form-data with proper validation

**Design Canvas:**
- Fabric.js integration for interactive design manipulation
- Position data stored as percentages for responsive design
- Real-time preview updates during design positioning
- Canvas state persistence across page refreshes

**State Management:**
- TanStack Query for server state caching and synchronization
- Local storage for design positioning and draft persistence
- Context providers for global app state (auth, categories)

**Routing Structure:**
- `/admin/*` - Admin dashboard and management tools
- `/vendeur/*` - Vendor dashboard and design tools  
- `/` - Public landing page and product catalog
- Authentication redirects based on user role

The codebase includes extensive debugging utilities, test files, and comprehensive documentation for the design positioning and validation systems.