const router = require("express").Router();

const { google } = require("googleapis");
const oauth2Client = require("../tools/googleClient");
const youtube = google.youtube({ version: "v3", auth: oauth2Client });

const multer = require("multer");
const videoModel = require("../models/video");
const adminAuth = require("../middlewares/adminMiddleware");
const userAuth = require("../middlewares/userMiddleware");
const uploadToYoutube = require("../services/youtubeUploader");

const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("video"), async (req, res) => {
  console.log("BODY ===>", req.body);
  console.log("FILE ===>", req.file);
  try {
    const video = await videoModel.create({
      fileUrl: req.file.path,
      title: req.body.title,
      description: req.body.description,
      editorId: req.body.editorId,
      creatorId: req.body.creatorId,
    });
    res.json({ message: "uploaded", video });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "upload failed", error: err.message });
  }
});

router.get("/pending", async (req, res) => {
  const videos = await videoModel.find({
    status: "pending",
  });
  res.json(videos);
});

router.post("/:id/approve", userAuth, async (req, res) => {
  try {
    const video = await videoModel.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: " video Not Found" });
    }
    // mark approved, attempt upload, update status depending on outcome
    video.status = "approved";
    await video.save();

    try {
      const yt = await uploadToYoutube(video);
      video.status = "uploaded";
      video.youtubeId = yt.id;
      await video.save();
      return res.json({
        message: "Video approved and uploaded",
        youtubeId: yt.id,
      });
    } catch (uploadErr) {
      // if upload failed, keep the video in `approved` state and return error
      console.error("Upload error:", uploadErr);
      return res
        .status(500)
        .json({
          message: "Video approved but upload failed",
          error: uploadErr.message,
        });
    }
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Approve action failed", error: err.message });
  }
});

router.post("/:id/reject", userAuth, async (req, res) => {
  const video = await videoModel.findById(req.params.id);
  if (!video) {
    return res.status(404).json({ message: "not found" });
  }
  video.status = "rejected";
  await video.save();

  res.json({ message: "Video Rejected" });
});

module.exports = router;
