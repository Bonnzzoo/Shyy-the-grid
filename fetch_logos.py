import os
import requests
import time
from duckduckgo_search import DDGS

brands = [
  {"id": "C1", "brand": "UpTowels"}, {"id": "C2", "brand": "Familia"}, {"id": "C3", "brand": "Clue"},
  {"id": "C4", "brand": "Simple"}, {"id": "C5", "brand": "Breathe"}, {"id": "C6", "brand": "Veil"},
  {"id": "C7", "brand": "Le Maillot"}, {"id": "C8", "brand": "Tia Mode"}, {"id": "C9", "brand": "Jamila"},
  {"id": "C10", "brand": "BlackCloset"}, {"id": "C11", "brand": "Jude"}, {"id": "C12", "brand": "Buffalo"},
  {"id": "C13", "brand": "TGS"}, {"id": "C14", "brand": "Amira El D."},
  {"id": "A1", "brand": "Noje"}, {"id": "A2", "brand": "Capixy"}, {"id": "A3", "brand": "Noje"},
  {"id": "A4", "brand": "Shaan"}, {"id": "A5", "brand": "Clary"}, {"id": "A6", "brand": "Starville"},
  {"id": "A7", "brand": "Bobai"}, {"id": "A8", "brand": "MY-M"}, {"id": "A9", "brand": "Joo Shades"},
  {"id": "A10", "brand": "Madad"}, {"id": "A11", "brand": "Leap"}, {"id": "A12", "brand": "Sweetal"},
  {"id": "A13", "brand": "ExMart"}, {"id": "A14", "brand": "Oranamin C"}, {"id": "A15", "brand": "Bohartna"},
  {"id": "A16", "brand": "Haj Arafa"}, {"id": "A17", "brand": "Fawry"},
  {"id": "B1", "brand": "MYVI"}, {"id": "B2", "brand": "Infinity"}, {"id": "B3", "brand": "Skinify"},
  {"id": "D1", "brand": "Kolagra"}, {"id": "D2", "brand": "Altesse"}, {"id": "D3", "brand": "Skinova"},
  {"id": "D4", "brand": "Trindiva"}, {"id": "D5", "brand": "Dermactive"}
]

logos_dir = os.path.join("public", "logos")
os.makedirs(logos_dir, exist_ok=True)

def fetch_logos():
    with DDGS() as ddgs:
        for item in brands:
            target_file = os.path.join(logos_dir, f"{item['id']}.jpg")
            if os.path.exists(target_file):
                print(f"Skipping {item['brand']} - exists")
                continue
            
            query = f"{item['brand']} egypt logo square"
            print(f"Fetching {item['brand']}...")
            try:
                results = list(ddgs.images(query, max_results=1))
                if results and len(results) > 0:
                    image_url = results[0].get('image')
                    if image_url:
                        resp = requests.get(image_url, timeout=10)
                        if resp.status_code == 200:
                            with open(target_file, "wb") as f:
                                f.write(resp.content)
                            print(f" -> Saved {item['id']}.jpg")
                        else:
                            print(f" -> Failed to download for {item['brand']}")
                else:
                    print(f" -> No image found for {item['brand']}")
            except Exception as e:
                print(f" -> Error fetching {item['brand']}: {e}")
            
            time.sleep(1)

if __name__ == "__main__":
    fetch_logos()
