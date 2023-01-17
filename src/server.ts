import fastify from "fastify";
import cors from "@fastify/cors";

import { PrismaClient } from "@prisma/client";

const app = fastify();
const prismaClient = new PrismaClient();

app.register(cors);

app.get("/habits", async () => {
    const habits = await prismaClient.habit.findMany();

    return habits;
});

app.listen({
    port: 5500,
}).then(() => console.log("Server is running"));