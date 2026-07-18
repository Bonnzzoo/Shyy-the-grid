import json
import urllib.request
import os

BRANDS = [
  { "id": "C1", "brand": "AMALEID" },
  { "id": "C2", "brand": "AB ESSENTIALS" },
  { "id": "C3", "brand": "ARABESQUE BOUTIQUE" },
  { "id": "C4", "brand": "ASCIA" },
  { "id": "C5", "brand": "ASEEL" },
  { "id": "C6", "brand": "BOHO BY DINA" },
  { "id": "C7", "brand": "BY NESMA SALAH" },
  { "id": "C8", "brand": "CASHMERE" },
  { "id": "C9", "brand": "DRESS CODE" },
  { "id": "C10", "brand": "ELAN" },
  { "id": "C11", "brand": "FABULICIOUS" },
  { "id": "C12", "brand": "HOOR DESIGNS" },
  { "id": "C13", "brand": "MOONLIGHT" },
  { "id": "C14", "brand": "ZWIENA" },

  { "id": "A1", "brand": "BEINJI" },
  { "id": "A2", "brand": "JOIE BY MIRA" },
  { "id": "A3", "brand": "KYLA" },
  { "id": "A4", "brand": "MEEM STORE" },
  { "id": "A5", "brand": "MIKA" },
  { "id": "A6", "brand": "NATURAL" },
  { "id": "A7", "brand": "OJUY" },
  { "id": "A8", "brand": "ROSETTA VALENTINA" },
  { "id": "A9", "brand": "SHEA BODY BOUTIQUE" },
  { "id": "A10", "brand": "TON ODEUR" },
  { "id": "A11", "brand": "ZK HERBAL" },
  { "id": "A12", "brand": "MUSC" },
  { "id": "A13", "brand": "NOURNIOS" },
  { "id": "A14", "brand": "SHAGHAF PERFUME" },
  { "id": "A15", "brand": "AMICI" },
  { "id": "A16", "brand": "BUFANDA" },
  { "id": "A17", "brand": "TASNEEM HIJAB" },

  { "id": "B1", "brand": "FARAH DESIGNS" },
  { "id": "B2", "brand": "STITCH" },
  { "id": "B3", "brand": "ASH DECORATION" },
  { "id": "D1", "brand": "FARIDA CERAMICS" },
  { "id": "D2", "brand": "KILIM FARHA" },
  { "id": "D3", "brand": "CHUMMY" },
  { "id": "D4", "brand": "FEMME" },
  { "id": "D5", "brand": "MUMUU" }
]

from bing_image_downloader import downloader

def download_logos():
    for item in BRANDS:
        print(f"Fetching {item['brand']}...")
        query = f"{item['brand']} brand egypt logo profile picture instagram"
        try:
            downloader.download(query, limit=1, output_dir='temp_logos', force_replace=False, timeout=10, verbose=True)
            
            # Find the downloaded file
            target_dir = os.path.join('temp_logos', query)
            if os.path.exists(target_dir):
                files = os.listdir(target_dir)
                if files:
                    src = os.path.join(target_dir, files[0])
                    dst = f"public/logos/{item['id']}.jpg"
                    os.rename(src, dst)
                    print(f" -> Saved {item['id']}.jpg")
                else:
                    print(f" -> No files downloaded for {item['brand']}")
        except Exception as e:
            print(f"Error fetching {item['brand']}: {e}")

    print("Finished!")

if __name__ == "__main__":
    download_logos()
