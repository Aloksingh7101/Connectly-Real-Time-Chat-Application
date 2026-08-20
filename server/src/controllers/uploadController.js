const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { uploadBuffer } = require('../services/cloudinaryService');

// POST /api/uploads — accepts a single file (field name "file"), uploads
// it to Cloudinary, returns the info the frontend needs to attach it to
// a message, avatar, or group image. Kept generic and reusable rather
// than writing separate upload logic per feature.
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file provided');
  }

  const result = await uploadBuffer(req.file.buffer, {
    folder: `connectly/${req.user._id}`,
    mimetype: req.file.mimetype,
  });

  res.status(201).json({
    success: true,
    data: {
      url: result.secure_url,
      publicId: result.public_id,
      type: req.file.mimetype.startsWith('image/') ? 'image' : 'file',
      name: req.file.originalname,
      size: req.file.size,
    },
  });
});

module.exports = { uploadFile };
