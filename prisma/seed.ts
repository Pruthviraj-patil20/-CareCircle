import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'test@carecircle.com' },
    update: {},
    create: {
      email: 'test@carecircle.com',
      name: 'Test User',
      passwordHash,
      families: {
        create: {
          role: 'OWNER',
          family: {
            create: {
              name: 'My Test Family',
              description: 'A family created for testing purposes',
            }
          }
        }
      }
    },
  })

  console.log({ user })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
