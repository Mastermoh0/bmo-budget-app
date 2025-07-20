# BMO (Budget Money Online) 🏦

**A comprehensive, YNAB-inspired personal finance management application for desktop with real-time collaboration capabilities.**

![BMO Dashboard](public/pictures/Screenshot%202025-07-02%20180253.png)

## 🌟 Features

### 💰 Core Budgeting
- **Zero-Based Budgeting**: Every dollar has a purpose before spending
- **Month-to-Month Navigation**: Independent budgets with rollover capabilities  
- **Category Management**: Hierarchical organization with groups and subcategories
- **Real-Time Calculations**: Live budget vs actual tracking with variance analysis
- **Quick Budget Rules**: 50/30/20, 70/20/10, zero-based allocation templates

### 👥 Collaboration & Sharing
- **Multi-User Budget Groups**: Share budgets with family members and partners
- **Role-Based Access**: Owner, Editor, and Viewer permissions
- **Real-Time Synchronization**: Changes sync instantly across all group members
- **Team Messaging**: Built-in chat for budget collaboration with message threading
- **Invitation System**: Secure email-based group invitations

### 📊 Financial Management
- **Multi-Account Support**: Checking, savings, credit cards, investments, and more
- **Transaction Management**: Manual entry with payee, memo, and categorization
- **Account Transfers**: Internal money movement between accounts
- **Goal Tracking**: Multiple goal types with progress visualization
- **Comprehensive Reporting**: Budget vs actual analysis with interactive charts

### 💻 Desktop Application
- **Desktop-Focused**: Optimized for desktop/PC use with keyboard and mouse interactions
- **Local Installation**: Self-hosted application for complete data privacy
- **Real-Time Updates**: Socket.IO powered live collaboration
- **Modern UI**: Clean, professional interface designed for desktop workflows

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Recharts** - Data visualization
- **Socket.IO Client** - Real-time communication

### Backend
- **PostgreSQL** - Primary database
- **Prisma ORM** - Type-safe database access
- **NextAuth.js** - Authentication system
- **Socket.IO** - Real-time features
- **bcryptjs** - Password security

### Infrastructure
- **Zustand** - Client state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn
- **Desktop Environment**: Windows, macOS, or Linux desktop

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/bmo-budget-app.git
cd bmo-budget-app
npm install
```

### 2. Environment Setup
Create `.env.local`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/bmo_budget"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email (Optional)
EMAIL_HOST="smtp.gmail.com"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
```

### 3. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### 4. Start Development
```bash
npm run dev
```

Visit `http://localhost:3000` in your desktop browser to access the application.

## 📖 Key Workflows

### Creating Your First Budget
1. **Sign up** and complete the personalized onboarding questionnaire
2. **Add accounts** (checking, savings, credit cards)
3. **Set up categories** based on your lifestyle (auto-generated from onboarding)
4. **Allocate income** to categories using zero-based budgeting
5. **Track transactions** and monitor budget performance

### Collaborative Budgeting
1. **Create a budget group** or receive an invitation
2. **Assign roles** (Owner, Editor, Viewer) to team members
3. **Collaborate in real-time** with live updates and messaging
4. **Set goals together** and track shared financial objectives
5. **Generate reports** to analyze spending patterns

### Month-to-Month Planning
1. **Navigate between months** to view historical and future budgets
2. **Plan ahead** by setting up budgets for future months
3. **Review performance** by comparing budget vs actual spending
4. **Adjust strategies** based on spending insights and trends

## 🏗️ Project Structure

```
budget-app/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (pages)/           # Application pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── budget/           # Budget management UI
│   ├── accounts/         # Account management
│   ├── transactions/     # Transaction interfaces
│   ├── reports/          # Reporting components
│   └── ui/               # Base UI components
├── lib/                  # Utilities & configuration
├── prisma/               # Database schema & migrations
├── hooks/                # Custom React hooks
├── types/                # TypeScript definitions
└── public/               # Static assets
```

## 🔐 Security Features

- **Secure Authentication**: NextAuth.js with bcrypt password hashing
- **Role-Based Access**: Granular permissions for collaborative features
- **Data Privacy**: Message anonymization when users leave groups
- **API Security**: Request validation and rate limiting
- **Session Management**: Secure JWT tokens with automatic refresh
- **Local Data Control**: Self-hosted for complete data ownership

## 📊 Database Schema

Built on PostgreSQL with Prisma ORM, featuring:
- **User Management**: Authentication, profiles, and preferences
- **Budget Groups**: Multi-user collaboration with role management
- **Financial Data**: Accounts, transactions, budgets, and categories
- **Goals & Notes**: Target tracking and collaborative notes
- **Messaging**: Real-time communication with retention policies

## 🔄 Real-Time Features

### Live Collaboration
- **Budget Updates**: See changes from other users instantly
- **Transaction Sync**: Real-time transaction updates across devices
- **Conflict Resolution**: Smart handling of simultaneous edits
- **Connection Management**: Automatic reconnection and offline handling

### Messaging System
- **Group Chat**: Built-in messaging for budget discussions
- **Message Threading**: Reply-to functionality for organized conversations
- **User Privacy**: Message anonymization with configurable retention
- **Export Options**: JSON and CSV message exports

## 🧪 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

### Testing (Planned)
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Playwright for user workflows
- **Performance Tests**: Lighthouse CI integration

## 🏠 Local Hosting

### Development Environment
```bash
npm run dev
```
Access at `http://localhost:3000`

### Production Build (Local)
```bash
npm run build
npm start
```

### Process Management (Local Production)
```bash
# Install PM2 for process management
npm install -g pm2

# Build and start with PM2
npm run build
pm2 start npm --name "bmo-budget" -- start
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Use Prettier for code formatting
- Write descriptive commit messages
- Add tests for new features
- Update documentation as needed
- **Desktop-First Design**: Optimize for desktop workflows and interactions

## 📋 Roadmap

### Short Term (Q1 2024)
- [ ] Advanced reporting features
- [ ] Automated testing suite
- [ ] Performance optimizations
- [ ] Enhanced desktop UI/UX

### Medium Term (Q2-Q3 2024)
- [ ] AI-powered financial insights
- [ ] Investment tracking
- [ ] Multi-currency support
- [ ] Desktop application packaging (Electron)

### Long Term (Q4 2024+)
- [ ] Advanced collaboration features
- [ ] Financial planning tools
- [ ] Plugin architecture
- [ ] Enterprise features for organizations

## 🐛 Known Issues

- Email verification requires SMTP configuration
- Real-time features require Socket.IO server setup
- Windows/macOS/Linux desktop environments only
- Performance optimization ongoing for large datasets

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **YNAB (You Need A Budget)** - Inspiration for budgeting methodology
- **Next.js Team** - Amazing React framework
- **Prisma Team** - Excellent database toolkit
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework

## 📞 Support

- **Documentation**: [Full Documentation](PROJECT_DOCUMENTATION.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/bmo-budget-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/bmo-budget-app/discussions)

---

**BMO (Budget Money Online)** - *Desktop personal finance management for complete data privacy* 🚀

Self-hosted • Desktop-First • Privacy-Focused 