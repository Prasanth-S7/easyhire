import "dotenv/config"
import express from "express"
import cookieParser from "cookie-parser"
import { toNodeHandler } from "better-auth/node"
import { auth } from "./lib/auth"
import cors from "cors"
import { post } from "./routes/posts"
import path from "path"
import { jobs } from "./routes/jobs"
import { organization } from "./routes/organization"
import search from "./routes/search"
import { initQdrantCollection } from "./lib/qdrant"

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.all('/api/auth/*', toNodeHandler(auth))
app.use(express.json());

app.use("/api/posts", post);
app.use("/api/jobs", jobs);
app.use("/api/organizations", organization);
app.use("/api/search", search);

// Initialize Qdrant collection on startup
initQdrantCollection().catch((err) => {
  console.error("Failed to initialize Qdrant collection:", err);
});

app.listen(process.env.PORT, ()=> {
    console.log(`Server listening on PORT: ${process.env.PORT} ✅`)
})