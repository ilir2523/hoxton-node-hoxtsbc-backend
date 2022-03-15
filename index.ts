import express from 'express'
import { PrismaClient } from '@prisma/client'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import 'dotenv/config'

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 4001

const prisma = new PrismaClient({ log: ['query', 'error', 'warn', 'info'] })

function createToken(id: number) {
    // @ts-ignore
    return jwt.sign({ id: id }, process.env.MY_SECRET, { expiresIn: '3days' })
}

app.get('/users', async (req, res) => {
    const users = await prisma.user.findMany({ include: { transactions: true } })
    res.send(users)
})

app.post('/sign-up', async (req, res) => {
    const { email, password, fullName } = req.body

    try {
        const hash = bcrypt.hashSync(password, 8)
        const user = await prisma.user.create({
            data: {
                email: email,
                password: hash,
                fullName: fullName,
                amountInAccount: 0
            }
        })
        res.send({ user, token: createToken(user.id) })
    } catch (err) {
        res.status(400).send({ error: err.message })
    }
})

app.patch('/changePassword', async (req, res) => {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email: email}})

    if (user) {
        try {
            const hash = bcrypt.hashSync(password, 8)
            const updateUser = await prisma.user.update( { where: {email}, data: { password: hash}} )
            res.send({ updateUser, token: createToken(updateUser.id) })
        } catch (err) {
            // @ts-ignore
            res.status(400).send(`<pre> ${err.message} </pre>`)
        }
    } else res.status(404).send({ error: "User not found" })

})

app.listen(PORT, () => {
    console.log(`Server runing on: http://localhost:${PORT}/`)
})
