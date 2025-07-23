import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { TeamsMain } from '@/components/teams/teams-main'

export default async function TeamsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Get user's budget group membership
  const userMembership = await prisma.groupMember.findFirst({
    where: {
      userId: session.user.id
    },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          createdAt: true
        }
      }
    }
  })

  if (!userMembership) {
    redirect('/onboarding')
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-2">
            Manage your team members, send invitations, and collaborate with your budget team.
          </p>
        </div>

        {/* Teams Main Component */}
        <TeamsMain 
          groupId={userMembership.groupId}
          groupName={userMembership.group.name}
          currentUserRole={userMembership.role}
          currentUserId={session.user.id}
        />
      </div>
    </div>
  )
} 