import sys
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

import csv
import argparse
import random
import itertools

cities = [
    "Lagos, Nigeria", "Nairobi, Kenya", "Accra, Ghana", "Johannesburg, South Africa",
    "Cairo, Egypt", "Dar es Salaam, Tanzania", "Kampala, Uganda", "Addis Ababa, Ethiopia",
    "Kigali, Rwanda", "Dakar, Senegal", "Abidjan, Ivory Coast", "Casablanca, Morocco",
    "Luanda, Angola", "Maputo, Mozambique", "Lusaka, Zambia", "Harare, Zimbabwe",
    "Kumasi, Ghana", "Mombasa, Kenya", "Ibadan, Nigeria", "Durban, South Africa"
]

industries = [
    "Textile manufacturer", "Garment factory", "Cotton wholesaler", "Leather goods supplier",
    "Packaging materials supplier", "Plastic manufacturer", "Cardboard box factory", "Eco-friendly packaging",
    "Coffee exporter", "Cocoa supplier", "Tea plantation", "Spices wholesaler",
    "Freight forwarder", "Logistics company", "Cold storage warehouse", "Shipping agent",
    "Solar panel distributor", "Electronics assembler", "Mobile phone wholesaler", "Computer hardware supplier",
    "Construction materials supplier", "Cement distributor", "Steel wholesaler", "Timber supplier",
    "Pharmaceutical distributor", "Medical equipment supplier", "Laboratory chemicals wholesaler",
    "Agricultural machinery dealer", "Fertilizer supplier", "Irrigation equipment supplier",
    "Furniture manufacturer", "Office supplies wholesaler", "Industrial cleaning supplies"
]

def generate_csv(filename="african_suppliers.csv", num_rows=500, seed=42):
    print(f"Generating {num_rows} rows in {filename} (Seed: {seed})...")
    random.seed(seed)
    
    # Generate all possible unique combinations and shuffle
    all_combos = list(itertools.product(industries, cities))
    random.shuffle(all_combos)
    
    # Slice to the requested number of rows
    selected = all_combos[:num_rows]
    
    with open(filename, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(["keyword", "location"])
        writer.writerows(selected)
        
    print(f"✅ Successfully generated {len(selected)} unique search queries.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--rows", type=int, default=500)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--file", type=str, default="african_suppliers.csv")
    args = parser.parse_args()
    
    generate_csv(args.file, args.rows, args.seed)
