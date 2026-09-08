import React from 'react';

// ---------------------------------------------------------------------------
// Curated Unsplash photo IDs keyed by lowercase keywords.
// These are stable direct CDN URLs (no API key needed).
// ---------------------------------------------------------------------------
const PHOTO_MAP = [
  // Dubai landmarks
  { keys: ['burj khalifa'],           id: '1512453979798-5ea266f8880c' },
  { keys: ['dubai mall'],              id: '1518684079-3c830dcef090' },
  { keys: ['palm jumeirah'],           id: '1546412414-e1885259563a' },
  { keys: ['dubai frame'],             id: '1512632578888-169bbbc64f33' },
  { keys: ['dubai marina'],            id: '1580674684079-02fdb1ef03f7' },
  { keys: ['desert safari', 'desert'], id: '1509316785289-025f5b846b35' },
  { keys: ['global village'],          id: '1513635269975-59663e0ac1ad' },
  { keys: ['dubai creek'],             id: '1512632578888-169bbbc64f33' },
  { keys: ['miracle garden'],          id: '1561059488-b0d04f0d5c37' },
  // Paris
  { keys: ['eiffel tower'],            id: '1502602898657-3e91760cbb34' },
  { keys: ['louvre'],                  id: '1566127992631-137a642a90f4' },
  { keys: ['montmartre'],              id: '1551634979-2b11f8c946fe' },
  { keys: ['paris'],                   id: '1502602898657-3e91760cbb34' },
  // Rome / Italy
  { keys: ['colosseum', 'coliseum'],   id: '1552832230-c0197dd311b5' },
  { keys: ['vatican'],                 id: '1531572753322-ad063cecc140' },
  { keys: ['trevi fountain'],          id: '1525874684015-58379d421a52' },
  { keys: ['rome'],                    id: '1552832230-c0197dd311b5' },
  // Barcelona / Spain
  { keys: ['sagrada familia'],         id: '1539037116277-4db20889f2d4' },
  { keys: ['park guell'],              id: '1583422409516-2895a77efded' },
  { keys: ['la rambla', 'las ramblas'],id: '1464790719320-516ecd75af6c' },
  { keys: ['barcelona'],               id: '1539037116277-4db20889f2d4' },
  // London / UK
  { keys: ['big ben', 'tower of london', 'london eye', 'london'], id: '1513635269975-59663e0ac1ad' },
  // Amsterdam
  { keys: ['amsterdam', 'rijksmuseum', 'anne frank'],              id: '1467269204594-9661b134dd2b' },
  // Prague
  { keys: ['prague', 'charles bridge'],                            id: '1541849546-216549ae216d' },
  // Tokyo / Japan
  { keys: ['senso-ji', 'sensoji', 'asakusa'],                      id: '1540959733332-eab4deabeeaf' },
  { keys: ['shibuya'],                                             id: '1540959733332-eab4deabeeaf' },
  { keys: ['meiji'],                                               id: '1540959733332-eab4deabeeaf' },
  { keys: ['akihabara'],                                           id: '1540959733332-eab4deabeeaf' },
  { keys: ['tokyo'],                                               id: '1540959733332-eab4deabeeaf' },
  // Mt Fuji / Hakone
  { keys: ['mt. fuji', 'mount fuji', 'fuji'],                      id: '1490806843957-31f4c9a91c65' },
  { keys: ['lake ashi', 'hakone', 'hot spring'],                   id: '1490806843957-31f4c9a91c65' },
  { keys: ['matsumoto castle', 'japanese alps', 'takayama'],       id: '1540959733332-eab4deabeeaf' },
  // New Zealand
  { keys: ['sky tower', 'waiheke'],                                id: '1507699622108-4be3abd695ad' },
  { keys: ['auckland'],                                            id: '1507699622108-4be3abd695ad' },
  { keys: ['milford sound'],                                       id: '1609137144813-7d9921338f24' },
  { keys: ['shotover', 'skyline gondola', 'queenstown'],           id: '1609137144813-7d9921338f24' },
  { keys: ['te puia', 'geothermal', 'redwood', 'rotorua', 'maori'],id: '1561481654-39b1df7af6d1' },
  // Sydney / Australia
  { keys: ['opera house'],                                         id: '1523428096881-5bd79d043006' },
  { keys: ['harbour bridge', 'harbor bridge'],                     id: '1506973035872-a4ec16b8e8d9' },
  { keys: ['bondi beach'],                                         id: '1500948304999-5df8d29f4bc0' },
  { keys: ['sydney'],                                              id: '1506973035872-a4ec16b8e8d9' },
  // New York / USA
  { keys: ['times square'],                                        id: '1496442226666-8d4d0e62e6e9' },
  { keys: ['central park'],                                        id: '1444084316824-dc26d6657664' },
  { keys: ['statue of liberty'],                                   id: '1605130284535-11dd9eedc58a' },
  { keys: ['brooklyn bridge'],                                     id: '1496442226666-8d4d0e62e6e9' },
  { keys: ['new york', 'nyc'],                                     id: '1496442226666-8d4d0e62e6e9' },
  // Singapore
  { keys: ['gardens by the bay', 'marina bay sands', 'singapore'],id: '1525625293386-3f8f99389edd' },
  // Istanbul / Turkey
  { keys: ['hagia sophia', 'grand bazaar', 'istanbul'],            id: '1524231757912-21f4fe3a7200' },
  // Bangkok / Thailand
  { keys: ['bangkok', 'grand palace', 'wat phra', 'chatuchak'],    id: '1508009603885-50cf7c8dd0d5' },
  // Bali / Indonesia
  { keys: ['ubud', 'tanah lot', 'tegallalang', 'bali'],            id: '1537996194471-e657df975ab4' },
  // Maldives
  { keys: ['maldives', 'maldive'],                                 id: '1514282401047-d79a71a590e8' },
  // Generic categories
  { keys: ['beach', 'island'],                                     id: '1507525428034-b723cf961d3e' },
  { keys: ['mountain', 'alps', 'hiking'],                          id: '1454496522488-7835249ef2ea' },
  { keys: ['castle', 'palace'],                                    id: '1467269204594-9661b134dd2b' },
  { keys: ['museum', 'gallery'],                                   id: '1566127992631-137a642a90f4' },
  { keys: ['temple', 'shrine'],                                    id: '1540959733332-eab4deabeeaf' },
];

