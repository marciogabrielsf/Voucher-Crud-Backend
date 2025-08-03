import { Router, Request, Response } from "express";
import { PrismaClient, ExpenseCategory, Prisma } from "@prisma/client";
import { verifyJWT } from "../middlewares/verifyjwt";

const prisma = new PrismaClient();
const expenseRoutes = Router();

// Create a new expense
expenseRoutes.post(
    "/expense/create",
    verifyJWT,
    async (req: Request, res: Response): Promise<void> => {
        const { value, category, date, description, paymentMethod, id } = req.body;

        if (!value || !category || !date) {
            res.status(422).json({ message: "Missing required parameters: value, category, date" });
            return;
        }

        // Validate category is a valid enum value
        const validCategories = Object.values(ExpenseCategory);
        if (!validCategories.includes(category as ExpenseCategory)) {
            res.status(422).json({
                message: "Invalid category. Valid values are: " + validCategories.join(", "),
            });
            return;
        }

        // Parse date string to Date object if it's a string
        const parsedDate = typeof date === "string" ? new Date(date) : date;

        // Parse value if it's a string
        const parsedValue = typeof value === "string" ? parseFloat(value.replace(",", ".")) : value;

        await prisma.expense
            .create({
                data: {
                    userId: id,
                    value: parsedValue,
                    category: category as ExpenseCategory,
                    date: parsedDate,
                    description,
                    paymentMethod,
                },
            })
            .then(() => {
                res.status(201).json({
                    code: "expense.created-success",
                    message: "Despesa registrada com sucesso!",
                });
            })
            .catch((err) => {
                res.status(500).json({
                    message: "Erro ao registrar a despesa, tente novamente mais tarde",
                    error: err.message,
                });
            });
    }
);

// Get all expenses for a user
expenseRoutes.get(
    "/expense/getlist",
    verifyJWT,
    async (req: Request, res: Response): Promise<void> => {
        const id = req.body.id;
        // Optional query parameters
        const { category, startDate, endDate } = req.query;

        // Build the where clause
        const whereClause: Prisma.ExpenseWhereInput = { userId: id };

        // Filter by category if provided
        if (category && Object.values(ExpenseCategory).includes(category as ExpenseCategory)) {
            whereClause.category = category as ExpenseCategory;
        }

        // Filter by date range if provided
        if (startDate || endDate) {
            whereClause.date = {};

            if (startDate) {
                whereClause.date = {
                    ...(whereClause.date as object),
                    gte: new Date(startDate as string),
                };
            }

            if (endDate) {
                whereClause.date = {
                    ...(whereClause.date as object),
                    lte: new Date(endDate as string),
                };
            }
        }

        const expenses = await prisma.expense.findMany({
            where: whereClause,
            orderBy: {
                date: "desc",
            },
        });

        if (expenses.length === 0) {
            res.status(404).json({ message: "Nenhuma despesa foi encontrada" });
        } else {
            res.status(200).json({ expenses });
        }
    }
);

// Get expense by ID
expenseRoutes.get("/expense/:id", verifyJWT, async (req: Request, res: Response): Promise<void> => {
    const userId = req.body.id;
    const expenseId = req.params.id;

    const checkForHexRegExp = /^[0-9a-fA-F]{24}$/;
    if (!checkForHexRegExp.test(expenseId)) {
        res.status(422).json({ message: "Invalid ID" });
        return;
    }

    const expense = await prisma.expense.findUnique({
        where: {
            id: expenseId,
        },
    });

    if (!expense) {
        res.status(404).json({ message: "Despesa não encontrada" });
        return;
    }

    if (expense.userId !== userId) {
        res.status(403).json({ message: "Você não tem permissão para ver esta despesa" });
        return;
    }

    res.status(200).json({ expense });
});

// Update an expense
expenseRoutes.put(
    "/expense/update/:id",
    verifyJWT,
    async (req: Request, res: Response): Promise<void> => {
        const userId = req.body.id;
        const expenseId = req.params.id;
        const { value, category, date, description, paymentMethod } = req.body;

        if (
            !value &&
            !category &&
            !date &&
            description === undefined &&
            paymentMethod === undefined
        ) {
            res.status(422).json({ message: "No update parameters provided" });
            return;
        }

        // Validate category if provided
        if (category) {
            const validCategories = Object.values(ExpenseCategory);
            if (!validCategories.includes(category as ExpenseCategory)) {
                res.status(422).json({
                    message: "Invalid category. Valid values are: " + validCategories.join(", "),
                });
                return;
            }
        }

        const checkForHexRegExp = /^[0-9a-fA-F]{24}$/;
        if (!checkForHexRegExp.test(expenseId)) {
            res.status(422).json({ message: "Invalid ID" });
            return;
        }

        const getExpense = await prisma.expense.findUnique({
            where: {
                id: expenseId,
            },
        });

        if (!getExpense) {
            res.status(404).json({ message: "Despesa não encontrada" });
            return;
        }

        if (getExpense.userId !== userId) {
            res.status(403).json({ message: "Você não tem permissão para editar esta despesa" });
            return;
        }

        // Process data if provided
        const updateData: Prisma.ExpenseUpdateInput = {};

        if (value !== undefined) {
            updateData.value =
                typeof value === "string" ? parseFloat(value.replace(",", ".")) : value;
        }

        if (category) {
            updateData.category = category as ExpenseCategory;
        }

        if (date) {
            updateData.date = typeof date === "string" ? new Date(date) : date;
        }

        if (description !== undefined) {
            updateData.description = description;
        }

        if (paymentMethod !== undefined) {
            updateData.paymentMethod = paymentMethod;
        }

        await prisma.expense
            .update({
                where: {
                    id: expenseId,
                },
                data: updateData,
            })
            .then(() => {
                res.status(200).json({ message: "Despesa atualizada com sucesso!" });
            })
            .catch((err) => {
                res.status(500).json({
                    message: "Erro ao atualizar a despesa, tente novamente mais tarde",
                    error: err.message,
                });
            });
    }
);

