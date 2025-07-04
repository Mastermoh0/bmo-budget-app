'use client'

import { useState } from 'react'
import { Settings, Users, CreditCard, MessageCircle, Shield, Database } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { UserManagement } from './user-management'
import { GeneralSettings } from './general-settings'
import { AccountSettings } from './account-settings'
import { TeamMessaging } from './team-messaging'

interface BudgetSettingsProps {
  groupId: string
  groupName: string
  currentUserRole: 'OWNER' | 'EDITOR' | 'VIEWER'
  currentUserId: string
}

type TabKey = 'general' | 'team' | 'accounts' | 'notifications' | 'security' | 'data'

export function BudgetSettings({ groupId, groupName, currentUserRole, currentUserId }: BudgetSettingsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('general')

  const tabs = [
    {
      key: 'general' as TabKey,
      label: 'General',
      icon: Settings,
      description: 'Budget name and basic settings',
      available: true
    },
    {
      key: 'team' as TabKey,
      label: 'Team',
      icon: Users,
      description: 'Manage team members and permissions',
      available: true
    },
    {
      key: 'accounts' as TabKey,
      label: 'Accounts',
      icon: CreditCard,
      description: 'Manage connected accounts',
      available: true
    },
    {
      key: 'notifications' as TabKey,
      label: 'Messages',
      icon: MessageCircle,
      description: 'Team chat and messaging',
      available: true
    },
    {
      key: 'security' as TabKey,
      label: 'Security',
      icon: Shield,
      description: 'Security and privacy settings',
      available: false
    },
    {
      key: 'data' as TabKey,
      label: 'Data',
      icon: Database,
      description: 'Export and backup options',
      available: false
    }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <GeneralSettings
            groupId={groupId}
            groupName={groupName}
            currentUserRole={currentUserRole}
          />
        )
      case 'team':
        return (
          <UserManagement
            groupId={groupId}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
          />
        )
      case 'accounts':
        return (
          <AccountSettings
            groupId={groupId}
            currentUserRole={currentUserRole}
          />
        )
      case 'notifications':
        return (
          <TeamMessaging
            groupId={groupId}
            currentUserId={currentUserId}
          />
        )
      default:
        return (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">🚧</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-600">This feature is currently under development.</p>
          </div>
        )
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar Navigation */}
      <div className="lg:col-span-1">
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 mb-4">Settings</h3>
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => tab.available && setActiveTab(tab.key)}
                  disabled={!tab.available}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTab === tab.key
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : tab.available
                      ? 'text-gray-700 hover:bg-gray-50'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{tab.label}</span>
                        {!tab.available && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            Soon
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{tab.description}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </nav>
        </Card>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3">
        {renderTabContent()}
      </div>
    </div>
  )
} 