# BMO (Budget Money Online) - Personal Finance Management Application

![BMO Logo](public/icon-192x192.png)

## 📑 Table of Contents

1. [Project Overview](#project-overview)
2. [Live Demo](#live-demo)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Core Features](#core-features)
6. [Workflows & Functionality](#workflows--functionality)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [Authentication & Authorization](#authentication--authorization)
10. [Desktop Application Features](#desktop-application-features)
11. [Real-time Features](#real-time-features)
12. [Testing](#testing)
13. [Setup Instructions](#setup-instructions)
14. [Challenges & Solutions](#challenges--solutions)
15. [Future Improvements](#future-improvements)
16. [Source Code](#source-code)

---

## 🏦 Project Overview

### What is BMO?

BMO (Budget Money Online) is a comprehensive, YNAB-inspired personal finance management application built for desktop environments. It provides users with powerful budgeting tools, transaction tracking, collaborative financial planning, and real-time insights into their financial health through a self-hosted, privacy-focused platform.

### Purpose and Goals

- **Primary Goal**: Democratize access to sophisticated budgeting tools through a free, open-source alternative to expensive commercial solutions
- **Secondary Goals**: 
  - Enable collaborative family/household budgeting
  - Provide offline-first functionality for reliable access
  - Offer detailed financial reporting and analytics
  - Support multiple budgeting methodologies (Zero-based, 50/30/20, etc.)

### Target Audience

- **Primary Users**: Individuals and families seeking comprehensive desktop budget management
- **Technical Users**: Developers wanting to self-host their financial data
- **Privacy-Conscious Users**: Those preferring local/self-hosted financial management
- **Desktop Power Users**: Users who prefer comprehensive desktop applications over mobile apps

### Key Value Propositions

1. **Zero-Based Budgeting**: Every dollar has a purpose before spending
2. **Collaborative Planning**: Share budgets with family members and partners
3. **Desktop-Optimized**: Designed specifically for desktop workflows and interactions
4. **Privacy First**: Self-hostable with complete data ownership
5. **Comprehensive Reporting**: Detailed insights into spending patterns

---

## 💻 Local Installation

**This is a self-hosted desktop application - no online demo available**

**Local Setup Features**:
- Complete budget setup and management
- Transaction entry and categorization
- Real-time collaboration between local users
- Report generation and export
- Full data privacy and control

---

## 🛠️ Tech Stack

### Frontend Technologies

| Technology | Version | Purpose | Why Chosen |
|------------|---------|---------|------------|
| **Next.js** | 14.0.4 | React framework | App Router for file-based routing, built-in API routes, excellent performance |
| **TypeScript** | ^5.0 | Type safety | Reduces runtime errors, improves developer experience |
| **Tailwind CSS** | ^3.3.0 | Utility-first CSS | Rapid UI development, consistent design system |
| **Radix UI** | Various | Accessible components | High-quality, accessible primitives for complex UI |
| **Lucide React** | ^0.302.0 | Icon library | Comprehensive, lightweight icon set |
| **Recharts** | ^2.15.4 | Data visualization | React-native charts for financial reporting |
| **Framer Motion** | ^10.16.16 | Animations | Smooth, performant animations |

### Backend Technologies

| Technology | Version | Purpose | Why Chosen |
|------------|---------|---------|------------|
| **PostgreSQL** | Latest | Primary database | ACID compliance, complex queries, reliability |
| **Prisma** | ^5.7.1 | ORM | Type-safe database access, excellent migrations |
| **NextAuth.js** | ^4.24.5 | Authentication | Secure, flexible auth with multiple providers |
| **Socket.IO** | ^4.8.1 | Real-time communication | Reliable real-time messaging and updates |
| **bcryptjs** | ^3.0.2 | Password hashing | Industry-standard password security |

### State Management & Storage

| Technology | Version | Purpose | Why Chosen |
|------------|---------|---------|------------|
| **Zustand** | ^4.4.7 | Client state | Lightweight, simple state management |
| **React Hook Form** | ^7.48.2 | Form management | Performant form handling with validation |
| **Zod** | ^3.22.4 | Schema validation | Type-safe validation across client/server |

### Development Tools

| Technology | Version | Purpose | Why Chosen |
|------------|---------|---------|------------|
| **ESLint** | ^8.0 | Code linting | Maintains code quality and consistency |
| **Autoprefixer** | ^10.0.1 | CSS prefixing | Cross-browser CSS compatibility |
| **TSX** | ^4.6.2 | TypeScript execution | Running TypeScript scripts directly |

---

## 📁 Project Structure

```
budget-app/
├── 📁 app/                          # Next.js App Router
│   ├── 📁 api/                      # API Routes
│   │   ├── 📁 accounts/             # Account management endpoints
│   │   ├── 📁 auth/                 # Authentication endpoints
│   │   ├── 📁 budgets/              # Budget data endpoints
│   │   ├── 📁 categories/           # Category management
│   │   ├── 📁 goals/                # Financial goals
│   │   ├── 📁 groups/               # Budget group collaboration
│   │   ├── 📁 messages/             # Real-time messaging
│   │   ├── 📁 reports/              # Financial reporting
│   │   ├── 📁 transactions/         # Transaction management
│   │   └── 📁 user/                 # User profile management
│   ├── 📁 (pages)/                  # Application pages
│   │   ├── 📄 page.tsx              # Main budget dashboard
│   │   ├── 📁 accounts/             # Account management UI
│   │   ├── 📁 auth/                 # Authentication pages
│   │   ├── 📁 onboarding/           # User onboarding flow
│   │   ├── 📁 profile/              # User profile
│   │   ├── 📁 reports/              # Financial reports
│   │   ├── 📁 settings/             # Application settings
│   │   └── 📁 transactions/         # Transaction management
│   ├── 📄 globals.css               # Global styles
│   ├── 📄 layout.tsx                # Root layout component
│   └── 📄 not-found.tsx             # 404 error page
├── 📁 components/                   # Reusable React components
│   ├── 📁 accounts/                 # Account-related components
│   ├── 📁 budget/                   # Budget management components
│   ├── 📁 onboarding/               # Onboarding flow components
│   ├── 📁 reports/                  # Reporting components
│   ├── 📁 settings/                 # Settings components
│   ├── 📁 transactions/             # Transaction components
│   └── 📁 ui/                       # Base UI components
├── 📁 hooks/                        # Custom React hooks
├── 📁 lib/                          # Utility libraries
│   ├── 📄 auth.ts                   # NextAuth configuration
│   ├── 📄 db.ts                     # Prisma client setup
│   ├── 📄 email.ts                  # Email utilities
│   ├── 📄 socket.ts                 # Socket.IO configuration
│   └── 📄 utils.ts                  # General utilities
├── 📁 pages/api/                    # Additional API routes
│   └── 📄 socket.ts                 # Socket.IO handler
├── 📁 prisma/                       # Database configuration
│   ├── 📁 migrations/               # Database migrations
│   ├── 📄 schema.prisma             # Database schema
│   └── 📄 seed.ts                   # Database seeding
├── 📁 public/                       # Static assets
│   ├── 📄 manifest.json             # PWA manifest
│   ├── 📁 pictures/                 # Application screenshots
│   └── 🖼️ icons                     # PWA icons
├── 📁 scripts/                      # Utility scripts
├── 📁 types/                        # TypeScript type definitions
├── 📄 middleware.ts                 # Next.js middleware
├── 📄 next.config.js                # Next.js configuration
├── 📄 tailwind.config.ts            # Tailwind CSS configuration
└── 📄 package.json                  # Dependencies and scripts
```

### Key Directory Explanations

- **`/app`**: Next.js 14 App Router structure with co-located API routes and pages
- **`/components`**: Modular, reusable React components organized by feature domain
- **`/lib`**: Core utility functions, configurations, and shared business logic
- **`/prisma`**: Database schema, migrations, and seeding scripts
- **`/hooks`**: Custom React hooks for state management and effects
- **`/types`**: TypeScript type definitions for better type safety

---

## ✨ Core Features

### 🎯 Budget Management

#### Zero-Based Budgeting System
- **Every Dollar Assignment**: All income must be allocated before spending
- **Category-Based Organization**: Hierarchical category groups and subcategories
- **Monthly Budget Cycles**: Independent budgets for each month with rollover capabilities
- **Real-Time Balance Tracking**: Live updates of budgeted vs. actual spending

```typescript
// Example budget allocation
interface BudgetEntry {
  categoryId: string
  month: Date
  budgeted: Decimal    // Planned amount
  activity: Decimal    // Actual transactions
  available: Decimal   // Remaining balance
}
```

#### Advanced Budget Features
- **Quick Budget Rules**: 50/30/20, 70/20/10, zero-based templates
- **Budget Transfer Tools**: Move money between categories mid-month
- **Overspending Coverage**: Automatic suggestions for covering shortfalls
- **Goal Integration**: Link savings goals to budget categories

### 💳 Account & Transaction Management

#### Multi-Account Support
```typescript
enum AccountType {
  CHECKING, SAVINGS, CASH, CREDIT_CARD,
  LINE_OF_CREDIT, INVESTMENT, MORTGAGE,
  LOAN, OTHER_ASSET, OTHER_LIABILITY
}
```

#### Transaction Features
- **Manual Entry**: Complete transaction details with payee, memo, categories
- **Account Transfers**: Internal money movement between accounts
- **Transaction Status**: Uncleared, cleared, reconciled tracking
- **Split Transactions**: Divide single transaction across multiple categories
- **Import Reconciliation**: Prepare for future bank import features

### 👥 Collaborative Budgeting

#### Role-Based Access Control
```typescript
enum GroupRole {
  OWNER   // Full access, can delete plan, manage members
  EDITOR  // Can edit budgets and transactions
  VIEWER  // Read-only access to all data
}
```

#### Collaboration Features
- **Budget Group Sharing**: Invite family members and partners
- **Real-Time Synchronization**: Changes sync across all group members
- **Permission Management**: Granular control over user capabilities
- **Invitation System**: Secure email-based invitations with role assignment

### 📊 Financial Reporting & Analytics

#### Comprehensive Reports
- **Budget vs. Actual Analysis**: Compare planned spending to reality
- **Spending Breakdown**: Category and account-level analysis
- **Trend Analysis**: Month-over-month spending patterns
- **Goal Progress Tracking**: Visual progress toward financial objectives

#### Data Visualization
- **Interactive Charts**: Pie charts and bar graphs for spending analysis
- **Progress Indicators**: Visual budget utilization meters
- **Variance Analysis**: Color-coded over/under budget indicators
- **Export Capabilities**: CSV export for external analysis

### 🎯 Goal Setting & Tracking

#### Goal Types
```typescript
enum GoalType {
  TARGET_BALANCE           // Save $X total
  TARGET_BALANCE_BY_DATE   // Save $X by specific date
  MONTHLY_FUNDING          // Save $X each month
  WEEKLY_FUNDING           // Save $X each week
  YEARLY_FUNDING           // Save $X each year
  PERCENT_OF_INCOME        // Save X% of income
  CUSTOM                   // Flexible custom goals
}
```

### 💬 Real-Time Messaging

#### Team Communication
- **Group Messaging**: Built-in chat for budget collaboration
- **Message Threading**: Reply-to functionality for organized discussions
- **User Privacy**: Message anonymization when users leave groups
- **Retention Policies**: Configurable message cleanup schedules

### 💻 Desktop Application Features

#### Desktop-Optimized Experience
- **Browser-Based**: Runs in modern desktop browsers
- **Local Data**: All data stored locally in PostgreSQL database
- **Keyboard Shortcuts**: Efficient desktop-style navigation
- **Multi-Window Support**: Works with multiple browser windows/tabs

#### Desktop Performance
- **Large Dataset Handling**: Optimized for desktop memory and processing
- **Efficient Rendering**: Fast rendering of complex budget tables
- **Desktop UI Patterns**: Context menus, keyboard navigation, bulk operations
- **Screen Real Estate**: Takes advantage of large desktop screens

---

## 🔄 Workflows & Functionality

### 📝 Complete Budget Setup Workflow

1. **User Onboarding**
   ```typescript
   // User completes comprehensive questionnaire
   POST /api/onboarding/complete
   {
     name: string
     budgetingExperience: string
     primaryGoals: string[]
     monthlyIncome: string
     expenseCategories: string[]
     // ... additional lifestyle questions
   }
   ```

2. **Personalized Category Creation**
   - System analyzes onboarding responses
   - Creates relevant category groups and categories
   - Sets up initial budget structure

3. **Account Setup**
   ```typescript
   // Add financial accounts
   POST /api/accounts
   {
     name: string
     type: AccountType
     balance: number
     isOnBudget: boolean
   }
   ```

4. **Initial Budget Allocation**
   - Assign "To Be Budgeted" amount to categories
   - Apply budget rules (50/30/20, etc.)
   - Set up financial goals

### 💰 Transaction Entry & Processing

1. **Manual Transaction Entry**
   ```typescript
   POST /api/transactions
   {
     date: Date
     amount: Decimal
     payee: string
     memo?: string
     fromAccountId: string
     toAccountId?: string    // For transfers
     categoryId?: string     // For categorization
     cleared: TransactionStatus
   }
   ```

2. **Automatic Budget Updates**
   - Transaction affects category activity
   - Available balance recalculated
   - Budget variance updated
   - Reports automatically refresh

3. **Data Flow Process**
   ```
   Frontend Form → API Validation → Database Transaction → 
   Real-time Updates → UI Refresh → Socket Broadcast
   ```

### 👨‍👩‍👧‍👦 Collaborative Budget Management

1. **Group Creation & Invitation**
   ```typescript
   // Send invitation
   POST /api/invitations/send
   {
     email: string
     groupId: string
     role: GroupRole
   }
   ```

2. **Real-Time Collaboration**
   - Socket.IO connections for live updates
   - Conflict resolution for simultaneous edits
   - Change notifications across all members

3. **Permission Enforcement**
   ```typescript
   // Middleware checks user role
   if (userRole === 'VIEWER') {
     return unauthorized()
   }
   ```

### 📈 Report Generation Process

1. **Data Aggregation**
   ```typescript
   // Budget vs. Actual calculation
   const budgetData = await prisma.budget.findMany({
     where: { month: selectedMonth }
   })
   
   const transactionData = await prisma.transaction.findMany({
     where: { 
       date: { gte: monthStart, lte: monthEnd }
     }
   })
   ```

2. **Analysis & Visualization**
   - Calculate variances and utilization percentages
   - Generate chart data for visualization
   - Prepare export formats (CSV, PDF future)

### 🔄 Offline Synchronization

1. **Offline Storage**
   ```typescript
   // Dexie.js IndexedDB wrapper
   class OfflineDB extends Dexie {
     transactions: Table<Transaction>
     budgets: Table<Budget>
     accounts: Table<Account>
   }
   ```

2. **Sync Process**
   ```typescript
   // Background sync when online
   self.addEventListener('sync', event => {
     if (event.tag === 'budget-sync') {
       event.waitUntil(syncToServer())
     }
   })
   ```

---

## 🗄️ Database Schema

### Core User Management

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // Hashed with bcryptjs
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Onboarding
  hasCompletedOnboarding Boolean @default(false)
  onboardingData Json?

  // Relationships
  memberships GroupMember[]
  accounts Account[]
  sessions Session[]
  invitationsSent GroupInvitation[] @relation("InvitationsSent")
  messagesSent Message[] @relation("MessagesSent")
}
```

### Budget Group Management

```prisma
model BudgetGroup {
  id          String   @id @default(cuid())
  name        String
  description String?
  currency    String   @default("USD")
  createdAt   DateTime @default(now())
  
  // Message retention policy
  messageRetentionPolicy Json? @default("{\"anonymizedRetentionHours\": 24}")

  // Relationships
  members GroupMember[]
  categoryGroups CategoryGroup[]
  budgetAccounts BudgetAccount[]
  transactions Transaction[]
  budgets Budget[]
  goals Goal[]
  messages Message[]
}

model GroupMember {
  id     String @id @default(cuid())
  userId String
  groupId String
  role   GroupRole @default(VIEWER)
  joinedAt DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id])
  group BudgetGroup  @relation(fields: [groupId], references: [id])

  @@unique([userId, groupId])
}

enum GroupRole {
  OWNER
  EDITOR
  VIEWER
}
```

### Financial Account Structure

```prisma
model BudgetAccount {
  id          String      @id @default(cuid())
  name        String
  type        AccountType
  balance     Decimal     @default(0) @db.Decimal(12, 2)
  isOnBudget  Boolean     @default(true)
  isClosed    Boolean     @default(false)
  institution String?
  accountNumber String?

  groupId String
  group   BudgetGroup  @relation(fields: [groupId], references: [id])

  // Transaction relationships
  transactionsFrom Transaction[] @relation("FromAccount")
  transactionsTo   Transaction[] @relation("ToAccount")
}

enum AccountType {
  CHECKING, SAVINGS, CASH, CREDIT_CARD,
  LINE_OF_CREDIT, INVESTMENT, MORTGAGE,
  LOAN, OTHER_ASSET, OTHER_LIABILITY
}
```

### Budget Category System

```prisma
model CategoryGroup {
  id        String   @id @default(cuid())
  name      String
  sortOrder Int      @default(0)
  isHidden  Boolean  @default(false)

  groupId String
  group   BudgetGroup  @relation(fields: [groupId], references: [id])

  categories Category[]
  goals      Goal[]
}

model Category {
  id          String  @id @default(cuid())
  name        String
  note        String?
  sortOrder   Int     @default(0)
  isHidden    Boolean @default(false)

  categoryGroupId String
  categoryGroup   CategoryGroup @relation(fields: [categoryGroupId], references: [id])

  transactions Transaction[]
  budgets      Budget[]
  goals        Goal[]
}
```

### Transaction & Budget Tracking

```prisma
model Transaction {
  id          String            @id @default(cuid())
  date        DateTime
  amount      Decimal           @db.Decimal(12, 2)
  memo        String?
  payee       String?
  cleared     TransactionStatus @default(UNCLEARED)
  approved    Boolean           @default(true)
  flagColor   String?
  importId    String?

  groupId String
  group   BudgetGroup  @relation(fields: [groupId], references: [id])

  fromAccountId String
  fromAccount   BudgetAccount @relation("FromAccount", fields: [fromAccountId], references: [id])
  
  toAccountId String?
  toAccount   BudgetAccount? @relation("ToAccount", fields: [toAccountId], references: [id])

  categoryId String?
  category   Category? @relation(fields: [categoryId], references: [id])

  splits TransactionSplit[]
}

model Budget {
  id       String  @id @default(cuid())
  month    DateTime // First day of budget month
  budgeted Decimal  @default(0) @db.Decimal(12, 2)
  activity Decimal  @default(0) @db.Decimal(12, 2)
  available Decimal @default(0) @db.Decimal(12, 2)
  note     String?

  groupId String
  group   BudgetGroup  @relation(fields: [groupId], references: [id])

  categoryId String
  category   Category @relation(fields: [categoryId], references: [id])

  @@unique([groupId, categoryId, month])
}
```

### Goals & Messaging System

```prisma
model Goal {
  id         String   @id @default(cuid())
  type       GoalType
  name       String?
  targetAmount Decimal? @db.Decimal(12, 2)
  targetDate DateTime?
  currentAmount Decimal @default(0) @db.Decimal(12, 2)
  isCompleted Boolean @default(false)

  groupId String
  group   BudgetGroup  @relation(fields: [groupId], references: [id])

  categoryId String?
  category   Category? @relation(fields: [categoryId], references: [id])
}

model Message {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())
  
  // Enhanced sender handling for anonymization
  senderId     String?
  sender       User?    @relation("MessagesSent", fields: [senderId], references: [id])
  senderName   String?  // Fallback for anonymized users
  senderEmail  String?
  
  // Anonymization tracking
  isAnonymized    Boolean   @default(false)
  anonymizedAt    DateTime?
  scheduledDelete DateTime?

  groupId   String
  group     BudgetGroup @relation(fields: [groupId], references: [id])

  // Reply functionality
  replyToId String?
  replyTo   Message? @relation("MessageReplies", fields: [replyToId], references: [id])
  replies   Message[] @relation("MessageReplies")
}
```

### Key Schema Design Decisions

1. **Decimal Precision**: Using `Decimal(12, 2)` for all monetary values to avoid floating-point errors
2. **Soft Deletes**: `isHidden` fields instead of hard deletes to preserve data integrity
3. **Audit Trail**: `createdAt` and `updatedAt` timestamps on all major entities
4. **Flexible JSON**: `onboardingData` and `messageRetentionPolicy` for extensible configuration
5. **Referential Integrity**: Proper foreign key relationships with cascade deletes where appropriate

---

## 🔌 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Parameters | Response |
|--------|----------|-------------|------------|----------|
| `POST` | `/api/auth/signup` | Register new user | `{ email, password, name }` | User session |
| `POST` | `/api/auth/signin` | Authenticate user | `{ email, password }` | User session |
| `POST` | `/api/auth/signout` | End user session | None | Success message |
| `POST` | `/api/auth/forgot-password` | Reset password request | `{ email }` | Reset token sent |
| `POST` | `/api/auth/reset-password` | Complete password reset | `{ token, password }` | Success confirmation |
| `POST` | `/api/auth/verify-otp` | Verify email with OTP | `{ email, otp }` | Verification status |

### User Management

| Method | Endpoint | Description | Parameters | Response |
|--------|----------|-------------|------------|----------|
| `GET` | `/api/user/profile` | Get user profile | None | User data with groups |
| `PUT` | `/api/user/profile` | Update user profile | `{ name, preferences }` | Updated user |
| `DELETE` | `/api/user/delete` | Delete user account | None | Deletion confirmation |

### Budget Group Management

| Method | Endpoint | Description | Parameters | Response |
|--------|----------|-------------|------------|----------|
| `GET` | `/api/groups` | List user's groups | None | Array of budget groups |
| `POST` | `/api/groups` | Create new group | `{ name, description, currency }` | New group |
| `PUT` | `/api/groups/[id]` | Update group | `{ name, description }` | Updated group |
| `DELETE` | `/api/groups/[id]` | Delete group | None | Success confirmation |
| `GET` | `/api/groups/[id]/members` | List group members | None | Array of members |
| `POST` | `/api/groups/[id]/members` | Add member to group | `{ userId, role }` | New membership |
| `DELETE` | `/api/groups/[id]/members/[memberId]` | Remove member | None | Success confirmation |

### Account Management

| Method | Endpoint | Description | Parameters | Response |
|--------|----------|-------------|------------|----------|
| `GET` | `/api/accounts` | List accounts | `?planId=string` | Array of accounts |
| `POST` | `/api/accounts` | Create account | `{ name, type, balance, isOnBudget }` | New account |
| `GET` | `/api/accounts/[id]` | Get account details | None | Account data |
| `PUT` | `/api/accounts/[id]` | Update account | `{ name, balance, isClosed }` | Updated account |
| `DELETE` | `/api/accounts/[id]` | Delete account | None | Success confirmation |

### Budget Management

| Method | Endpoint | Description | Parameters | Response |
|--------|----------|-------------|------------|----------|
| `GET` | `/api/budgets` | Get budget data | `?month=date&planId=string&includeHidden=boolean` | Budget structure |
| `POST` | `/api/budgets` | Create budget plan | `{ name, description, currency }` | New budget plan |
| `PUT` | `/api/budgets/[id]/plan` | Update budget plan | `{ name, description }` | Updated plan |
| `DELETE` | `/api/budgets/[id]/plan` | Delete budget plan | None | Success confirmation |

### Category Management

| Method | Endpoint | Description | Parameters | Response |
|--------|----------|-------------|------------|----------|
| `GET` | `/api/categories` | List categories | `?planId=string` | Category hierarchy |
| `POST` | `/api/categories` | Create category group | `{ name, planId }` | New category group |
| `POST` | `/api/categories/[groupId]/categories` | Create category | `{ name, note }` | New category |
| `PUT` | `/api/categories/[groupId]/categories/[categoryId]` | Update category/budget | `{ name?, budgeted?, month? }` | Updated category |
| `DELETE` | `/api/categories/[groupId]/categories/[categoryId]` | Delete category | None | Success confirmation |
| `POST` | `/api/categories/move` | Move categories | `{ categoryIds, targetGroupId }` | Success confirmation |

### Transaction Management

| Method | Endpoint | Description | Parameters | Response |
|--------|----------|-------------|------------|----------|
| `GET` | `/api/transactions` | List transactions | `?planId=string&accountId=string&limit=number` | Array of transactions |
| `POST` | `/api/transactions` | Create transaction | `{ date, amount, payee, fromAccountId, categoryId }` | New transaction |
| `GET` | `/api/transactions/[id]` | Get transaction | None | Transaction details |
| `PUT` | `/api/transactions/[id]` | Update transaction | `{ amount?, payee?, categoryId? }` | Updated transaction |
| `DELETE` | `/api/transactions/[id]` | Delete transaction | None | Success confirmation |

### Goals & Notes

| Method | Endpoint | Description | Parameters | Response |
|--------|----------|-------------|------------|----------|
| `GET` | `/api/goals` | List goals | `?planId=string` | Array of goals |
| `POST` | `/api/goals` | Create goal | `{ type, name, targetAmount, categoryIds }` | New goal |
| `PUT` | `/api/goals/[id]` | Update goal | `{ name?, targetAmount?, isCompleted? }` | Updated goal |
| `DELETE` | `/api/goals/[id]` | Delete goal | None | Success confirmation |
| `GET` | `/api/notes` | List notes | `?planId=string` | Array of notes |
| `POST` | `/api/notes` | Create note | `{ content, categoryId }` | New note |
| `PUT` | `/api/notes/[id]` | Update note | `{ content }` | Updated note |
| `DELETE` | `/api/notes/[id]` | Delete note | None | Success confirmation |

### Reporting & Analytics

| Method | Endpoint | Description | Parameters | Response |
|--------|----------|-------------|------------|----------|
| `GET` | `/api/reports/spending` | Spending analysis | `?month=date&category=string&account=string&planId=string` | Spending breakdown with budget comparison |

### Messaging System

| Method | Endpoint | Description | Parameters | Response |
|--------|----------|-------------|------------|----------|
| `GET` | `/api/messages` | Get group messages | `?groupId=string&limit=number&offset=number` | Array of messages |
| `POST` | `/api/messages` | Send message | `{ groupId, content, replyToId? }` | New message |
| `GET` | `/api/messages/export` | Export messages | `?groupId=string&format=json\|csv` | Message export file |
| `POST` | `/api/messages/cleanup` | Cleanup anonymized messages | `{ olderThan: date }` | Cleanup summary |

### Invitations & Collaboration

| Method | Endpoint | Description | Parameters | Response |
|--------|----------|-------------|------------|----------|
| `POST` | `/api/invitations/send` | Send group invitation | `{ email, groupId, role }` | Invitation sent |
| `POST` | `/api/invitations/accept` | Accept invitation | `{ token }` | Group membership |
| `GET` | `/api/invitations` | List pending invitations | None | Array of invitations |
| `DELETE` | `/api/invitations/[id]` | Cancel invitation | None | Success confirmation |

### Onboarding

| Method | Endpoint | Description | Parameters | Response |
|--------|----------|-------------|------------|----------|
| `POST` | `/api/onboarding/complete` | Complete onboarding | `{ name, budgetingExperience, primaryGoals, monthlyIncome, expenseCategories, ... }` | Success with personalized setup |

### Debug & Utilities

| Method | Endpoint | Description | Parameters | Response |
|--------|----------|-------------|------------|----------|
| `GET` | `/api/debug/user` | Get user debug info | None | Comprehensive user data |
| `GET` | `/api/debug/categories` | Debug category structure | None | Category debugging info |

---

## 🔐 Authentication & Authorization

### Authentication Flow

#### NextAuth.js Configuration
```typescript
// lib/auth.ts
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' }
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })
        
        if (user && await bcrypt.compare(credentials.password, user.password)) {
          return { id: user.id, email: user.email, name: user.name }
        }
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.userId = user.id
      return token
    },
    async session({ session, token }) {
      session.user.id = token.userId
      return session
    }
  }
}
```

### Password Security

#### Hashing Strategy
```typescript
// Password hashing with bcryptjs
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

// Password verification
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash)
}
```

### Role-Based Access Control

#### Authorization Middleware
```typescript
// Middleware for API route protection
export async function validateUserAccess(
  request: Request,
  requiredRole: GroupRole = 'VIEWER'
): Promise<{ user: User; membership: GroupMember } | null> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const membership = await prisma.groupMember.findFirst({
    where: {
      userId: session.user.id,
      groupId: groupId
    },
    include: { user: true }
  })

  if (!membership) {
    throw new Error('Access denied')
  }

  // Role hierarchy: OWNER > EDITOR > VIEWER
  const roleHierarchy = { OWNER: 3, EDITOR: 2, VIEWER: 1 }
  
  if (roleHierarchy[membership.role] < roleHierarchy[requiredRole]) {
    throw new Error('Insufficient permissions')
  }

  return { user: membership.user, membership }
}
```

### Permission System

#### Role Capabilities Matrix

| Action | VIEWER | EDITOR | OWNER |
|--------|--------|--------|-------|
| View Budget Data | ✅ | ✅ | ✅ |
| View Transactions | ✅ | ✅ | ✅ |
| View Reports | ✅ | ✅ | ✅ |
| Send Messages | ✅ | ✅ | ✅ |
| Create/Edit Budgets | ❌ | ✅ | ✅ |
| Create/Edit Transactions | ❌ | ✅ | ✅ |
| Create/Edit Categories | ❌ | ✅ | ✅ |
| Manage Goals | ❌ | ✅ | ✅ |
| Invite Members | ❌ | ❌ | ✅ |
| Remove Members | ❌ | ❌ | ✅ |
| Delete Budget Group | ❌ | ❌ | ✅ |
| Change Group Settings | ❌ | ❌ | ✅ |

### Session Management

#### JWT Token Structure
```typescript
interface BMOJWTToken {
  userId: string
  email: string
  name?: string
  iat: number    // Issued at
  exp: number    // Expiration
  jti: string    // JWT ID
}
```

#### Session Security Features
- **Secure Cookies**: HTTP-only, secure, same-site cookies
- **Token Rotation**: Automatic token refresh on activity
- **Session Expiration**: Configurable session timeout
- **Logout Cleanup**: Complete session cleanup on logout

### Email Verification & Password Reset

#### OTP Verification Flow
```typescript
// Generate and send OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Email verification process
POST /api/auth/verify-otp
{
  email: string
  otp: string
}
```

#### Password Reset Security
```typescript
// Password reset token generation
const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

