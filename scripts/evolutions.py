
import sys
import asyncio
import csv
from playwright.async_api import async_playwright
import re
import json

async def process_digimon(page, name_en):
    # Clean up name_en
    clean_name = re.sub(r'[^a-zA-Z0-9\s-]', '', name_en)  # Remove special characters
    clean_name = clean_name.lower()  # Convert to lowercase
    clean_name = clean_name.replace(' ', '-')  # Replace spaces with hyphens
    
    url = f'https://www.grindosaur.com/en/games/digital-tamers-2/digimon/{clean_name}'
    print(f'\nProcessing {name_en} (URL: {url})')
    
    try:
        await page.goto(url, wait_until='networkidle')
        await page.wait_for_selector('.box', state='attached', timeout=60000)
        
        # Get evolution data using JavaScript
        evolution_data = await page.evaluate('''
            () => {
                const data = [];
                
                // Find evolution requirements box
                const boxes = Array.from(document.querySelectorAll('.box'));
                const reqBox = boxes.find(box => {
                    const p = box.querySelector('p');
                    return p && p.textContent.includes('evolution') && p.textContent.includes('requirement');
                });
                
                if (!reqBox) return data;
                
                // Process each digimon column
                reqBox.querySelectorAll('.columns').forEach(columns => {
                    columns.querySelectorAll('.columns__item').forEach(column => {
                        const caption = column.querySelector('caption a');
                        if (!caption) return;
                        
                        const from = caption.textContent.trim();
                        const requirements = [];
                        
                        // Get requirements from table
                        const rows = column.querySelectorAll('tr');
                        rows.forEach(row => {
                            const label = row.querySelector('th').textContent.trim();
                            const value = row.querySelector('td').textContent.trim();
                            requirements.push(`${label} ${value}`);
                        });
                        
                        data.push({
                            from: from,
                            requirements: requirements
                        });
                    });
                });
                
                return data;
            }
        ''')
        
        # Format the evolution data
        formatted_data = []
        for entry in evolution_data:
            formatted_entry = {
                "from": entry["from"],
                "to": name_en,
                "requirements": entry["requirements"]
            }
            formatted_data.append(formatted_entry)
        
        # Print the results
        print("\nEvolution data for", name_en)
        print("-" * 50)
        print(json.dumps(formatted_data, ensure_ascii=False, indent=2))
        
        return formatted_data
            
    except Exception as e:
        print(f'Error processing {name_en}: {str(e)}')
        return []

async def process_single_digimon(digimon_name):
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 720},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        )
        page = await context.new_page()
        
        try:
            evolution_data = await process_digimon(page, digimon_name)
            return evolution_data
        finally:
            await browser.close()

async def main():
    # Check if a specific digimon name was provided
    if len(sys.argv) > 1:
        digimon_name = sys.argv[1]
        await process_single_digimon(digimon_name)
        return

    # If no digimon name provided, process all digimons
    digimons = []
    with open('./database/digimons.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            digimons.append(row['name_en'])
    
    print(f"Found {len(digimons)} Digimon to process")
    all_evolution_data = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 720},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        )
        page = await context.new_page()
        
        try:
            for i, digimon in enumerate(digimons, 1):
                print(f"\nProcessing {i}/{len(digimons)}: {digimon}")
                try:
                    evolution_data = await process_digimon(page, digimon)
                    all_evolution_data.extend(evolution_data)
                    # Save progress every 10 Digimon
                    if i % 10 == 0:
                        print(f"Saving progress... ({i}/{len(digimons)})")
                        with open('./database/evolutions.json', 'w', encoding='utf-8') as f:
                            json.dump(all_evolution_data, f, ensure_ascii=False, indent=2)
                    # Add a small delay to avoid overwhelming the server
                    await asyncio.sleep(1)
                except Exception as e:
                    print(f"Error processing {digimon}: {str(e)}")
                    continue
        except KeyboardInterrupt:
            print('\nScript interrupted by user. Saving current progress...')
        except Exception as e:
            print(f'\nError occurred: {str(e)}\nSaving current progress...')
        finally:
            # Save final results
            print("\nSaving final results...")
            with open('./database/evolutions.json', 'w', encoding='utf-8') as f:
                json.dump(all_evolution_data, f, ensure_ascii=False, indent=2)
            print(f"Saved {len(all_evolution_data)} evolution entries to evolutions.json")
            await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
