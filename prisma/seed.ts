import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  // Create or update user
  const user = await prisma.user.upsert({
    where: { email: 'test@carecircle.com' },
    update: {},
    create: {
      email: 'test@carecircle.com',
      name: 'Sarah Johnson',
      passwordHash,
    },
  })

  // Create or find family 
  let family = await prisma.family.findFirst({ where: { members: { some: { userId: user.id } } } })
  
  if (!family) {
    family = await prisma.family.create({
      data: {
        name: 'The Johnson Family',
        description: 'A family created for testing',
        members: {
          create: { userId: user.id, role: 'OWNER' }
        }
      }
    })
  }

  const familyId = family.id
  const now = new Date()

  // Seed Tasks
  await prisma.task.createMany({
    data: [
      {
        familyId,
        title: 'Pick up Emily from soccer practice',
        priority: 'HIGH',
        status: 'TODO',
        assigneeId: user.id,
        createdById: user.id,
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 30),
      },
      {
        familyId,
        title: 'Renew car insurance',
        priority: 'URGENT',
        status: 'TODO',
        assigneeId: user.id,
        createdById: user.id,
        dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago (overdue)
      },
      {
        familyId,
        title: 'Schedule annual checkups',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        assigneeId: user.id,
        createdById: user.id,
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      },
      {
        familyId,
        title: 'Grocery shopping',
        priority: 'LOW',
        status: 'TODO',
        assigneeId: user.id,
        createdById: user.id,
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0),
      },
    ],
    skipDuplicates: true,
  })

  // Seed Events
  await prisma.event.createMany({
    data: [
      {
        familyId,
        title: "Doctor's Appointment - Emma",
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0),
        location: 'City Medical Center',
        createdById: user.id,
      },
      {
        familyId,
        title: 'Soccer Practice',
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 30),
        location: 'Riverside Park Field 3',
        createdById: user.id,
      },
      {
        familyId,
        title: 'Family Dinner at Grandma\'s',
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 30),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 0),
        location: '123 Oak Street',
        createdById: user.id,
      },
    ],
    skipDuplicates: true,
  })

  // Seed Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        familyId,
        userId: user.id,
        action: 'completed',
        entityType: 'task',
        entityName: 'Pay electricity bill',
      },
      {
        familyId,
        userId: user.id,
        action: 'created',
        entityType: 'event',
        entityName: "Doctor's Appointment - Emma",
      },
      {
        familyId,
        userId: user.id,
        action: 'uploaded',
        entityType: 'document',
        entityName: 'Insurance Policy 2026.pdf',
      },
    ],
    skipDuplicates: true,
  })

  console.log({ user: user.email, family: family.name })
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
