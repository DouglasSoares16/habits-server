import { FastifyInstance } from "fastify";
import { prismaClient } from "./lib/prisma";
import z from "zod";
import dayjs from "dayjs";

export async function AppRoutes(app: FastifyInstance) {
  app.post("/habits", async (request) => {
    const createHabitBody = z.object({
      title: z.string(),
      weekDays: z.array(
        z.number().min(0).max(6)
      ),
    })

    const { title, weekDays } = createHabitBody.parse(request.body);

    const today = dayjs().startOf("day").toDate();

    await prismaClient.habit.create({
      data: {
        title,
        created_at: today,
        weekDays: {
          create: weekDays.map((weekDay) => {
            return {
              week_day: weekDay,
            }
          })
        }
      }
    })
  });

  app.get("/day", async (request) => {
    const getDayParams = z.object({
      /* coerce vai pegar o valor que está vindo como 'string' 
        e tranformar para o tipo date */
      date: z.coerce.date(),
    });

    const { date } = getDayParams.parse(request.query);

    const parsedDate = dayjs(date).startOf("day");
    const weekDay = parsedDate.get("day");

    const possibleHabits = await prismaClient.habit.findMany({
      where: {
        created_at: {
          lte: date,
        },
        weekDays: {
          some: {
            week_day: weekDay,
          }
        }
      }
    });

    const day = await prismaClient.day.findUnique({
      where: {
        date: parsedDate.toDate(),
      },
      include: {
        dayHabits: true,
      }
    });

    const completedHabits = day?.dayHabits.map(dayHabit => {
      return dayHabit.habit_id
    }) ?? [];

    return {
      possibleHabits,
      completedHabits
    }
  });

  app.patch("/habits/:id/toggle", async (request) => {
    const toggleHabitParams = z.object({
      id: z.string().uuid(),
    });

    const { id } = toggleHabitParams.parse(request.params);

    const today = dayjs().startOf("day").toDate();

    let day = await prismaClient.day.findUnique({
      where: {
        date: today,
      }
    });

    if (!day) {
      day = await prismaClient.day.create({
        data: {
          date: today
        }
      });
    }

    const dayHabit = await prismaClient.dayHabit.findUnique({
      where: {
        day_id_habit_id: {
          day_id: day.id,
          habit_id: id,
        }
      }
    });

    if (dayHabit) {
      // Desmarcar hábito
      await prismaClient.dayHabit.delete({
        where: {
          id: dayHabit.id
        }
      });
    } else {
      // Completar o hábito
      await prismaClient.dayHabit.create({
        data: {
          day_id: day.id,
          habit_id: id,
        }
      });
    }
  });

  app.get("/summary", async (request) => {
    const summary = await prismaClient.$queryRaw`
      SELECT 
        days.id, 
        days.date,
        (
          SELECT
            cast(count(*) as float)
          FROM day_habits
          WHERE day_habits.day_id = days.id
        ) as completed,
        (
          SELECT
            cast(count(*) as float)
          FROM habit_week_days
          JOIN habits
            ON habits.id = habit_week_days.habit_id
          WHERE 
            habit_week_days.week_day = cast(strftime('%w', days.date/1000.0, 'unixepoch') as int)
            AND habits.created_at <= days.date
        ) as amount
      FROM days;
    `;

    return summary;
  });
}