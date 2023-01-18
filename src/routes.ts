import { FastifyInstance } from "fastify";
import { prismaClient } from "./lib/prisma";

export function AppRoutes(app: FastifyInstance) {
  app.get("/habits", async () => {
    const habits = await prismaClient.habit.findMany();

    return habits;
  });
}