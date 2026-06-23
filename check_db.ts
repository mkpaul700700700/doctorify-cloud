import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const reports = await prisma.medicalReport.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  })
  console.log(reports)
}
main().catch(console.error).finally(() => prisma.$disconnect())
