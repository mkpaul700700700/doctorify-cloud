import * as cheerio from 'cheerio'

export async function scrapeMedicinePrice(medicineName: string): Promise<number | null> {
  try {
    // PRIMARY SOURCE: MedEx Bangladesh
    const searchUrl = `https://medex.com.bd/search?search=${encodeURIComponent(medicineName)}`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 3600 }
    });
    
    if (searchResponse.ok) {
      const searchHtml = await searchResponse.text();
      const $search = cheerio.load(searchHtml);
      
      let firstBrandLink: string | null = null;
      $search('a').each((i, el) => {
        const href = $search(el).attr('href');
        if (href && href.includes('/brands/') && !firstBrandLink) {
          firstBrandLink = href;
        }
      });

      if (firstBrandLink) {
        const detailResponse = await fetch(firstBrandLink, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          next: { revalidate: 3600 }
        });
        
        if (detailResponse.ok) {
          const detailHtml = await detailResponse.text();
          const $detail = cheerio.load(detailHtml);
          
          // Identify Form Factor (Tablet, Capsule, Syrup, Injection)
          const formFactorText = $detail('.package-pricing').text() || "";
          let multiplier = 1;
          
          // MedEx formats prices differently. Sometimes it says "Unit Price: ৳ 1.70"
          // Sometimes for Syrups it says "100 ml bottle: ৳ 45.00"
          
          const exactPriceMatch = detailHtml.match(/Unit Price:[\s\S]*?৳\s*([0-9]+\.[0-9]+)/i);
          const bottlePriceMatch = detailHtml.match(/bottle:[\s\S]*?৳\s*([0-9]+\.[0-9]+)/i);
          const injectionPriceMatch = detailHtml.match(/ampoule:[\s\S]*?৳\s*([0-9]+\.[0-9]+)/i) || detailHtml.match(/vial:[\s\S]*?৳\s*([0-9]+\.[0-9]+)/i);

          if (exactPriceMatch && exactPriceMatch[1]) {
            return parseFloat(exactPriceMatch[1]);
          } else if (bottlePriceMatch && bottlePriceMatch[1]) {
            return parseFloat(bottlePriceMatch[1]); // Return price per entire syrup bottle
          } else if (injectionPriceMatch && injectionPriceMatch[1]) {
            return parseFloat(injectionPriceMatch[1]);
          }
        }
      }
    }
    
    // FALLBACK SOURCE: Alternative BD Pharmacy (e.g. LazzPharma / DIMS API stub)
    // If MedEx fails to find it, we attempt a generic search fallback.
    // In a real production environment, this would call Arogga or Daraz API with auth tokens.
    // Since we don't have API keys, we return null so the UI safely shows "N/A" as requested.
    return null;
    
  } catch (err) {
    console.error("Scraping error:", err);
    return null;
  }
}
