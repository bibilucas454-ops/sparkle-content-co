
export interface MusicSuggestion {
  track: string;
  artist: string;
  source: 'TikTok Creative Center' | 'Commercial Library' | 'Manual Trends';
  sourceUrl?: string;
  region?: string;
  trendScore?: number;
  commercialSafe: boolean;
  audioUrl?: string;
}

export interface MusicProvider {
  name: string;
  suggest(region?: string): Promise<MusicSuggestion[]>;
}

// 1. Creative Center Provider (Stub)
// In a real scenario, this would potentially call an edge function that scrapes or uses an unofficial API
const creativeCenterProvider: MusicProvider = {
  name: "TikTok Creative Center",
  async suggest(region = "BR") {
    // Current viral tracks based on recent data snapshots
    return [
      {
        track: "Espresso",
        artist: "Sabrina Carpenter",
        source: "TikTok Creative Center",
        region,
        trendScore: 98,
        commercialSafe: false,
        audioUrl: "https://www.tiktok.com/music/Espresso-73560243460"
      },
      {
        track: "Magnetic",
        artist: "ILLIT",
        source: "TikTok Creative Center",
        region,
        trendScore: 95,
        commercialSafe: false,
      }
    ];
  }
};

// 2. Commercial Music Library Provider (Stub)
// Safe for business accounts
const commercialMusicLibraryProvider: MusicProvider = {
  name: "Commercial Library",
  async suggest() {
    return [
      {
        track: "Upbeat Corporate",
        artist: "AudioCoffee",
        source: "Commercial Library",
        trendScore: 80,
        commercialSafe: true,
      },
      {
        track: "Summer Vibes (Lofi)",
        artist: "StreamBeats",
        source: "Commercial Library",
        trendScore: 85,
        commercialSafe: true,
      }
    ];
  }
};

// 3. Manual Fallback Provider
// High-confidence trends curated by the team
const manualFallbackProvider: MusicProvider = {
  name: "Manual Trends",
  async suggest() {
    return [
      {
        track: "Million Dollar Baby",
        artist: "Tommy Richman",
        source: "Manual Trends",
        trendScore: 99,
        commercialSafe: false,
      },
      {
        track: "Not Like Us",
        artist: "Kendrick Lamar",
        source: "Manual Trends",
        trendScore: 97,
        commercialSafe: false,
      }
    ];
  }
};

const providers: MusicProvider[] = [
  creativeCenterProvider,
  commercialMusicLibraryProvider,
  manualFallbackProvider
];

export async function getViralMusicSuggestions(region = "BR"): Promise<MusicSuggestion[]> {
  try {
    const results = await Promise.all(
      providers.map(p => p.suggest(region).catch(err => {
        console.error(`Provider ${p.name} failed:`, err);
        return [];
      }))
    );
    // Flatten and sort by trend score (descending)
    return results.flat().sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0));
  } catch (err) {
    console.error("Critical error fetching music suggestions:", err);
    return [];
  }
}
