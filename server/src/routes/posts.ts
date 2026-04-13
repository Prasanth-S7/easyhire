import { Router, Request, Response } from "express";
import { prisma } from "../lib/auth";
import { authMiddleware } from "../lib/authMiddleware";
import multer from "multer";
import path from "path";
import fs from "fs";

export const post = Router();

// Configure multer for image uploads
const uploadsDir = path.join(__dirname, "../../uploads/posts");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

post.get("/", authMiddleware, (req: Request, res: Response) => {
  (async () => {
    try {
      const posts = await prisma.post.findMany({
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      return res.status(500).json({ error: "Failed to fetch posts" });
    }
  })();
});

post.post("/", authMiddleware, upload.single("image"), (req: Request, res: Response) => {
  (async () => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const content = req.body.content;
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      let imagePath: string | undefined = undefined;
      if (req.file) {
        imagePath = `/uploads/posts/${req.file.filename}`;
      }

      const newPost = await prisma.post.create({
        data: {
          content,
          image: imagePath,
          authorId: req.userId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return res.status(201).json(newPost);
    } catch (error) {
      console.error("Error creating post:", error);
      return res.status(500).json({ error: "Failed to create post" });
    }
  })();
});