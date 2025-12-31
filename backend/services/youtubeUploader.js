const { google } = require("googleapis");
const oauth2Client = require("../tools/googleClient");
const fs = require("fs");

// Upload a local video file to YouTube using the configured oauth2 client.
// Returns the YouTube response object on success.
async function uploadToYoutube(video) {
  try {
    // ensure file exists
    if (!fs.existsSync(video.fileUrl)) {
      throw new Error(`Video file not found at path: ${video.fileUrl}`);
    }

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    const res = await youtube.videos.insert({
      part: "snippet,status",
      requestBody: {
        snippet: { title: video.title, description: video.description },
        status: { privacyStatus: "private" },
      },
      media: { body: fs.createReadStream(video.fileUrl) },
    });

    return res.data;
  } catch (err) {
    // bubble up with contextual message
    throw new Error(`YouTube upload failed: ${err.message}`);
  }
}

module.exports = uploadToYoutube;
