const cloudinary = require('../config/cloudinary');

// Wraps Cloudinary's stream-based upload API in a Promise so controllers
// can simply `await` it, and picks 'image' vs 'raw' resource_type based
// on mimetype (raw is required for non-image files like PDFs/zips).
function uploadBuffer(buffer, { folder, mimetype }) {
  return new Promise((resolve, reject) => {
    const resourceType = mimetype.startsWith('image/') ? 'image' : 'raw';
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

function deleteAsset(publicId, resourceType = 'image') {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

module.exports = { uploadBuffer, deleteAsset };
