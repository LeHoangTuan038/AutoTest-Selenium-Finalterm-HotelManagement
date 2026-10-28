const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const path = require('path');

cloudinary.config({
  cloud_name: 'dqx8hqmcv',
  api_key: '631649268987357',
  api_secret: 'vpIzAy1SxMIKHJQkJa8wMCmK-xI'
});

const sqlPath = path.join('c:', 'QuanTriKhachSan', 'HotelManagement.sql');
// Read as UTF-16LE
const sqlContent = fs.readFileSync(sqlPath, 'utf16le');

const urlRegex = /https:\/\/res\.cloudinary\.com\/dzfuzh2xg\/image\/upload\/[^\s'")]+/g;
const urls = [...new Set(sqlContent.match(urlRegex))];

console.log(`Found ${urls.length} unique URLs to migrate.`);

async function migrate() {
  const mapping = {};
  for (const oldUrl of urls) {
    console.log(`Migrating ${oldUrl}...`);
    try {
      const parts = oldUrl.split('/upload/');
      const pathWithVersion = parts[1];
      const pathParts = pathWithVersion.split('/');
      if (pathParts[0].startsWith('v')) {
        pathParts.shift();
      }
      const lastPart = pathParts[pathParts.length - 1];
      const idWithoutExt = lastPart.includes('.') ? lastPart.substring(0, lastPart.lastIndexOf('.')) : lastPart;
      pathParts[pathParts.length - 1] = idWithoutExt;
      const publicId = pathParts.join('/');

      const result = await cloudinary.uploader.upload(oldUrl, {
        public_id: publicId,
        overwrite: true
      });

      mapping[oldUrl] = result.secure_url;
      console.log(`Migrated to: ${result.secure_url}`);
    } catch (error) {
      console.error(`Failed to migrate ${oldUrl}:`, error.message);
    }
  }

  fs.writeFileSync('migration_mapping.json', JSON.stringify(mapping, null, 2));
  
  let newSqlContent = sqlContent;
  for (const [oldUrl, newUrl] of Object.entries(mapping)) {
    newSqlContent = newSqlContent.split(oldUrl).join(newUrl);
  }
  // Write back as UTF-16LE to maintain original format
  fs.writeFileSync('HotelManagement_New.sql', newSqlContent, 'utf16le');
  console.log('Done!');
}

migrate();
