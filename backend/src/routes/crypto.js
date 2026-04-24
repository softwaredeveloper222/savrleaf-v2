import { Router } from 'express';

const router = Router();

let cache = { data: null, ts: 0 };
const CACHE_TTL = 60_000;
const STALE_TTL = 10 * 60_000;

router.get('/prices', async (_req, res) => {
  if (cache.data && Date.now() - cache.ts < CACHE_TTL) {
    return res.json(cache.data);
  }

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SavrLeaf/1.0',
        },
      }
    );

    if (!response.ok) {
      console.error(`CoinGecko returned ${response.status}: ${response.statusText}`);
      if (cache.data && Date.now() - cache.ts < STALE_TTL) {
        return res.json(cache.data);
      }
      return res.status(502).json({ success: false, message: 'Upstream rate-limited or unavailable' });
    }

    const raw = await response.json();

    if (!raw.bitcoin?.usd || !raw.ethereum?.usd) {
      console.error('CoinGecko unexpected body:', JSON.stringify(raw).slice(0, 300));
      if (cache.data && Date.now() - cache.ts < STALE_TTL) {
        return res.json(cache.data);
      }
      return res.status(502).json({ success: false, message: 'Upstream data unavailable' });
    }

    const payload = {
      success: true,
      btc: { price: raw.bitcoin.usd, change: raw.bitcoin.usd_24h_change ?? 0 },
      eth: { price: raw.ethereum.usd, change: raw.ethereum.usd_24h_change ?? 0 },
    };

    cache = { data: payload, ts: Date.now() };
    res.json(payload);
  } catch (err) {
    console.error('Crypto proxy fetch failed:', err);
    if (cache.data && Date.now() - cache.ts < STALE_TTL) {
      return res.json(cache.data);
    }
    res.status(502).json({ success: false, message: 'Failed to fetch crypto prices' });
  }
});

export default router;
