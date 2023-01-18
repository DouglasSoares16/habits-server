import fastify from "fastify";
import cors from "@fastify/cors";

import { AppRoutes } from "./routes";

const app = fastify();

app.register(cors);
app.register(AppRoutes);

app.listen({
  port: 5500,
}).then(() => console.log("Server is running"));