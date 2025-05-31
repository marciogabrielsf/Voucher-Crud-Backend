// imports
import express, { Express } from "express";
import useRouter from "./routes/users.routes";
import voucherRoutes from "./routes/vouchers.routes";
import expenseRoutes from "./routes/expenses.routes";
import cors from "cors";
// import morgan from "morgan";

const PORT = process.env.PORT || 3000;

const app: Express = express();
app.use(cors());
// app.use(morgan("combined"));
app.use(express.json());
app.use(useRouter);
app.use(voucherRoutes);
app.use(expenseRoutes);

app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});
