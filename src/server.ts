import { PrismaClient } from "@prisma/client";
import fastify from "fastify";

const app = fastify();
const prismaClient = new PrismaClient();

app.get("/habits", async () => {
    const habits = await prismaClient.habit.findMany();

    return habits;
});

app.listen({
    port: 5500,
}).then(() => console.log("Server is running"));