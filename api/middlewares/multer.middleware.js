// api/middlewares/multer.middleware.js

import multer from "multer";
import fs from "fs";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "./api/public/temp"; // ✅ matches your project structure
    fs.mkdirSync(dir, { recursive: true }); // ensure folder exists
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage });
