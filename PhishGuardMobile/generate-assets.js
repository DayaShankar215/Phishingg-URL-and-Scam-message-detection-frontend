const sharp = require('sharp');
const fs = require('fs');

// Ensure assets folder exists
if (!fs.existsSync('./assets')) {
  fs.mkdirSync('./assets');
}

// Colors
const PRIMARY_COLOR = '#2196F3'; // Blue
const WHITE = '#FFFFFF';

// Generate icon (512x512)
sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: { r: 33, g: 150, b: 243, alpha: 1 }
  }
})
.png()
.toFile('./assets/icon.png')
.then(() => console.log('✅ icon.png created (512x512)'))
.catch(err => console.error('❌ Error creating icon:', err));

// Generate adaptive icon (512x512)
sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: { r: 33, g: 150, b: 243, alpha: 1 }
  }
})
.png()
.toFile('./assets/adaptive-icon.png')
.then(() => console.log('✅ adaptive-icon.png created (512x512)'))
.catch(err => console.error('❌ Error creating adaptive-icon:', err));

// Generate splash screen (1242x2436)
sharp({
  create: {
    width: 1242,
    height: 2436,
    channels: 4,
    background: { r: 255, g: 255, b: 255, alpha: 1 }
  }
})
.png()
.toFile('./assets/splash.png')
.then(() => console.log('✅ splash.png created (1242x2436)'))
.catch(err => console.error('❌ Error creating splash:', err));

// Generate favicon (48x48)
sharp({
  create: {
    width: 48,
    height: 48,
    channels: 4,
    background: { r: 33, g: 150, b: 243, alpha: 1 }
  }
})
.png()
.toFile('./assets/favicon.png')
.then(() => console.log('✅ favicon.png created (48x48)'))
.catch(err => console.error('❌ Error creating favicon:', err));