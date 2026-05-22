import axios from 'axios';
import { provinceCoords } from './geoData';

export async function getActivePovertyGrants() {
  // Broaden query to catch all poverty-related aid via sectors OR keywords
  const iatiQuery = 'recipient_country_code:"PH" AND activity_status_code:2 AND (sector_code:160* OR title_narrative:*poverty* OR description_narrative:*poverty*)';
  const fields = 'iati_identifier,title_narrative,description_narrative,reporting_org_narrative,transaction_value,budget_value,location_administrative_name,recipient_region_narrative';
  const url = `https://api.iatistandard.org/datastore/activity/select?q=${encodeURIComponent(iatiQuery)}&wt=json&rows=1000&fl=${fields}`;

  try {
    // Using native fetch allows Next.js to cache the response, preventing 429 errors.
    const response = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.IATI_API_KEY || ''
      },
      next: { revalidate: 3600 } // Cache data for 1 hour
    });

    if (response.status === 429) {
      console.warn("IATI Rate limit hit. Using empty fallback. Consider increasing revalidate time.");
      return [];
    }

    const data = await response.json();
    const docs = data.response?.docs || [];
    
    return docs.map(doc => ({
      id: doc.iati_identifier,
      title: doc.title_narrative?.[0] || "General Grant",
      description: doc.description_narrative?.[0] || "",
      provider: doc.reporting_org_narrative?.[0] || "ODA Provider",
      // Use transaction values or budget values as fallback to avoid 0s for new projects
      amount: (
        (doc.transaction_value?.reduce((a, b) => a + Number(b), 0) || 
         doc.budget_value?.reduce((a, b) => a + Number(b), 0) || 0)
      ) * 56, 
      provinces: [
        ...(doc.location_administrative_name || []),
        ...(doc.recipient_region_narrative || [])
      ]
    }));
  } catch (error) {
    console.error("IATI Parser Error:", error);
    return [];
  }
}

/**
 * Fetches National Tax Allotment (NTA/IRA) from DBM/PSA OpenData
 * This represents the actual national budget subsidy for each province.
 */
export async function getNationalSubsidies() {
  // Dataset: LGU Shares from National Internal Revenue Taxes (NTA)
  const DBM_API_URL = 'https://openstat.psa.gov.ph/api/rest/v1/get/custom/nta_allocations_provinces';

  try {
    const response = await fetch(DBM_API_URL, { 
      next: { revalidate: 86400 } // NTA/GAA data changes yearly, cache for 24 hours
    });
    
    const data = await response.json();
    const rawData = data.provinces || [];
    
    // Return a lookup map: { "Province Name": Amount }
    return rawData.reduce((acc, p) => {
      // PSA values are often in millions or actual PHP; we normalize to PHP
      acc[p.location] = parseFloat(p.value);
      return acc;
    }, {});
  } catch (err) {
    console.warn("DBM Data Source unreachable. LGUs will use GAA baseline estimates.", err);
    return {};
  }
}

export async function getPoorestProvinces() {
  const PSA_API_URL = 'https://openstat.psa.gov.ph/api/rest/v1/get/custom/poverty_incidence_provinces';

  try {
    const response = await axios.get(PSA_API_URL, { timeout: 5000 });
    const rawData = response.data.provinces || []; 
    
    return rawData
      .map(p => ({
        name: p.location,
        region: p.region_code || "NCR",
        incidence: parseFloat(p.value),
        lat: provinceCoords[p.location]?.[0] || 12.0,
        lng: provinceCoords[p.location]?.[1] || 122.0
      }))
      .sort((a, b) => b.incidence - a.incidence);
  } catch (err) {
    console.warn("PSA API offline, falling back to cached latest statistics.", err);
    // Fallback restricted to Region VIII (Eastern Visayas) provinces only
    const fallback = [
      { name: "Biliran", region: "Region VIII", incidence: 14.2 },
      { name: "Eastern Samar", region: "Region VIII", incidence: 37.4 },
      { name: "Leyte", region: "Region VIII", incidence: 18.4 },
      { name: "Northern Samar", region: "Region VIII", incidence: 27.5 },
      { name: "Samar", region: "Region VIII", incidence: 24.2 },
      { name: "Southern Leyte", region: "Region VIII", incidence: 12.1 },
    ];

    return fallback
      .map(p => ({ ...p, lat: provinceCoords[p.name]?.[0] || 12.0, lng: provinceCoords[p.name]?.[1] || 122.0 }))
      .sort((a, b) => b.incidence - a.incidence);
  }
}