// Token expiration (24 hours)
const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
```

---

## 💻 Desktop Application Features

### Application Configuration

BMO is designed as a desktop-first application running in the browser, optimized for keyboard and mouse interactions.

```json
{
  "name": "BMO Budget - Desktop Finance Manager",
  "description": "Self-hosted desktop budget application",
  "target_environments": ["Windows", "macOS", "Linux"],
  "browser_requirements": {
    "chrome": ">=90",
    "firefox": ">=88", 
    "safari": ">=14",
    "edge": ">=90"
  }
}
```

### Desktop-Optimized UI

```typescript
// Desktop-specific interaction patterns
interface DesktopInteraction {
  keyboardShortcuts: {
    'Ctrl+N': 'New Transaction',
    'Ctrl+S': 'Save Current Budget',
    'Ctrl+F': 'Search Transactions',
    'Tab': 'Navigate Between Fields',
    'Enter': 'Confirm Input'
  }
  mouseInteractions: {
    rightClick: 'Context Menu',
    doubleClick: 'Edit Mode',
    drag: 'Move Money Between Categories',
    scroll: 'Navigate Large Data Sets'
  }
}
```

### Local Data Management

#### Browser Storage Strategy
```typescript
// Local storage for session data
class LocalDataManager {
  // Use localStorage for user preferences
  savePreferences(preferences: UserPreferences) {
    localStorage.setItem('bmo-preferences', JSON.stringify(preferences))
  }

