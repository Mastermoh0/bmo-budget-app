'use client'

import { useState } from 'react'
import { UserPlus, Users, MessageCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { TeamInvites } from './team-invites'
import { TeamMembers } from './team-members'
import { TeamMessaging } from '@/components/settings/team-messaging'

interface TeamsMainProps {
  groupId: string
  groupName: string
  currentUserRole: 'OWNER' | 'EDITOR' | 'VIEWER'
  currentUserId: string
}

type TabKey = 'invites' | 'members' | 'chat'

export function TeamsMain({ groupId, groupName, currentUserRole, currentUserId }: TeamsMainProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('invites')

  const tabs = [
    {
      key: 'invites' as TabKey,
      label: 'Send Invites',
      icon: UserPlus,
      description: 'Invite new team members to your budget'
    },
    {
      key: 'members' as TabKey,
      label: 'Team Members',
      icon: Users,
      description: 'View and manage team members'
    },
    {
      key: 'chat' as TabKey,
      label: 'Team Chat',
      icon: MessageCircle,
      description: 'Team messaging and collaboration'
    }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'invites':
        return (
          <TeamInvites
            groupId={groupId}
            currentUserRole={currentUserRole}
          />
        )
      case 'members':
        return (
          <TeamMembers
            groupId={groupId}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
          />
        )
      case 'chat':
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
          <h3 className="font-medium text-gray-900 mb-4">Team Features</h3>
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