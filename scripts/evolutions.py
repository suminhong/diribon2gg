import csv
import json
import re
import asyncio
from playwright.async_api import async_playwright

async def process_digimon(page, name_en):
    # Clean up name_en
    clean_name = re.sub(r'[^a-zA-Z0-9\s-]', '', name_en)  # Remove special characters
    clean_name = clean_name.lower()  # Convert to lowercase
    clean_name = clean_name.replace(' ', '-')  # Replace spaces with hyphens
    
    url = f'https://www.grindosaur.com/en/games/digital-tamers-2/digimon/{clean_name}'
    print(f'\nProcessing {name_en} (URL: {url})')
    
    try:
        await page.goto(url, wait_until='networkidle')
        
        # Get evolution data
        evolutions_from = []
        evolutions_to = []
        
        # Get 'Evolves from' section
        evolves_from_links = await page.query_selector_all('h2:has-text("Evolves from") ~ a:not(:has-text("Digivolution Planner"))')
        for link in evolves_from_links:
            href = await link.get_attribute('href')
            if not href or '/elements/' in href:
                continue
            text = await link.text_content()
            evolutions_from.append(text)
        
        # Get 'Evolves to' section
        evolves_to_links = await page.query_selector_all('h2:has-text("Evolves to") ~ a:not(:has-text("Digivolution Planner"))')
        for link in evolves_to_links:
            href = await link.get_attribute('href')
            if not href or '/elements/' in href:
                continue
            text = await link.text_content()
            evolutions_to.append(text)
        
        evolution_entries = []
        
        # Create entries for evolutions from previous forms
        for from_digimon in evolutions_from:
            entry = {
                'from': from_digimon,
                'to': name_en,
                'requirements': ''  # We'll need to update the requirements format later
            }
            evolution_entries.append(entry)
            print(f'Found evolution from: {json.dumps(entry, ensure_ascii=False)}')
        
        # Create entries for evolutions to next forms
        for to_digimon in evolutions_to:
            entry = {
                'from': name_en,
                'to': to_digimon,
                'requirements': ''  # We'll need to update the requirements format later
            }
            evolution_entries.append(entry)
            print(f'Found evolution to: {json.dumps(entry, ensure_ascii=False)}')
        
        return evolution_entries
            
    except Exception as e:
        print(f'Error processing {name_en}: {str(e)}')
    
    print(f'No evolution data found for {name_en}')
    return []

async def main():
    # Read digimons from CSV
    digimons = []
    with open('/Users/honglab/Desktop/suminhong/diribon2gg/database/digimons.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            digimons.append(row['name_en'])
    
    evolution_data = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        
        try:
            for digimon in digimons:
                entries = await process_digimon(page, digimon)
                evolution_data.extend(entries)
                print(f'Total evolutions found so far: {len(evolution_data)}')
                # Add a small delay to avoid overwhelming the server
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            print('\nScript interrupted by user. Saving collected data...')
        except Exception as e:
            print(f'\nError occurred: {str(e)}\nSaving collected data...')
        finally:
            await browser.close()
            
            if evolution_data:
                print('\nSaving evolution data...')
                # Save to JSON file
                with open('/Users/honglab/Desktop/suminhong/diribon2gg/database/evolutions.json', 'w', encoding='utf-8') as f:
                    json.dump(evolution_data, f, ensure_ascii=False, indent=2)
                print(f'Saved {len(evolution_data)} evolution entries to evolutions.json')

if __name__ == '__main__':
    asyncio.run(main())
