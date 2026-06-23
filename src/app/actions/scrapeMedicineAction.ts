"use server"

import { scrapeMedicinePrice } from "@/lib/scraper"

export async function scrapeMedicineAction(medicineName: string) {
  if (!medicineName || medicineName.trim().length < 3) return null;
  const price = await scrapeMedicinePrice(medicineName.trim());
  return price;
}
