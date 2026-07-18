const fs = require('fs');
const path = require('path');

const brands = [
  {"id": "C1", "brand": "UpTowels", "domain": "uptowels.com"},
  {"id": "C2", "brand": "Familia", "domain": "familia.com"},
  {"id": "C3", "brand": "Clue", "domain": "clue.com"},
  {"id": "C4", "brand": "Simple", "domain": "simple.co.uk"},
  {"id": "C5", "brand": "Breathe", "domain": "breathe.com"},
  {"id": "C6", "brand": "Veil", "domain": "veil.com"},
  {"id": "C7", "brand": "Le Maillot", "domain": "lemaillot.com"},
  {"id": "C8", "brand": "Tia Mode", "domain": "tiamode.com"},
  {"id": "C9", "brand": "Jamila", "domain": "jamila.com"},
  {"id": "C10", "brand": "BlackCloset", "domain": "blackcloset.com"},
  {"id": "C11", "brand": "Jude", "domain": "jude.com"},
  {"id": "C12", "brand": "Buffalo", "domain": "buffalo.com"},
  {"id": "C13", "brand": "TGS", "domain": "tgs.com"},
  {"id": "C14", "brand": "Amira El D.", "domain": "amira.com"},
  {"id": "A1", "brand": "Noje", "domain": "noje.com"},
  {"id": "A2", "brand": "Capixy", "domain": "capixy.com"},
  {"id": "A3", "brand": "Noje", "domain": "noje.com"},
  {"id": "A4", "brand": "Shaan", "domain": "shaan.com"},
  {"id": "A5", "brand": "Clary", "domain": "clary.com"},
  {"id": "A6", "brand": "Starville", "domain": "starville.com"},
  {"id": "A7", "brand": "Bobai", "domain": "bobai.com"},
  {"id": "A8", "brand": "MY-M", "domain": "my-m.com"},
  {"id": "A9", "brand": "Joo Shades", "domain": "jooshades.com"},
  {"id": "A10", "brand": "Madad", "domain": "madad.com"},
  {"id": "A11", "brand": "Leap", "domain": "leap.com"},
  {"id": "A12", "brand": "Sweetal", "domain": "sweetal.com"},
  {"id": "A13", "brand": "ExMart", "domain": "exmart.com"},
  {"id": "A14", "brand": "Oranamin C", "domain": "otsuka.com"},
  {"id": "A15", "brand": "Bohartna", "domain": "bohartna.com"},
  {"id": "A16", "brand": "Haj Arafa", "domain": "hajarafa.com"},
  {"id": "A17", "brand": "Fawry", "domain": "fawry.com"},
  {"id": "B1", "brand": "MYVI", "domain": "myvi.com"},
  {"id": "B2", "brand": "Infinity", "domain": "infinity.com"},
  {"id": "B3", "brand": "Skinify", "domain": "skinify.com"},
  {"id": "D1", "brand": "Kolagra", "domain": "kolagra.com"},
  {"id": "D2", "brand": "Altesse", "domain": "altesse.com"},
  {"id": "D3", "brand": "Skinova", "domain": "skinova.com"},
  {"id": "D4", "brand": "Trindiva", "domain": "trindiva.com"},
  {"id": "D5", "brand": "Dermactive", "domain": "dermactive.com"}
];

const logosDir = path.join(__dirname, 'public', 'logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

async function fetchLogos() {
  for (const item of brands) {
    const targetFile = path.join(logosDir, `${item.id}.jpg`);
    if (fs.existsSync(targetFile)) {
      console.log(`Skipping ${item.brand}`);
      continue;
    }
    
    try {
      const res = await fetch(`https://logo.clearbit.com/${item.domain}`);
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(targetFile, buffer);
        console.log(`Saved ${item.brand}`);
      } else {
        console.log(`Failed for ${item.brand}`);
      }
    } catch (e) {
      console.log(`Error for ${item.brand}`);
    }
  }
}
fetchLogos();
