import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull().default("Загальне"),
  number: text("number").notNull(),
  title: text("title").notNull().default(""),
  body: text("body").notNull().default(""),
  image: text("image"),
  answer: text("answer").notNull().default(""),
  solution: text("solution").notNull().default(""),
  answerImage: text("answer_image"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Task = typeof tasks.$inferSelect;
