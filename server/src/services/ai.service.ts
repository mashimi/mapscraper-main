import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { Lead } from '../models/scrape-job.model';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

class AIService {
    async enrichLeads(leads: Lead[]): Promise<Lead[]> {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not set');
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // We process in batches to avoid token limits
        // Increased to 50 leads per batch
        const batch = leads.slice(0, 50);

        const prompt = `
        You are a Data Quality Expert. I have scraped some business leads from Google Maps. 
        Please clean and enrich this data.
        
        Input Data (JSON):
        ${JSON.stringify(batch)}

        Instructions:
        1. "phone": Convert to a clean international format. If it is "Hidden" or "N/A", keep it as is.
        2. "email": PRESERVE this field. If it is "Finding..." or "Not Found", try to verify if the business name looks like a personal brand and guess a possible domain if relevant, otherwise leave as is.
        3. "category": Standardize to a high-level industry category (e.g. "Hospitality", "Healthcare", "Leisure", "Retail").
        4. "rating": Convert to a clean floating point number (e.g. 4.2).
        5. Add a NEW field called "sentiment":
           - "High Potential": Rating > 4.4 AND reviews > 100.
           - "Good": Rating > 4.0.
           - "Average": Rating 3.5 - 4.0.
           - "Risk": Rating < 3.5.
        
        Strictly return ONLY the raw JSON array of objects.
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean Markdown if Gemini manages to sneak it in
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

            const enrichedLeads = JSON.parse(jsonStr);
            return enrichedLeads;
        } catch (error) {
            console.error('AI Processing Error:', error);
            // Fallback: return original leads if AI fails
            return leads;
        }
    }
}

export default new AIService();
