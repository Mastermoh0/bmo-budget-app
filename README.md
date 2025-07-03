# Budget App - YNAB-Inspired Personal Finance Manager

A full-featured budgeting web application inspired by You Need A Budget (YNAB) with offline support and PWA capabilities.

## 🚀 Features

### ✅ Core Budget Functionality
- **Manual Money Assignment**: "To Be Budgeted" logic with drag-and-drop allocation
- **Category Groups**: Organize spending into logical groups with sub-categories
- **Rolling Balances**: Leftover money automatically rolls over to next month
- **Mid-Month Transfers**: Move funds between categories as needed
- **Overspending Coverage**: Transfer funds to cover overspent categories

### ✅ Account & Transaction Management
- **Multiple Account Types**: Cash, Checking, Savings, Credit Cards, etc.
- **Manual Transaction Entry**: Add, edit, and categorize transactions
- **Account Transfers**: Move money between your own accounts
- **Starting Balance Setup**: Initialize accounts with current balances

### ✅ Advanced Budgeting
- **Goal Tracking**: Set monthly or total savings targets per category
- **Progress Indicators**: Visual progress bars and percentage tracking
- **Auto-Budgeting Rules**: 50/30/20, 70/20/10, Zero-Based budgeting templates
- **Quick Budget Panel**: Rapid budget allocation with pre-defined rules

### ✅ Progressive Web App (PWA)
- **Offline Support**: Full functionality without internet connection
- **IndexedDB Sync**: Local data storage with server synchronization
- **Installable**: Add to home screen on mobile and desktop
- **Background Sync**: Automatic data sync when connection resumes

### ✅ Collaboration Features
- **Shared Budget Groups**: Invite family members or partners
- **Role-Based Access**: Owner, Editor, and Viewer permissions
- **Real-time Updates**: Changes sync across all group members

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS with custom YNAB-inspired design system
- **UI Components**: Radix UI primitives
- **State Management**: Zustand for client state
- **Offline Storage**: Dexie.js (IndexedDB wrapper)
- **Icons**: Lucide React

## 📁 Project Structure

```
budget-app/
├── app/                     # Next.js App Router pages
│   ├── layout.tsx          # Root layout with PWA config
│   └── page.tsx            # Main budget dashboard
├── components/             # React components
│   ├── budget/            # Budget-specific components
│   │   ├── budget-header.tsx
│   │   ├── budget-sidebar.tsx
│   │   ├── budget-main.tsx
│   │   └── quick-budget-panel.tsx
│   └── ui/                # Reusable UI components
├── lib/                   # Utilities and configurations
│   ├── db.ts             # Prisma client
│   └── utils.ts          # Helper functions
├── prisma/               # Database schema and migrations
│   └── schema.prisma     # Complete data model
├── public/               # Static assets and PWA files
│   └── manifest.json     # PWA manifest
├── types/                # TypeScript type definitions
└── hooks/                # Custom React hooks
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd budget-app
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your database connection string and other config:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/budget_app"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

3. **Set up the database**:
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Run database migrations
npm run db:migrate
```

4. **Start the development server**:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app!

## 📱 PWA Installation

The app can be installed as a Progressive Web App:

1. **Desktop**: Click the install button in your browser's address bar
2. **Mobile**: Use "Add to Home Screen" from your browser menu
3. **Features**: Works offline, receives background sync, home screen icon

## 🎯 Usage Guide

### Getting Started
1. **Set up accounts**: Add your checking, savings, and credit card accounts
2. **Create categories**: Organize spending into groups (Bills, Food, Entertainment, etc.)
3. **Add starting balances**: Enter current account balances
4. **Budget your money**: Assign every dollar to a category using "To Be Budgeted"

### Monthly Budgeting Workflow
1. **Review last month**: Check overspending and category performance
2. **Assign new income**: Move new money from "To Be Budgeted" to categories
3. **Use Quick Budget**: Apply percentage rules (50/30/20) or custom templates
4. **Set goals**: Define savings targets for specific categories
5. **Track progress**: Monitor spending throughout the month

### Advanced Features
- **Money moves**: Transfer funds between categories mid-month
- **Goal tracking**: Visual progress toward savings targets
- **Collaboration**: Share budgets with family members
- **Reports**: Analyze spending patterns and trends
- **Offline usage**: Full functionality without internet connection

## 🧪 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Database Schema
The app uses a comprehensive schema with models for:
- Users and Groups (collaboration)
- Accounts and Transactions
- Categories and Category Groups
- Budgets and Goals
- Money Moves and Sync Logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [You Need A Budget (YNAB)](https://www.youneedabudget.com/)
- Built with [Next.js](https://nextjs.org/), [Prisma](https://prisma.io/), and [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)
- UI components by [Radix UI](https://www.radix-ui.com/) 