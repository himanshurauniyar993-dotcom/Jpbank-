import axios from 'axios';

async function convertToBase64() {
  const url = 'https://raw.githubusercontent.com/himanshurauniyar/japan-bank-assets/main/japan-bank-logo.png';
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    console.log(`data:image/png;base64,${base64}`);
  } catch (error) {
    console.error('Error fetching image:', error.message);
    process.exit(1);
  }
}

convertToBase64();
