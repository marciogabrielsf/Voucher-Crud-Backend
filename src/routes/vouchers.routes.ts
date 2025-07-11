/* eslint-disable @typescript-eslint/no-unused-vars */
import { Router, Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { verifyJWT } from "../middlewares/verifyjwt";

const prisma = new PrismaClient();
const voucherRoutes = Router();

voucherRoutes.post(
    "/voucher/create",
    verifyJWT,
    async (req: Request, res: Response): Promise<void> => {
        const { value, voucherNumber, orderNumber, company, voucherDate, id } = req.body;
        if (!value || !voucherDate || !voucherNumber || !orderNumber || !company) {
            res.status(422).json({ message: "Missing parameters" });
            return;
        }

        await prisma.voucher
            .create({
                data: {
                    userId: id,
                    value,
                    voucherDate,
                    voucherNumber,
                    company,
                    orderNumber,
                },
                include: {
                    user: true,
                },
            })
            .then(() => {
                res.status(201).json({
                    code: "voucher.created-success",
                    message: "Voucher Criado com sucesso!",
                });
            })
            .catch((err) => {
                res.status(500).json({
                    message: "Erro ao Criar o Voucher, tente novamente mais tarde",
                    error: err.message,
                });
            });
    }
);

voucherRoutes.get(
    "/voucher/getlist",
    verifyJWT,
    async (req: Request, res: Response): Promise<void> => {
        const id = req.body.id;

        const vouchers = await prisma.voucher.findMany({
            where: {
                userId: id,
            },
        });

        res.status(200).json({ vouchers });
    }
);

voucherRoutes.put(
    "/voucher/update/:id",
    verifyJWT,
    async (req: Request, res: Response): Promise<void> => {
        const id = req.body.id;
        const voucherID = req.params.id;
        const { value, company, orderNumber, voucherDate, voucherNumber } = req.body;

        if (!value || !company || !orderNumber || !voucherDate || !voucherNumber) {
            res.status(422).json({ message: "Missing parameters" });
            return;
        }

        const checkForHexRegExp = /^[0-9a-fA-F]{24}$/;
        if (!checkForHexRegExp.test(voucherID)) {
            res.status(422).json({ message: "Invalid ID" });
            return;
        }

        const getVoucher = await prisma.voucher.findUnique({
            where: {
                id: voucherID,
            },
        });

        if (!getVoucher) {
            res.status(404).json({ message: "Voucher não encontrado" });
            return;
        }

        if (getVoucher.userId !== id) {
            res.status(422).json({ message: "Invalid Token to update this voucher." });
            return;
        }

        await prisma.voucher
            .update({
                where: {
                    id: getVoucher.id,
                },
                data: {
                    company,
                    value,
                    orderNumber,
                    voucherDate,
                    voucherNumber,
                },
            })
            .then(() => {
                res.status(200).json({ message: "Voucher foi atualizado com sucesso!" });
            })
            .catch((err) => {
                res.status(500).json({
                    message: "Erro ao Atualizar o Voucher, tente novamente mais tarde",
                    error: err.message,
                });
            });
    }
);

voucherRoutes.delete(
    "/voucher/delete/:id",
    verifyJWT,
    async (req: Request, res: Response): Promise<void> => {
        const id = req.body.id;
        const voucherID = req.params.id;

        const checkForHexRegExp = /^[0-9a-fA-F]{24}$/;
        if (!checkForHexRegExp.test(voucherID)) {
            res.status(422).json({ message: "Invalid ID" });
            return;
        }

        const getVoucher = await prisma.voucher.findUnique({
            where: {
                id: voucherID,
            },
        });

        if (!getVoucher) {
            res.status(404).json({ message: "Voucher não encontrado" });
            return;
        }

        if (getVoucher.userId !== id) {
            res.status(422).json({ message: "Invalid Token to update this voucher." });
            return;
        }

        await prisma.voucher
            .delete({
                where: {
                    id: getVoucher.id,
                },
            })
            .then(() => {
                res.status(200).json({ message: "O Voucher foi Deletado com sucesso!" });
            })
            .catch(() => {
                res.status(500).json({ message: "Erro ao deletar o Voucher" });
            });
    }
);

// Version 2 routes
voucherRoutes.post(
    "/v2/voucher/create",
    verifyJWT,
    async (req: Request, res: Response): Promise<void> => {
        const { taxNumber, requestCode, date, value, start, destination, id } = req.body;

        if (!taxNumber || !requestCode || !date || !value || !start || !destination) {
            res.status(422).json({ message: "Missing parameters" });
            return;
        }

        // Extract requestCategory from the first three letters of requestCode
        const requestCategory = requestCode.substring(0, 3);

        // Parse date string to Date object
        const parsedDate = new Date(date);

        // Parse value string to float (assuming value comes as "252,98" format)
        const parsedValue = typeof value === "string" ? parseFloat(value.replace(",", ".")) : value;

        await prisma.voucherV2
            .create({
                data: {
                    userId: id,
                    taxNumber,
                    requestCode,
                    requestCategory,
                    date: parsedDate,
                    value: parsedValue,
                    start,
                    destination,
                },
                include: {
                    user: true,
                },
            })
            .then(() => {
                res.status(201).json({
                    code: "voucher.created-success",
                    message: "Voucher Criado com sucesso!",
                });
            })
            .catch((err) => {
                res.status(500).json({
                    message: "Erro ao Criar o Voucher, tente novamente mais tarde",
                    error: err.message,
                });
            });
    }
);

voucherRoutes.get(
    "/v2/voucher/getlist",
    verifyJWT,
    async (req: Request, res: Response): Promise<void> => {
        const id = req.body.id;

        const vouchers = await prisma.voucherV2.findMany({
            where: {
                userId: id,
            },
        });

        res.status(200).json({ vouchers });
    }
);

voucherRoutes.put(
    "/v2/voucher/update/:id",
    verifyJWT,
    async (req: Request, res: Response): Promise<void> => {
        const id = req.body.id;
        const voucherID = req.params.id;
        const { taxNumber, requestCode, date, value, start, destination } = req.body;

        if (!taxNumber || !requestCode || !date || !value || !start || !destination) {
            res.status(422).json({ message: "Missing parameters" });
            return;
        }

        const checkForHexRegExp = /^[0-9a-fA-F]{24}$/;
        if (!checkForHexRegExp.test(voucherID)) {
            res.status(422).json({ message: "Invalid ID" });
            return;
        }

        const getVoucher = await prisma.voucherV2.findUnique({
            where: {
                id: voucherID,
            },
        });

        if (!getVoucher) {
            res.status(404).json({ message: "Voucher não encontrado" });
            return;
        }

        if (getVoucher.userId !== id) {
            res.status(422).json({ message: "Invalid Token to update this voucher." });
            return;
        }

        // Extract requestCategory from the first three letters of requestCode
        const requestCategory = requestCode.substring(0, 3);

        // Parse date string to Date object if it's a string
        const parsedDate = typeof date === "string" ? new Date(date) : date;

        // Parse value if it's a string
        const parsedValue = typeof value === "string" ? parseFloat(value.replace(",", ".")) : value;

        await prisma.voucherV2
            .update({
                where: {
                    id: getVoucher.id,
                },
                data: {
                    taxNumber,
                    requestCode,
                    requestCategory,
                    date: parsedDate,
                    value: parsedValue,
                    start,
                    destination,
                },
            })
            .then(() => {
                res.status(200).json({ message: "Voucher foi atualizado com sucesso!" });
            })
            .catch((err) => {
                res.status(500).json({
                    message: "Erro ao Atualizar o Voucher, tente novamente mais tarde",
                    error: err.message,
                });
            });
    }
);

voucherRoutes.delete(
    "/v2/voucher/delete/:id",
    verifyJWT,
    async (req: Request, res: Response): Promise<void> => {
        const id = req.body.id;
        const voucherID = req.params.id;

        const checkForHexRegExp = /^[0-9a-fA-F]{24}$/;
        if (!checkForHexRegExp.test(voucherID)) {
            res.status(422).json({ message: "Invalid ID" });
            return;
        }

        const getVoucher = await prisma.voucherV2.findUnique({
            where: {
                id: voucherID,
            },
        });

        if (!getVoucher) {
            res.status(404).json({ message: "Voucher não encontrado" });
            return;
        }

        if (getVoucher.userId !== id) {
            res.status(422).json({ message: "Invalid Token to update this voucher." });
            return;
        }

        await prisma.voucherV2
            .delete({
                where: {
                    id: getVoucher.id,
                },
            })
            .then(() => {
                res.status(200).json({ message: "O Voucher foi Deletado com sucesso!" });
            })
            .catch(() => {
                res.status(500).json({ message: "Erro ao deletar o Voucher" });
            });
    }
);

// Webhook for WhatsApp bot integration
voucherRoutes.post(
    "/v2/webhook/voucher/create",
    async (req: Request, res: Response): Promise<void> => {
        const { taxNumber, requestCode, date, value, start, destination, userId, apiKey } =
            req.body;

        // Verify API key for webhook security
        if (!apiKey || apiKey !== process.env.WEBHOOK_API_KEY) {
            res.status(401).json({ message: "Unauthorized: Invalid API key" });
            return;
        }

        if (!userId || !taxNumber || !requestCode || !date || !value || !start || !destination) {
            res.status(422).json({ message: "Missing parameters" });
            return;
        }

        // Extract requestCategory from the first three letters of requestCode
        const requestCategory = requestCode.substring(0, 3);

        // Parse date string to Date object
        // Split the date string by '/' and rearrange to YYYY-MM-DD format for proper Date parsing
        const [day, month, year] = date.split("/");
        const parsedDate = new Date(year, month - 1, day, 0, 0, 0, 0);

        // Parse value string to float (assuming value comes as "252,98" format)
        const parsedValue = typeof value === "string" ? parseFloat(value.replace(",", ".")) : value;

        await prisma.voucherV2
            .create({
                data: {
                    userId,
                    taxNumber,
                    requestCode,
                    requestCategory,
                    date: parsedDate,
                    value: parsedValue,
                    start,
                    destination,
                },
            })
            .then(() => {
                res.status(201).json({
                    code: "voucher.created-success",
                    message: "Voucher Criado com sucesso via webhook!",
                });
            })
            .catch((err) => {
                res.status(500).json({
                    message: "Erro ao Criar o Voucher, tente novamente mais tarde",
                    error: err.message,
                });
            });
    }
);

// Statistics route for earnings over time
voucherRoutes.get(
    "/v2/voucher/statistics/earnings",
    verifyJWT,
    async (req: Request, res: Response): Promise<void> => {
        const userId = req.body.id;
        const { from, to } = req.query;

        // Default to yearly period if no dates provided
        const currentDate = new Date();
        const defaultFromDate = new Date(currentDate.getFullYear(), 0, 1); // Start of current year
        const defaultToDate = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59); // End of current year

        let fromDate: Date;
        let toDate: Date;

        try {
            fromDate = from ? new Date(from as string) : defaultFromDate;
            toDate = to ? new Date(to as string) : defaultToDate;

            // Validate dates
            if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
                res.status(422).json({
                    message: "Invalid date format. Use YYYY-MM-DD format.",
                });
                return;
            }

            if (fromDate >= toDate) {
                res.status(422).json({
                    message: "From date must be earlier than to date.",
                });
                return;
            }
        } catch (error) {
            res.status(422).json({
                message: "Invalid date format. Use YYYY-MM-DD format.",
            });
            return;
        }

        try {
            // Get all vouchers in the date range for the user
            const vouchers = await prisma.voucherV2.findMany({
                where: {
                    userId: userId,
                    date: {
                        gte: fromDate,
                        lte: toDate,
                    },
                },
                select: {
                    date: true,
                    value: true,
                },
                orderBy: {
                    date: "asc",
                },
            });

            if (vouchers.length === 0) {
                res.status(200).json({
                    data: [],
                    summary: {
                        totalEarnings: 0,
                        voucherCount: 0,
                        period: {
                            from: fromDate.toISOString().split("T")[0],
                            to: toDate.toISOString().split("T")[0],
                        },
                    },
                });
                return;
            }

            // Calculate the time period in days
            const timeDiff = toDate.getTime() - fromDate.getTime();
            const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

            // Determine the grouping interval to limit to 150 data points
            let intervalDays = 1;
            if (totalDays > 150) {
                intervalDays = Math.ceil(totalDays / 150);
            }

            // Group vouchers by intervals
            const groupedData: { [key: string]: { date: string; value: number; count: number } } =
                {};

            vouchers.forEach((voucher) => {
                const voucherDate = new Date(voucher.date);
                const daysSinceStart = Math.floor(
                    (voucherDate.getTime() - fromDate.getTime()) / (1000 * 3600 * 24)
                );
                const intervalIndex = Math.floor(daysSinceStart / intervalDays);

                // Calculate the representative date for this interval
                const intervalStartDate = new Date(
                    fromDate.getTime() + intervalIndex * intervalDays * 24 * 60 * 60 * 1000
                );
                const dateKey = intervalStartDate.toISOString().split("T")[0];

                if (!groupedData[dateKey]) {
                    groupedData[dateKey] = {
                        date: dateKey,
                        value: 0,
                        count: 0,
                    };
                }

                groupedData[dateKey].value += voucher.value;
                groupedData[dateKey].count += 1;
            });

            // Convert to array and sort by date
            const chartData = Object.values(groupedData).sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );

            // Calculate summary statistics
            const totalEarnings = vouchers.reduce((sum, voucher) => sum + voucher.value, 0);
            const voucherCount = vouchers.length;

            res.status(200).json({
                data: chartData,
                summary: {
                    totalEarnings: Math.round(totalEarnings * 100) / 100, // Round to 2 decimal places
                    voucherCount,
                    period: {
                        from: fromDate.toISOString().split("T")[0],
                        to: toDate.toISOString().split("T")[0],
                    },
                    intervalDays,
                },
            });
        } catch (error) {
            res.status(500).json({
                message: "Erro ao buscar estatísticas de vouchers",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
);

export default voucherRoutes;