  // Use sessionStorage for temporary data
  saveSessionData(data: SessionData) {
    sessionStorage.setItem('bmo-session', JSON.stringify(data))
  }

  // Clear sensitive data on logout
  clearSensitiveData() {
    sessionStorage.clear()
    // Keep only non-sensitive preferences
    const prefs = this.getPreferences()
    localStorage.clear()
    if (prefs) this.savePreferences(prefs)
  }
}
```

### Desktop Performance Optimizations

1. **Keyboard Navigation**: Full keyboard accessibility for power users
2. **Large Screen Layout**: Optimized for desktop screen real estate
3. **Context Menus**: Right-click context menus for efficient operations
4. **Bulk Operations**: Desktop-style multi-select and bulk editing
5. **Window Management**: Proper handling of browser window resizing

### Security for Desktop Environment

```typescript
// Desktop security considerations
interface DesktopSecurity {
  sessionManagement: {
    autoLock: 'After 30 minutes of inactivity'
    secure: 'HTTPS only in production'
    sameSite: 'Strict cookie policy'
  }
  dataProtection: {
    localHost: 'Self-hosted for complete control'
    encryption: 'Database encryption at rest'
    noThirdParty: 'No external data sharing'
  }
}
```

---

## 🔄 Real-time Features

### Socket.IO Integration

#### Server Configuration
```typescript
// pages/api/socket.ts
import { Server } from 'socket.io'
import type { NextApiRequest } from 'next'
import type { NextApiResponseServerIO } from '@/types/socket'

