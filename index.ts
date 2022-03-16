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

async function getUserFromToken(token: string) {
    const decodedToken = jwt.verify(token, process.env.MY_SECRET)
    const user = await prisma.user.findUnique({
        where: { id: decodedToken.id },
        include: { transactions: true }
    })
    return user
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
    const user = await prisma.user.findUnique({ where: { email: email } })

    if (user) {
        try {
            const hash = bcrypt.hashSync(password, 8)
            const updateUser = await prisma.user.update({ where: { email }, data: { password: hash } })
            res.send({ updateUser, token: createToken(updateUser.id) })
        } catch (err) {
            // @ts-ignore
            res.status(400).send(`<pre> ${err.message} </pre>`)
        }
    } else res.status(404).send({ error: "User not found" })

})

app.post('/sign-in', async (req, res) => {
    const { email, password } = req.body

    try {
        const user = await prisma.user.findUnique({
            where: { email: email },
            include: { transactions: true }
        })
        // @ts-ignore
        const passwordMatches = bcrypt.compareSync(password, user.password)

        if (user && passwordMatches) {
            const { id, email, fullName, amountInAccount, transactions } = user
            res.send({ data: { id, email, fullName, amountInAccount, transactions }, token: createToken(user.id) })
        } else {
            throw Error()
        }
    } catch (err) {
        res.status(400).send({ error: 'User/password invalid.' })
    }
})

app.post('/validate', async (req, res) => {
    const { token } = req.body
    try {
        const user = await getUserFromToken(token)
        res.send(user)
    } catch (err) {
        res.status(400).send(err.message)
    }
})

app.get('/banking-info', async (req, res) => {
    const token = req.headers.authorization
    console.log(token)
    try {
        const user = await getUserFromToken(token)
        const { id, email, fullName, amountInAccount, transactions } = user
        res.send({ data: { id, email, fullName, amountInAccount, transactions } })
    } catch (err) {
        res.status(400).send(err.message)
    }
})

app.listen(PORT, () => {
    console.log(`Server runing on: http://localhost:${PORT}/`)
})