const FALLBACK_PHOTOS = [
  '1507525428034-b723cf961d3e',
  '1476514525405-309f5ff90f99',
  '1488646953014-85cb44e25828',
  '1500530855697-b586d89ba3ee',
  '1469474968028-56623f02e42e',
];

function resolveImage(name = '') {
  const lower = (name || '').toLowerCase();
  for (const entry of PHOTO_MAP) {
    if (entry.keys.some(k => lower.includes(k))) {
      return `https://images.unsplash.com/photo-${entry.id}?auto=format&fit=crop&w=600&q=80`;
    }
  }
  // Deterministic fallback — same card always gets the same image
  const idx = Math.abs([...lower].reduce((a, c) => a + c.charCodeAt(0), 0)) % FALLBACK_PHOTOS.length;
  return `https://images.unsplash.com/photo-${FALLBACK_PHOTOS[idx]}?auto=format&fit=crop&w=600&q=80`;
}

function handleImgError(e) {
  // If Unsplash CDN fails, show a gradient placeholder instead of a broken image
  e.currentTarget.style.display = 'none';
  e.currentTarget.parentElement.style.background =
    'linear-gradient(135deg, #3730a3 0%, #6366f1 50%, #818cf8 100%)';
}

export default function PopularDestinationsCarousel({
  popularDestinations = [],
  loading = false,
  scrollRef,
  onScrollLeft,
  onScrollRight,
  onDestinationClick,
  // getDestinationImage is accepted for backward-compat; internal resolver used as fallback
  getDestinationImage,
}) {
  return (
    <div className="traveller-popular-carousel">
      <button
        type="button"
        className="traveller-popular-arrow traveller-popular-arrow-left"
        onClick={onScrollLeft}
        aria-label="Scroll popular destinations left"
      >
        ‹
      </button>

      {loading ? (
        <div className="traveller-popular-empty">Loading popular destinations...</div>
      ) : popularDestinations.length === 0 ? (
        <div className="traveller-popular-empty">
          Popular destinations will appear as travellers complete AI searches.
        </div>
      ) : (
        <div className="traveller-popular-deck" ref={scrollRef}>
          {popularDestinations.map((destination, index) => {
            const imgSrc = getDestinationImage
              ? getDestinationImage(destination)
              : resolveImage(destination.name);

            return (
              <button
                key={destination.name || index}
                type="button"
                className="traveller-popular-card"
                onClick={() => onDestinationClick(destination)}
                aria-label={`Plan a trip to ${destination.name}`}
              >
                <img
                  className="traveller-popular-image"
                  src={imgSrc}
                  alt={destination.name}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  onError={handleImgError}
                />
                <div className="traveller-popular-content">
                  <div className="home-dest-details">
                    <span className="home-dest-name">{destination.name}</span>
                    <span className="home-dest-country">
                      {destination.subtitle || 'Trending with TravelAI'}
                    </span>
                  </div>
                  <span className="traveller-popular-action">
                    Explore attraction
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        className="traveller-popular-arrow traveller-popular-arrow-right"
        onClick={onScrollRight}
        aria-label="Scroll popular destinations right"
      >
        ›
      </button>
    </div>
  );
}
