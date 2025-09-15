// src/middlewares/multer.middleware.js

import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // This is a temporary storage location.
        // In a production app, you'd upload this file to a cloud service (like Cloudinary or S3)
        // and then remove it from local storage.
        cb(null, "./src/public/temp");
    },
    filename: function (req, file, cb) {
        // We use the original filename. In production, you might want to add a unique suffix.
        cb(null, file.originalname);
    }
});

export const upload = multer({
    storage,
});