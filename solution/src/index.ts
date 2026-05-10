import express from "express";
import path from "path";
import paymentsRouter from "./routes/payments";
import merchantsRouter from "./routes/merchants";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api/payments", paymentsRouter);
app.use("/api/merchants", merchantsRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

export default app;
