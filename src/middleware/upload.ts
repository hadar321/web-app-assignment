import fs from "fs";
import path from "path";
import multer from "multer";

const ensureDirExists = (dir: string) => {
  const fullPath = path.resolve(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
};

const getUploadDir = (envVar: string, defaultDir: string) => {
  return ensureDirExists(process.env[envVar] || defaultDir);
};

const profileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, getUploadDir(path.join("uploads", process.env.USER_PROFILE_IMAGES_DIR || "userProfileImages"), "uploads/userProfileImages"));
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const postStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, getUploadDir(path.join("uploads", process.env.POST_IMAGES_DIR || "postImages"), "uploads/postImages"));
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

export const uploadProfile = multer({ storage: profileStorage });
export const uploadPost = multer({ storage: postStorage });
