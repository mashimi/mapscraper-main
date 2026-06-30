import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';
import { Server } from 'socket.io';
import { Lead } from '../models/scrape-job.model';
import aiService from './ai.service';
import { jobStore } from './job-store';

puppeteer.use(StealthPlugin());

class ScraperService {
    private browser: Browser | null = null;

    // Keep a single browser instance alive to save RAM and CPU
    async getBrowser(): Promise<Browser> {
        if (!this.browser || !this.browser.isConnected()) {
            console.log('[ScraperService] Launching new shared browser instance...');
            this.browser = await (puppeteer as any).launch({
                headless: process.env.NODE_ENV === 'production', // Run headless in prod
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--window-size=1280,1000'
                ],
                defaultViewport: null
            }) as Browser;
        }
        return this.browser;
    }

    async scrape(jobId: string, keyword: string, location: string, io: Server) {
        console.log(`[ScraperService] Starting Professional Deep Scrape: ${jobId}`);
        const browser = await this.getBrowser();
        let page: Page | null = null;

        try {
            page = await browser.newPage();
            const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(keyword)}+in+${encodeURIComponent(location)}`;
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

            // 1. Handle Consent
            try {
                const consentSelector = 'button[aria-label*="Agree"], button[aria-label*="Accept"], button[jsname="b3VHJd"]';
                const consentButton = await page.waitForSelector(consentSelector, { timeout: 3000 }).catch(() => null);
                if (consentButton) {
                    await consentButton.click();
                    await new Promise(r => setTimeout(r, 2000));
                }
            } catch (e) { }

            jobStore.setJob(jobId, { jobId, progress: 10, status: 'running' });
            io.emit(`job_update_${jobId}`, { status: 'running', progress: 10 });

            // 2. Scroll to load a good batch (Deep scroll for 50+ results)
            for (let i = 0; i < 8; i++) {
                await page.evaluate(() => {
                    const feed = document.querySelector('div[role="feed"]');
                    if (feed) feed.scrollBy(0, 2000);
                });
                await new Promise(r => setTimeout(r, 2000));
            }

            // 3. Get all result handles
            const itemHandles = await page.$$('.Nv2PK');
            const targetCount = Math.min(itemHandles.length, 50); // Process up to 50 as requested
            console.log(`[ScraperService] Found ${itemHandles.length} potential leads. Depth processing ${targetCount} items...`);

            let allLeads: Lead[] = [];
            const seenLeads = new Set<string>(); // Prevent duplicate leads in the same run

            // 4. Detailed Extraction (Professional Method: Click & Read Sidebar)
            for (let i = 0; i < targetCount; i++) {
                try {
                    const item = itemHandles[i];

                    // Click the item to open detailed view
                    await item.click();
                    await new Promise(r => setTimeout(r, 2500)); // Wait for sidebar

                    const details = await page.evaluate(() => {
                        const getByAriaLabel = (label: string) => {
                            const el = document.querySelector(`[aria-label="${label}"]`);
                            return el?.textContent?.trim() || 'N/A';
                        };

                        const getWebsite = () => {
                            const websiteEl = document.querySelector('a[aria-label*="Website"]') ||
                                document.querySelector('.ITkAi a') ||
                                document.querySelector('a[data-item-id="authority"]');
                            return websiteEl?.getAttribute('href') || '';
                        };

                        const getPhone = () => {
                            const phoneEl = document.querySelector('[aria-label*="Phone"]') ||
                                document.querySelector('button[data-item-id*="phone:tel"]') ||
                                document.querySelector('.Cs16t');
                            return phoneEl?.textContent?.trim() || 'Hidden';
                        };

                        const name = document.querySelector('h1.DUwDvf')?.textContent || 'N/A';
                        const rating = document.querySelector('.F7nice span[aria-hidden="true"]')?.textContent || '0';
                        const reviews = document.querySelector('.F7nice span[aria-label*="reviews"]')?.textContent || '(0)';
                        const category = document.querySelector('.DByne')?.textContent || 'Business';

                        return {
                            name,
                            rating,
                            reviews,
                            category,
                            phone: getPhone(),
                            website: getWebsite()
                        };
                    });

                    // Skip duplicates
                    const leadKey = `${details.name}-${details.phone}`;
                    if (seenLeads.has(leadKey)) continue;
                    seenLeads.add(leadKey);

                    let lead: Lead = {
                        ...details,
                        email: 'Finding...'
                    };

                    // 5. Deep Email Crawling
                    if (lead.website && lead.website.startsWith('http') && !lead.website.includes('google.com/maps')) {
                        let contactPage: Page | null = null;
                        try {
                            contactPage = await browser.newPage();
                            await contactPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
                            await contactPage.goto(lead.website, { waitUntil: 'domcontentloaded', timeout: 10000 });

                            const email = await contactPage.evaluate(() => {
                                const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
                                const matches = document.body.innerText.match(emailRegex);
                                return matches ? matches.filter(e => !e.match(/\.(png|jpg|jpeg|svg|webp|gif)$/i))[0] : null;
                            });

                            if (email) lead.email = email;
                            else lead.email = 'Not Found';

                            await contactPage.close();
                        } catch (e) {
                            lead.email = 'Error';
                            if (contactPage) await contactPage.close();
                        }
                    } else {
                        lead.email = 'No Website';
                    }

                    allLeads.push(lead);

                    const progress = 10 + Math.round(((i + 1) / targetCount) * 80);
                    jobStore.setJob(jobId, { jobId, progress, status: 'running', data: allLeads });
                    io.emit(`job_update_${jobId}`, { progress, data: [lead], status: 'running' });
                    console.log(`[ScraperService] Extriched Lead ${i + 1}/${targetCount}: ${lead.name} | Phone: ${lead.phone}`);

                } catch (err) {
                    console.error('[ScraperService] Error extracting detail for item:', i);
                }
            }

            await page.close(); // Close tab, but keep browser alive!

            // 6. AI Enrichment
            jobStore.setJob(jobId, { jobId, progress: 95, status: 'running', data: allLeads });
            io.emit(`job_update_${jobId}`, { status: 'enriching', progress: 95 });
            const enrichedLeads = await aiService.enrichLeads(allLeads);

            jobStore.setJob(jobId, {
                jobId,
                status: 'completed',
                progress: 100,
                data: enrichedLeads
            });
            io.emit(`job_update_${jobId}`, {
                status: 'completed',
                progress: 100,
                data: enrichedLeads
            });

        } catch (error: any) {
            console.error(`[ScraperService] Final Job Error:`, error);
            jobStore.setJob(jobId, {
                jobId,
                status: 'failed',
                progress: 100,
                error: error.message
            });
            io.emit(`job_update_${jobId}`, { status: 'failed', error: error.message });
            if (page) await page.close();
        }
    }
}

export default new ScraperService();