// Delete an expense
expenseRoutes.delete(
    "/expense/delete/:id",
    verifyJWT,
    async (req: Request, res: Response): Promise<void> => {
        const userId = req.body.id;
        const expenseId = req.params.id;

        const checkForHexRegExp = /^[0-9a-fA-F]{24}$/;
        if (!checkForHexRegExp.test(expenseId)) {
            res.status(422).json({ message: "Invalid ID" });
            return;
        }

        const getExpense = await prisma.expense.findUnique({
            where: {
                id: expenseId,
            },
        });

        if (!getExpense) {
            res.status(404).json({ message: "Despesa não encontrada" });
            return;
        }

        if (getExpense.userId !== userId) {
            res.status(403).json({ message: "Você não tem permissão para excluir esta despesa" });
            return;
        }

        await prisma.expense
            .delete({
                where: {
                    id: expenseId,
                },
            })
            .then(() => {
                res.status(200).json({ message: "Despesa excluída com sucesso!" });
            })
            .catch(() => {
                res.status(500).json({ message: "Erro ao excluir a despesa" });
            });
    }
);

// Get total expenses summary grouped by category
expenseRoutes.get(
    "/expense/summary/categories",
    verifyJWT,
    async (req: Request, res: Response): Promise<void> => {
        const id = req.body.id;
        const { startDate, endDate } = req.query;

        // Build the where clause
        const whereClause: Prisma.ExpenseWhereInput = { userId: id };

        // Filter by date range if provided
        if (startDate || endDate) {
            whereClause.date = {};

            if (startDate) {
                whereClause.date = {
                    ...(whereClause.date as object),
                    gte: new Date(startDate as string),
                };
            }

            if (endDate) {
                whereClause.date = {
                    ...(whereClause.date as object),
                    lte: new Date(endDate as string),
                };
            }
        }

        // Get all expenses in the date range
        const expenses = await prisma.expense.findMany({
            where: whereClause,
            select: {
                category: true,
                value: true,
            },
        });

        if (expenses.length === 0) {
            res.status(404).json({
                message: "Nenhuma despesa foi encontrada no período especificado",
            });
            return;
        }

        // Calculate total by category
        const summary = expenses.reduce((acc: Record<string, number>, expense) => {
            const category = expense.category;
            if (!acc[category]) {
                acc[category] = 0;
            }
            acc[category] += expense.value;
            return acc;
        }, {});

        // Calculate overall total
        const total = Object.values(summary).reduce((a, b) => a + b, 0);

        res.status(200).json({
            summary,
            total,
        });
    }
);

// Webhook for WhatsApp bot integration
expenseRoutes.post(
    "/webhook/expense/create",
    async (req: Request, res: Response): Promise<void> => {
        const { value, category, date, description, paymentMethod, userId, apiKey } = req.body;

        // Verify API key for webhook security
        if (!apiKey || apiKey !== process.env.WEBHOOK_API_KEY) {
            res.status(401).json({ message: "Unauthorized: Invalid API key" });
            return;
        }

        if (!userId || !value || !category || !date) {
            res.status(422).json({
                message: "Missing required parameters: userId, value, category, date",
            });
            return;
        }

        // Validate category is a valid enum value
        const validCategories = Object.values(ExpenseCategory);
        if (!validCategories.includes(category as ExpenseCategory)) {
            res.status(422).json({
                message: "Invalid category. Valid values are: " + validCategories.join(", "),
            });
            return;
        }

        // Parse date - expecting new Date() format
        const parsedDate = typeof date === "string" ? new Date(date) : date;

        // Parse value if it's a string (handle Brazilian format with comma)
        const parsedValue = typeof value === "string" ? parseFloat(value.replace(",", ".")) : value;

        await prisma.expense
            .create({
                data: {
                    userId,
                    value: parsedValue,
                    category: category as ExpenseCategory,
                    date: parsedDate,
                    description,
                    paymentMethod,
                },
            })
            .then(() => {
                res.status(201).json({
                    code: "expense.created-success",
                    message: "Despesa registrada com sucesso via webhook!",
                });
            })
            .catch((err) => {
                res.status(500).json({
                    message: "Erro ao registrar a despesa, tente novamente mais tarde",
                    error: err.message,
                });
            });
    }
);

export default expenseRoutes;
