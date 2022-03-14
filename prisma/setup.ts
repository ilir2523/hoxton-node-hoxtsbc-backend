import { Prisma, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({ log: ['query', 'error', 'warn', 'info'] })

const users = [
    {
        email: 'admin@prisma.com',
        fullName: 'Admin Prisma',
        amountInAccount: 500
    },
    {
        email: 'test@prisma.com',
        fullName: 'Test Prisma',
        amountInAccount: 1000
    }
]

const transactions = [
    {
        user_id: 1,
        amount: 1000,
        currency: 'USD',
        receiverOrSender: 'sender',
        completedAt: '3/14/2022',
        isPositive: true
    },
    {
        user_id: 2,
        amount: 500,
        currency: 'USD',
        receiverOrSender: 'receiver',
        completedAt: '3/14/2022',
        isPositive: true
    }
]

async function createStuf() {
    for (const user of users) {
        await prisma.user.create({data: user})
    }

    for (const transaction of transactions) {
        await prisma.transaction.create({data: transaction})
    }
}

createStuf()