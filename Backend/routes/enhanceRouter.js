// routes/enhanceRouter.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const router = express.Router();

// Helper to get latest file from a folder
function getLatestFile(dirPath) {
  const files = fs
    .readdirSync(dirPath)
    .filter((f) => !f.startsWith("."))
    .map((name) => ({
      name,
      time: fs.statSync(path.join(dirPath, name)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);
  return files.length > 0 ? files[0].name : null;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../ESRGAN/LR");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${file.fieldname}${ext}`;
    cb(null, filename);
  },
});
const upload = multer({ storage });

// POST /api/enhance
router.post("/enhance", async (req, res) => {
  const { filename } = req.body;

  if (!filename) {
    return res.status(400).json({ error: "Filename is required" });
  }

  const scriptPath = path.join(__dirname, "../ESRGAN/test.py");
  const esrganDir = path.join(__dirname, "../ESRGAN");

  exec(`python3 ${scriptPath}`, { cwd: esrganDir }, (error) => {
    if (error) {
      console.error("ESRGAN Error:", error.message);
      return res.status(500).json({ error: "Failed to run ESRGAN" });
    }

    const enhancedPath = `/ESRGAN/results/${filename}`;
    return res.status(200).json({
      message: "Enhancement completed",
      resultImage: enhancedPath,
    });
  });
});

// POST /api/upload
router.post("/upload", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const imagePath = `/ESRGAN/LR/${req.file.filename}`;
    return res.status(200).json({
      message: "Image uploaded successfully",
      filename: req.file.filename,
      path: imagePath,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/result → Get latest enhanced image
router.get("/result", (req, res) => {
  const resultDir = path.join(__dirname, "../ESRGAN/results");
  const latestFile = getLatestFile(resultDir);

  if (!latestFile) {
    return res.status(404).json({ message: "No enhanced image found" });
  }

  res.sendFile(path.join(resultDir, latestFile));
});

// GET /api/compare → Return both original and enhanced image paths
router.get("/compare", (req, res) => {
  const lrDir = path.join(__dirname, "../ESRGAN/LR");
  const resultDir = path.join(__dirname, "../ESRGAN/results");

  const original = getLatestFile(lrDir);
  const enhanced = getLatestFile(resultDir);

  if (!original || !enhanced) {
    return res.status(404).json({ message: "Images not found" });
  }

  res.json({
    original: `/static/LR/${original}`,
    enhanced: `/static/results/${enhanced}`,
  });
});

// delete the image from the folders 
router.delete("/delete/:folder/:filename", (req, res) => {
    const { folder, filename } = req.params;
    const validFolders = ["LR", "results"];
    if (!validFolders.includes(folder)) {
        return res.status(400).json({ error: "Invalid folder" });
    }
    const filePath = path.join(__dirname, `../ESRGAN/${folder}/${filename}`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return res.status(200).json({ message: "File deleted" });
    }
    return res.status(404).json({ error: "File not found" });
});

module.exports = router;
