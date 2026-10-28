const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

cloudinary.config({
  cloud_name: 'dqx8hqmcv',
  api_key: '631649268987357',
  api_secret: 'vpIzAy1SxMIKHJQkJa8wMCmK-xI'
});

const assets = [
  { path: path.join('c:', 'QuanTriKhachSan', 'QuanTriKhachSanN5_Frontend', 'public', 'video_showcase.mp4'), type: 'video', public_id: 'QuanTriKhachSan/video_showcase' },
  { path: path.join('c:', 'QuanTriKhachSan', 'QuanTriKhachSanN5_Frontend', 'src', 'assets', 'hero.png'), type: 'image', public_id: 'QuanTriKhachSan/hero' },
  { path: path.join('c:', 'QuanTriKhachSan', 'QuanTriKhachSanN5_Frontend', 'public', 'favicon.svg'), type: 'image', public_id: 'QuanTriKhachSan/favicon' },
  { path: path.join('c:', 'QuanTriKhachSan', 'QuanTriKhachSanN5_Frontend', 'public', 'icons.svg'), type: 'image', public_id: 'QuanTriKhachSan/icons' }
];

async function uploadAssets() {
  for (const asset of assets) {
    if (fs.existsSync(asset.path)) {
      console.log(`Uploading ${asset.path}...`);
      try {
        const result = await cloudinary.uploader.upload(asset.path, {
          resource_type: asset.type,
          public_id: asset.public_id,
          overwrite: true
        });
        console.log(`Successfully uploaded ${asset.public_id}: ${result.secure_url}`);
      } catch (error) {
        console.error(`Failed to upload ${asset.public_id}:`, error);
      }
    } else {
      console.warn(`File not found: ${asset.path}`);
    }
  }
}

uploadAssets();
