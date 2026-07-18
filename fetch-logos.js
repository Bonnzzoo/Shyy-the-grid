const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const brands = [
  // Fashion Icons
  { id: 'C1', brand: 'UpTowels' }, { id: 'C2', brand: 'Familia' }, { id: 'C3', brand: 'Clue' },
  { id: 'C4', brand: 'Simple' }, { id: 'C5', brand: 'Breathe' }, { id: 'C6', brand: 'Veil' },
  { id: 'C7', brand: 'Le Maillot' }, { id: 'C8', brand: 'Tia Mode' }, { id: 'C9', brand: 'Jamila' },
  { id: 'C10', brand: 'BlackCloset' }, { id: 'C11', brand: 'Jude' }, { id: 'C12', brand: 'Buffalo' },
  { id: 'C13', brand: 'TGS' }, { id: 'C14', brand: 'Amira El D.' },
  // Beauty Icons
  { id: 'A1', brand: 'Noje' }, { id: 'A2', brand: 'Capixy' }, { id: 'A3', brand: 'Noje' },
  { id: 'A4', brand: 'Shaan' }, { id: 'A5', brand: 'Clary' }, { id: 'A6', brand: 'Starville' },
  { id: 'A7', brand: 'Bobai' }, { id: 'A8', brand: 'MY-M' }, { id: 'A9', brand: 'Joo Shades' },
  { id: 'A10', brand: 'Madad' }, { id: 'A11', brand: 'Leap' }, { id: 'A12', brand: 'Sweetal' },
  { id: 'A13', brand: 'ExMart' }, { id: 'A14', brand: 'Oranamin C' }, { id: 'A15', brand: 'Bohartna' },
  { id: 'A16', brand: 'Haj Arafa' }, { id: 'A17', brand: 'Fawry' },
  // Side Icons
  { id: 'B1', brand: 'MYVI' }, { id: 'B2', brand: 'Infinity' }, { id: 'B3', brand: 'Skinify' },
  { id: 'D1', brand: 'Kolagra' }, { id: 'D2', brand: 'Altesse' }, { id: 'D3', brand: 'Skinova' },
  { id: 'D4', brand: 'Trindiva' }, { id: 'D5', brand: 'Dermactive' }
];

const logosDir = path.join(__dirname, 'public', 'logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

async function fetchLogos() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  for (const item of brands) {
    if (fs.existsSync(path.join(logosDir, `${item.id}.jpg`)) || fs.existsSync(path.join(logosDir, `${item.id}.png`))) {
      console.log(`Skipping ${item.brand} (${item.id}) - already exists`);
      continue;
    }

    console.log(`Fetching logo for ${item.brand}...`);
    try {
      const query = encodeURIComponent(`${item.brand} egypt logo square`);
      await page.goto(`https://www.google.com/search?q=${query}&tbm=isch`, { waitUntil: 'domcontentloaded' });
      
      // Extract the first image thumbnail src
      const imgSrc = await page.evaluate(() => {
        // Find the first image in the main results grid that has a data URL or valid src
        const imgs = Array.from(document.querySelectorAll('img'));
        for (const img of imgs) {
          const src = img.getAttribute('src');
          if (src && (src.startsWith('data:image/') || src.startsWith('http'))) {
            // Avoid getting the Google logo or icons
            if (!src.includes('googlelogo') && img.width > 30) {
              return src;
            }
          }
        }
        return null;
      });

      if (imgSrc) {
        if (imgSrc.startsWith('data:image/')) {
          // Parse data URI
          const matches = imgSrc.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            let type = matches[1];
            if (type === 'jpeg') type = 'jpg';
            const buffer = Buffer.from(matches[2], 'base64');
            fs.writeFileSync(path.join(logosDir, `${item.id}.${type}`), buffer);
            console.log(`-> Saved ${item.id}.${type}`);
          } else {
             console.log(`-> Invalid data URI format for ${item.brand}`);
          }
        } else {
          // Normal HTTP URL, use fetch
          const res = await fetch(imgSrc);
          const buffer = Buffer.from(await res.arrayBuffer());
          // assume jpg for http fallback
          fs.writeFileSync(path.join(logosDir, `${item.id}.jpg`), buffer);
          console.log(`-> Saved ${item.id}.jpg (from HTTP)`);
        }
      } else {
        console.log(`-> No image found for ${item.brand}`);
      }
    } catch (e) {
      console.error(`-> Error fetching ${item.brand}:`, e.message);
    }
    
    // delay to prevent rate limit
    await new Promise(r => setTimeout(r, 1500));
  }
  
  await browser.close();
  console.log('Finished fetching logos.');
}

fetchLogos();