export default function SocketHandler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (res.socket.server.io) {
    res.end()
    return
  }

  const io = new Server(res.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL,
      methods: ['GET', 'POST']
    }
  })

  // Budget group rooms for isolated communication
  io.on('connection', (socket) => {
    // Join budget group room
    socket.on('join-budget-group', (groupId: string) => {
      socket.join(`budget-${groupId}`)
    })

    // Leave budget group room
    socket.on('leave-budget-group', (groupId: string) => {
      socket.leave(`budget-${groupId}`)
    })

    // Handle real-time budget updates
    socket.on('budget-update', (data) => {
      socket.to(`budget-${data.groupId}`).emit('budget-updated', data)
    })

    // Handle real-time transaction updates
    socket.on('transaction-update', (data) => {
      socket.to(`budget-${data.groupId}`).emit('transaction-updated', data)
    })

    // Handle real-time messaging
    socket.on('send-message', (data) => {
      io.to(`budget-${data.groupId}`).emit('new-message', data)
    })

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
    })
  })

  res.socket.server.io = io
  res.end()
}
```

#### Client Socket Hook
```typescript
// hooks/useSocket.ts
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export const useSocket = (groupId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socketInstance = io({
      path: '/api/socket',
      transports: ['websocket']
    })

    socketInstance.on('connect', () => {
      setIsConnected(true)
      if (groupId) {
        socketInstance.emit('join-budget-group', groupId)
      }
    })

    socketInstance.on('disconnect', () => {
      setIsConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      if (groupId) {
        socketInstance.emit('leave-budget-group', groupId)
      }
      socketInstance.close()
    }
  }, [groupId])

  const emitBudgetUpdate = (data: any) => {
    socket?.emit('budget-update', { ...data, groupId })
  }

  const emitTransactionUpdate = (data: any) => {
    socket?.emit('transaction-update', { ...data, groupId })
  }

  const sendMessage = (content: string, replyToId?: string) => {
    socket?.emit('send-message', { 
      content, 
      replyToId, 
      groupId 
    })
  }

  return {
    socket,
    isConnected,
    emitBudgetUpdate,
    emitTransactionUpdate,
    sendMessage
  }
}
```

### Real-time Budget Collaboration

#### Live Budget Updates
```typescript
// components/budget/BudgetAmountInput.tsx
export function BudgetAmountInput({ category, onUpdate }: BudgetAmountInputProps) {
  const { emitBudgetUpdate } = useSocket(category.groupId)
  
  const handleBudgetUpdate = async (newAmount: number) => {
    try {
      // Update in database
      const response = await fetch(`/api/categories/${category.groupId}/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budgeted: newAmount })
      })
      
      if (response.ok) {
        // Emit real-time update to other users
        emitBudgetUpdate({
          categoryId: category.id,
          budgeted: newAmount,
          type: 'budget-update'
        })
        
        // Update local state
        onUpdate(category.id, newAmount)
      }
    } catch (error) {
      console.error('Failed to update budget:', error)
    }
  }

  return (
    <input
      type="number"
      value={budgeted}
      onChange={(e) => handleBudgetUpdate(Number(e.target.value))}
      className="budget-input"
    />
  )
}
```

#### Real-time Event Listeners
```typescript
// components/budget/BudgetMain.tsx
export function BudgetMain({ groupId }: BudgetMainProps) {
  const { socket } = useSocket(groupId)
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null)

  useEffect(() => {
    if (!socket) return

    // Listen for budget updates from other users
    socket.on('budget-updated', (data) => {
      setBudgetData(prev => {
        if (!prev) return null
        
        return {
          ...prev,
          categoryGroups: prev.categoryGroups.map(group => ({
            ...group,
            categories: group.categories.map(cat =>
              cat.id === data.categoryId 
                ? { ...cat, budgeted: data.budgeted }
                : cat
            )
          }))
        }
      })
    })

    // Listen for transaction updates
    socket.on('transaction-updated', (data) => {
      // Refresh budget data to reflect transaction changes
      fetchBudgetData()
    })

    return () => {
      socket.off('budget-updated')
      socket.off('transaction-updated')
    }
  }, [socket])

  return (
    <div className="budget-main">
      {/* Budget interface */}
    </div>
  )
}
```

### Real-time Messaging System

#### Message Component with Live Updates
```typescript
// components/settings/team-messaging.tsx
export function TeamMessaging({ groupId }: TeamMessagingProps) {
  const { socket, sendMessage } = useSocket(groupId)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    if (!socket) return

    // Listen for new messages
    socket.on('new-message', (message: Message) => {
      setMessages(prev => [message, ...prev])
    })

    return () => {
      socket.off('new-message')
    }
  }, [socket])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      // Send to server for persistence
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          content: newMessage
        })
      })

      if (response.ok) {
        // Real-time broadcast handled by server
        setNewMessage('')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  return (
    <div className="messaging-container">
      <div className="messages-list">
        {messages.map(message => (
          <MessageItem key={message.id} message={message} />
        ))}
      </div>
      
      <div className="message-input">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  )
}
```

### Conflict Resolution

#### Optimistic Updates with Rollback
```typescript
// utils/optimistic-updates.ts
export class OptimisticUpdater {
  private rollbackStack: Array<() => void> = []

  async updateWithRollback<T>(
    optimisticUpdate: () => void,
    serverUpdate: () => Promise<T>,
    rollbackUpdate: () => void
  ): Promise<T> {
    // Apply optimistic update immediately
    optimisticUpdate()
    this.rollbackStack.push(rollbackUpdate)

    try {
      // Attempt server update
      const result = await serverUpdate()
      
      // Success - clear rollback
      this.rollbackStack.pop()
      return result
    } catch (error) {
      // Failure - rollback optimistic update
      rollbackUpdate()
      this.rollbackStack.pop()
      throw error
    }
  }

  rollbackAll() {
    while (this.rollbackStack.length > 0) {
      const rollback = this.rollbackStack.pop()
      rollback?.()
    }
  }
}
```

### Connection Status Management

#### Connection Indicator Component
```typescript
// components/ui/ConnectionStatus.tsx
export function ConnectionStatus() {
  const { isConnected } = useSocket()
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    if (!isConnected) {
      setShowStatus(true)
    } else {
      const timer = setTimeout(() => setShowStatus(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isConnected])

  if (!showStatus) return null

  return (
    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
      <div className="status-indicator">
        {isConnected ? (
          <>
            <div className="status-dot connected" />
            <span>Connected</span>
          </>
        ) : (
          <>
            <div className="status-dot disconnected" />
            <span>Reconnecting...</span>
          </>
        )}
      </div>
    </div>
  )
}
```

---

## 🧪 Testing

### Testing Strategy

Currently, the BMO application focuses on manual testing and integration testing through the development workflow. A comprehensive testing suite is planned for future implementation.

#### Current Testing Approach

1. **Manual Integration Testing**
   - Complete user workflows tested manually
   - Cross-browser compatibility verification
   - Mobile responsiveness testing
   - PWA functionality validation

2. **API Testing via Development Tools**
   - Postman/Insomnia for endpoint testing
   - Database integrity checks
   - Real-time functionality validation

3. **User Acceptance Testing**
   - Onboarding flow validation
   - Collaborative features testing
   - Offline functionality verification

### Planned Testing Implementation

#### Unit Testing Framework
```typescript
// Future implementation with Jest and React Testing Library
import { render, screen, fireEvent } from '@testing-library/react'
import { BudgetAmountInput } from '@/components/budget/BudgetAmountInput'

describe('BudgetAmountInput', () => {
  it('should update budget amount when value changes', async () => {
    const mockOnUpdate = jest.fn()
    const category = { id: '1', name: 'Groceries', budgeted: 500 }

    render(
      <BudgetAmountInput 
        category={category} 
        onUpdate={mockOnUpdate} 
      />
    )

    const input = screen.getByDisplayValue('500')
    fireEvent.change(input, { target: { value: '600' } })
    
    expect(mockOnUpdate).toHaveBeenCalledWith('1', 600)
  })
})
```

#### Integration Testing
```typescript
// Future API integration tests
describe('Budget API Integration', () => {
  it('should create budget and update category data', async () => {
    // Test complete budget creation workflow
    const budgetData = {
      categoryId: 'test-category',
      month: new Date('2024-01-01'),
      budgeted: 1000
    }

    const response = await fetch('/api/budgets', {
      method: 'POST',
      body: JSON.stringify(budgetData)
    })

    expect(response.status).toBe(201)
    
    const budget = await response.json()
    expect(budget.budgeted).toBe(1000)
  })
})
```

#### E2E Testing with Playwright
```typescript
// Future end-to-end testing
import { test, expect } from '@playwright/test'

test('complete budget creation workflow', async ({ page }) => {
  await page.goto('/auth/signin')
  
  // Login
  await page.fill('[data-testid=email]', 'test@example.com')
  await page.fill('[data-testid=password]', 'password123')
  await page.click('[data-testid=signin-button]')
  
  // Navigate to budget
  await page.goto('/')
  
  // Create budget entry
  await page.fill('[data-testid=budget-input-groceries]', '500')
  await page.keyboard.press('Enter')
  
  // Verify budget was saved
  await expect(page.locator('[data-testid=budget-input-groceries]')).toHaveValue('500')
})
```

### Testing Tools & Libraries (Planned)

| Tool | Purpose | Implementation Status |
|------|---------|----------------------|
| **Jest** | Unit testing framework | Planned |
| **React Testing Library** | Component testing | Planned |
| **Playwright** | End-to-end testing | Planned |
| **MSW (Mock Service Worker)** | API mocking | Planned |
| **@testing-library/jest-dom** | DOM testing utilities | Planned |
| **Supertest** | API endpoint testing | Planned |

### Test Coverage Goals

1. **Unit Tests (Goal: 80%)**
   - Core business logic functions
   - React component rendering
   - Utility functions
   - Form validation logic

2. **Integration Tests (Goal: 60%)**
   - API endpoint functionality
   - Database operations
   - Authentication flows
   - Real-time communication

3. **E2E Tests (Goal: 40%)**
   - Critical user journeys
   - Cross-browser compatibility
   - PWA functionality
   - Collaborative features

---

## ⚙️ Setup Instructions

### Prerequisites

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher
- **PostgreSQL**: Version 14 or higher
- **Git**: For version control

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/bmo-budget-app.git
cd bmo-budget-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

#### Option A: Local PostgreSQL

1. **Install PostgreSQL** on your system
2. **Create a database**:
   ```sql
   CREATE DATABASE bmo_budget;
   CREATE USER bmo_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE bmo_budget TO bmo_user;
   ```

#### Option B: Docker PostgreSQL

```bash
# Run PostgreSQL in Docker
docker run --name bmo-postgres \
  -e POSTGRES_DB=bmo_budget \
  -e POSTGRES_USER=bmo_user \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:14
```

#### Option C: Cloud Database

Use services like:
- **Supabase** (Recommended for development)
- **Railway**
- **PlanetScale**
- **AWS RDS**

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://bmo_user:your_password@localhost:5432/bmo_budget"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-here"

# Email Configuration (Optional for development)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="BMO Budget <noreply@bmo-budget.com>"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Message Cleanup (For production)
CLEANUP_TOKEN="your-cleanup-secret-token"

# Optional: Socket.IO Configuration
SOCKET_IO_SECRET="your-socket-secret"
```

### 5. Database Migration & Seeding

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database with initial data (optional)
npm run db:seed
```

### 6. Development Server

```bash
# Start the development server
npm run dev
```

The application will be available at `http://localhost:3000`

### 7. Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### 8. Database Management

```bash
# Open Prisma Studio for database management
npm run db:studio

# Push schema changes without migration
npm run db:push

# Reset database (caution: destroys all data)
npx prisma db push --force-reset
```

---

### Deployment Options

#### Vercel Deployment (Recommended)

1. **Connect to Vercel**:
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```

2. **Set Environment Variables** in Vercel dashboard

3. **Deploy**:
   ```bash
   vercel --prod
   ```

#### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

```bash
# Build and run Docker container
docker build -t bmo-budget .
docker run -p 3000:3000 --env-file .env.local bmo-budget
```

#### Self-Hosting with PM2

```bash
# Install PM2
npm install -g pm2

# Build the application
npm run build

# Start with PM2
pm2 start npm --name "bmo-budget" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

### Troubleshooting

#### Common Issues

1. **Database Connection Errors**
   ```bash
   # Test database connection
   npx prisma db pull
   ```

2. **Prisma Client Errors**
   ```bash
   # Regenerate Prisma client
   npx prisma generate
   ```

3. **Port Conflicts**
   ```bash
   # Use different port
   PORT=3001 npm run dev
   ```

4. **Email Configuration Issues**
   - Verify SMTP settings
   - Check app-specific passwords for Gmail
   - Test email sending with dedicated script

5. **Build Errors**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run build
   ```

---

## 🚧 Challenges & Solutions

### 1. Real-time Collaboration Conflicts

#### Challenge
Managing simultaneous budget edits from multiple users without data corruption or user confusion.

#### Solution
```typescript
// Implemented optimistic updates with conflict resolution
class ConflictResolver {
  async handleBudgetUpdate(userId: string, categoryId: string, newAmount: number) {
    // Check for concurrent modifications
    const lastModified = await prisma.budget.findUnique({
      where: { categoryId_month: { categoryId, month: currentMonth } },
      select: { updatedAt: true, lastModifiedBy: true }
    })

    if (lastModified.lastModifiedBy !== userId) {
      // Detect conflict and merge changes
      return this.mergeConflictingChanges(lastModified, newAmount)
    }

    // Safe to update
    return this.updateBudget(categoryId, newAmount, userId)
  }
}
```

### 2. Offline Data Synchronization

#### Challenge
Ensuring data integrity when users work offline and sync back online with potential conflicts.

#### Solution
```typescript
// Implemented event sourcing pattern for conflict resolution
interface SyncEvent {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  entityType: string
  entityId: string
  data: any
  timestamp: Date
  userId: string
}

class OfflineSyncManager {
  async syncEvents(events: SyncEvent[]) {
    // Sort events by timestamp
    const sortedEvents = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    
    for (const event of sortedEvents) {
      await this.applyEvent(event)
    }
  }
}
```

### 3. Complex Budget Calculations

#### Challenge
Maintaining accurate budget calculations across categories, months, and rollover logic while ensuring performance.

#### Solution
```typescript
// Implemented calculation engine with caching
class BudgetCalculationEngine {
  private cache = new Map<string, BudgetCalculation>()

  async calculateBudgetData(groupId: string, month: Date): Promise<BudgetData> {
    const cacheKey = `${groupId}-${month.toISOString()}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    const result = await this.performCalculations(groupId, month)
    this.cache.set(cacheKey, result)
    
    // Cache invalidation on updates
    this.invalidateRelatedCache(groupId, month)
    
    return result
  }
}
```

### 4. Desktop Performance Optimization

#### Challenge
Ensuring smooth performance when handling large datasets and complex budget calculations on desktop browsers.

#### Solution
- **Virtual Scrolling**: Implemented for large transaction lists
- **Lazy Loading**: Component-level code splitting
- **Memory Management**: Proper cleanup of event listeners and timers
- **Desktop-Optimized Rendering**: Optimized for desktop browser performance

```typescript
// Virtualized transaction list
import { FixedSizeList as List } from 'react-window'

const TransactionList = ({ transactions }: { transactions: Transaction[] }) => {
  const Row = ({ index, style }: { index: number; style: any }) => (
    <div style={style}>
      <TransactionRow transaction={transactions[index]} />
    </div>
  )

  return (
    <List
      height={600}
      itemCount={transactions.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

### 5. Database Performance at Scale

#### Challenge
Maintaining query performance with growing data sets and complex relationships.

#### Solution
```sql
-- Strategic database indexing
CREATE INDEX CONCURRENTLY idx_budgets_group_month 
ON budgets(group_id, month) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_transactions_date_account 
ON transactions(date DESC, from_account_id) 
WHERE deleted_at IS NULL;

-- Optimized query structure
WITH monthly_budgets AS (
  SELECT 
    category_id,
    SUM(budgeted) as total_budgeted,
    SUM(activity) as total_activity
  FROM budgets 
  WHERE group_id = $1 AND month = $2
  GROUP BY category_id
)
SELECT * FROM monthly_budgets;
```

### 6. User Privacy & Message Anonymization

#### Challenge
Balancing user privacy with team collaboration when users leave groups or delete accounts.

#### Solution
```typescript
// Implemented graceful user removal with message preservation
async function anonymizeUserMessages(userId: string, groupId: string) {
  const retentionPolicy = await getGroupRetentionPolicy(groupId)
  
  await prisma.message.updateMany({
    where: { senderId: userId, groupId },
    data: {
      senderId: null,
      isAnonymized: true,
      anonymizedAt: new Date(),
      scheduledDelete: new Date(Date.now() + retentionPolicy.anonymizedRetentionHours * 60 * 60 * 1000)
    }
  })
}
```

### 7. Type Safety Across Client/Server Boundary

#### Challenge
Maintaining type safety between frontend components and API responses.

#### Solution
```typescript
// Shared type definitions with validation
// types/api.ts
export interface CreateTransactionRequest {
  date: string
  amount: number
  payee: string
  fromAccountId: string
  categoryId?: string
}

export interface CreateTransactionResponse {
  id: string
  date: string
  amount: number
  payee: string
  fromAccount: AccountSummary
  category?: CategorySummary
}

// API route with validation
export async function POST(request: Request) {
  const body = await request.json()
  
  // Runtime validation with Zod
  const validatedData = CreateTransactionSchema.parse(body)
  
  const transaction = await createTransaction(validatedData)
  
  return NextResponse.json<CreateTransactionResponse>(transaction)
}
```

---

## 🚀 Future Improvements

### Short-term Enhancements (Next 3-6 months)

#### 1. Advanced Reporting & Analytics
- **Spending Trends**: Multi-month trend analysis with predictive insights
- **Category Performance**: Detailed category-level analytics with recommendations
- **Goal Progress Tracking**: Visual progress indicators with achievement celebrations
- **Export Options**: PDF reports, Excel exports, and scheduled email reports

```typescript
// Planned implementation
interface AdvancedReport {
  type: 'spending-trends' | 'category-analysis' | 'goal-progress'
  timeRange: { start: Date; end: Date }
  groupBy: 'category' | 'month' | 'account'
  includeForecasting: boolean
  exportFormat: 'pdf' | 'xlsx' | 'csv'
}
```

#### 2. Enhanced Mobile Experience
- **Native Mobile App**: React Native implementation for iOS and Android
- **Biometric Authentication**: Fingerprint and Face ID support
- **Offline Camera**: Receipt scanning and OCR for transaction entry
- **Push Notifications**: Budget alerts and spending limit warnings

#### 3. Bank Integration & Import
- **Plaid Integration**: Automatic transaction import from banks
- **CSV Import**: Support for various bank export formats
- **Duplicate Detection**: Smart duplicate transaction identification
- **Categorization AI**: Machine learning for automatic transaction categorization

```typescript
// Planned bank integration
interface BankIntegration {
  provider: 'plaid' | 'yodlee' | 'finicity'
  institutionId: string
  accountIds: string[]
  autoImport: boolean
  categoryMapping: Record<string, string>
}
```

### Medium-term Features (6-12 months)

#### 4. AI-Powered Financial Insights
- **Spending Pattern Analysis**: AI identification of unusual spending patterns
- **Budget Optimization**: Suggestions for budget allocation improvements
- **Goal Achievement Predictions**: ML models for goal completion likelihood
- **Personalized Recommendations**: Custom financial advice based on user behavior

#### 5. Advanced Collaboration Features
- **Budget Proposals**: Formal budget change requests with approval workflows
- **Spending Limits**: Individual member spending limits with notifications
- **Audit Trail**: Complete change history with user attribution
- **Role Customization**: Custom role definitions beyond Owner/Editor/Viewer

#### 6. Investment Tracking
- **Portfolio Integration**: Investment account tracking and performance
- **Asset Allocation**: Visual representation of investment distribution
- **Performance Metrics**: ROI calculations and benchmark comparisons
- **Rebalancing Alerts**: Notifications when portfolio drift occurs

### Long-term Vision (1-2 years)

#### 7. Enterprise Features
- **Multi-tenancy**: Support for organizations with multiple budget groups
- **SSO Integration**: SAML/OAuth integration for enterprise authentication
- **Advanced Security**: SOC 2 compliance and enhanced audit capabilities
- **API Platform**: Public API for third-party integrations

#### 8. Financial Planning Tools
- **Retirement Planning**: Long-term retirement savings calculations
- **Debt Payoff Strategies**: Debt snowball/avalanche optimization
- **Emergency Fund Calculator**: Emergency fund adequacy assessment
- **Tax Planning**: Tax-efficient savings and spending strategies

#### 9. Community Features
- **Budget Templates**: Community-shared budget templates
- **Anonymous Benchmarking**: Compare spending patterns with similar users
- **Financial Challenges**: Gamified savings and spending challenges
- **Expert Content**: Integration with financial education content

### Technical Improvements

#### 10. Performance & Scalability
```typescript
// Planned optimizations
interface PerformanceEnhancements {
  databaseOptimizations: {
    partitioning: 'monthly_partitions'
    caching: 'redis_implementation'
    readReplicas: 'geographic_distribution'
  }
  frontendOptimizations: {
    bundleAnalysis: 'webpack_bundle_analyzer'
    codesplitting: 'route_based_splitting'
    imageOptimization: 'next_image_cdn'
  }
  apiOptimizations: {
    graphql: 'apollo_server_integration'
    caching: 'api_response_caching'
    rateLimit: 'user_based_rate_limiting'
  }
}
```

#### 11. Testing & Quality Assurance
- **Comprehensive Test Suite**: 90%+ code coverage with unit, integration, and E2E tests
- **Performance Testing**: Load testing and performance regression detection
- **Accessibility Testing**: WCAG 2.1 AA compliance verification
- **Security Testing**: Regular penetration testing and vulnerability assessments

#### 12. DevOps & Infrastructure
- **CI/CD Pipeline**: Automated testing, building, and deployment
- **Monitoring & Alerting**: Application performance monitoring with real-time alerts
- **Backup & Recovery**: Automated database backups with point-in-time recovery
- **Multi-region Deployment**: Geographic distribution for improved latency

### Architecture Evolution

#### 13. Microservices Migration
```typescript
// Planned service decomposition
interface MicroservicesArchitecture {
  services: {
    userService: 'authentication_and_user_management'
    budgetService: 'budget_calculations_and_storage'
    transactionService: 'transaction_processing'
    reportingService: 'analytics_and_reporting'
    notificationService: 'email_and_push_notifications'
    integrationService: 'bank_and_third_party_apis'
  }
  communication: 'event_driven_architecture'
  dataConsistency: 'eventual_consistency_with_saga_pattern'
}
```

#### 14. Advanced Security
- **Zero-Trust Architecture**: Comprehensive security model with least-privilege access
- **End-to-End Encryption**: Client-side encryption for sensitive financial data
- **Compliance Framework**: PCI DSS, SOX, and regional data protection compliance
- **Security Monitoring**: Real-time threat detection and response

### Community & Open Source

#### 15. Open Source Ecosystem
- **Plugin Architecture**: Third-party plugin support for custom features
- **API Marketplace**: Community-developed integrations and extensions
- **Translation Platform**: Community-driven localization for global users
- **Documentation Platform**: Comprehensive developer and user documentation

---

## 💻 Source Code

The complete source code for BMO (Budget Money Online) is available in this repository. Below is a high-level overview of the key implementation files:

### Core Application Files

#### Root Configuration
- `package.json` - Dependencies and scripts
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `middleware.ts` - Next.js middleware for authentication

#### Database & Backend
- `prisma/schema.prisma` - Complete database schema
- `lib/db.ts` - Prisma client configuration
- `lib/auth.ts` - NextAuth.js authentication setup
- `lib/utils.ts` - Utility functions and helpers

#### API Routes (app/api/)
- **Authentication**: `auth/[...nextauth]/route.ts`, `auth/signup/route.ts`, etc.
- **Budget Management**: `budgets/route.ts`, `budgets/[id]/route.ts`
- **User Management**: `user/profile/route.ts`, `user/delete/route.ts`
- **Financial Data**: `accounts/route.ts`, `transactions/route.ts`, `categories/route.ts`
- **Collaboration**: `groups/route.ts`, `invitations/route.ts`, `messages/route.ts`
- **Reporting**: `reports/spending/route.ts`

#### Frontend Components (components/)
- **Budget Interface**: `budget/budget-main.tsx`, `budget/BudgetAmountInput.js`
- **Account Management**: `accounts/account-form.tsx`, `accounts/accounts-main.tsx`
- **Transaction Management**: `transactions/transaction-form.tsx`
- **Reporting**: `reports/reports-main.tsx`, `reports/spending-chart.tsx`
- **Collaboration**: `settings/team-messaging.tsx`, `settings/user-management.tsx`
- **UI Components**: `ui/button.tsx`, `ui/card.tsx`, `ui/input.tsx`

#### Application Pages (app/)
- `page.tsx` - Main budget dashboard
- `layout.tsx` - Root application layout
- `onboarding/page.tsx` - User onboarding flow
- `accounts/page.tsx` - Account management interface
- `transactions/page.tsx` - Transaction management
- `reports/page.tsx` - Financial reporting
- `settings/page.tsx` - Application settings

#### Utilities & Hooks
- `hooks/useSocket.ts` - Real-time communication hook
- `lib/email.ts` - Email sending utilities
- `lib/socket.ts` - Socket.IO configuration
- `types/index.ts` - TypeScript type definitions

### PWA Configuration
- `public/manifest.json` - PWA manifest
- `public/sw.js` - Service worker (generated)
- Icon files and app screenshots

### Development & Deployment
- `.gitignore` - Git ignore patterns
- `docker-compose.yml` - Docker development setup
- `scripts/` - Utility scripts for development
- Environment configuration templates

---

## 📝 Conclusion

BMO (Budget Money Online) represents a comprehensive, modern approach to personal finance management for desktop environments. Built with cutting-edge web technologies, it provides users with powerful budgeting tools while maintaining privacy, security, and local data control.

### Key Achievements

1. **Comprehensive Feature Set**: Zero-based budgeting, real-time collaboration, desktop-optimized interface
2. **Modern Architecture**: Next.js 14, TypeScript, Prisma ORM with PostgreSQL
3. **User-Centric Design**: Intuitive interface inspired by YNAB with modern UX principles
4. **Privacy-First Approach**: Self-hostable with complete data ownership
5. **Scalable Foundation**: Architecture designed for growth and feature expansion

### Project Impact

BMO democratizes access to sophisticated budgeting tools, providing a free, open-source alternative to expensive commercial solutions. Its collaborative features enable families and teams to work together on financial planning, while its self-hosted design ensures complete data privacy and control.

### Technical Excellence

The application demonstrates best practices in modern web development:
- Type-safe development with TypeScript
- Secure authentication and authorization
- Real-time features with conflict resolution
- Desktop-optimized user interface
- Comprehensive database design
- Scalable API architecture

### Future Potential

With its solid foundation, BMO is positioned for significant expansion into areas like AI-powered financial insights, bank integrations, investment tracking, and enterprise features. The modular architecture and clean codebase facilitate rapid feature development and community contributions.

---

**BMO (Budget Money Online)** - *Desktop personal finance management with complete data privacy*

*This documentation serves as a comprehensive guide for developers, contributors, and users interested in understanding, setting up locally, or extending the BMO budget management platform.*

**Last Updated**: January 2024  
**Version**: 1.0.0  
**License**: MIT License  
**Repository**: [GitHub Repository URL] 