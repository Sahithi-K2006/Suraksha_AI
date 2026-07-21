// Sample Bengaluru-area localities used to simulate an approximate
// IP-based location for demo purposes (no real geolocation is requested).
export const REGIONS = [
  { name: 'Koramangala', lat: 12.9352, lng: 77.6245 },
  { name: 'Indiranagar', lat: 12.9719, lng: 77.6412 },
  { name: 'Whitefield', lat: 12.9698, lng: 77.7500 },
  { name: 'HSR Layout', lat: 12.9121, lng: 77.6446 },
  { name: 'Electronic City', lat: 12.8452, lng: 77.6602 },
  { name: 'Jayanagar', lat: 12.9308, lng: 77.5838 },
  { name: 'Malleshwaram', lat: 13.0027, lng: 77.5646 },
  { name: 'Marathahalli', lat: 12.9569, lng: 77.7011 },
  { name: 'Yelahanka', lat: 13.1007, lng: 77.5963 },
  { name: 'Banashankari', lat: 12.9250, lng: 77.5460 },
];

let sessionRegion = null;

// Keep one simulated region stable for the whole session so a user's own
// submissions cluster together, like a real IP-based location would.
export function getSimulatedRegion() {
  if (!sessionRegion) {
    sessionRegion = REGIONS[Math.floor(Math.random() * REGIONS.length)];
  }
  return {
    region: sessionRegion.name,
    latitude: sessionRegion.lat + (Math.random() - 0.5) * 0.01,
    longitude: sessionRegion.lng + (Math.random() - 0.5) * 0.01,
  };
}
