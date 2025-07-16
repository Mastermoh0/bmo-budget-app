'use client'

import { useState } from 'react'
import { Settings, Users, MessageCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { UserManagement } from './user-management'
import { GeneralSettings } from './general-settings'
import { TeamMessaging } from './team-messaging'

interface BudgetSettingsProps {
  groupId: string
  groupName: string
  currentUserRole: 'OWNER' | 'EDITOR' | 'VIEWER'
  currentUserId: string
}

type TabKey = 'general' | 'team' | 'notifications'

export function BudgetSettings({ groupId, groupName, currentUserRole, currentUserId }: BudgetSettingsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('general')

  const tabs = [
    {
      key: 'general' as TabKey,
      label: 'General',
      icon: Settings,
      description: 'Budget name and basic settings'
    },
    {
      key: 'team' as TabKey,
      label: 'Team',
      icon: Users,
      description: 'Manage team members and permissions'
    },
    {
      key: 'notifications' as TabKey,
      label: 'Messages',
      icon: MessageCircle,
      description: 'Team chat and messaging'
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
      case 'notifications':
        return (
          <TeamMessaging
            groupId={groupId}
            currentUserId={currentUserId}
          />
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
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTab === tab.key
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{tab.label}</span>
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