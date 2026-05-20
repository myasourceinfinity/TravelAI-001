require('dotenv').config();
const { planTrip } = require('./controllers/tripController');
const openaiHelper = require('./utils/openaiHelper');

// 1. Create a highly realistic mock JSON object that perfectly matches the OpenAI schema
const mockOpenAiResponse = {
  summary: "I've crafted an unforgettable adventure through New Zealand's South Island just for you. You'll start in the adventure capital of Queenstown, head up to the geothermal wonders of Rotorua, and finally relax in beautiful Auckland.",
  destinations: [
    {
      id: "queenstown",
      name: "Queenstown",
      country: "New Zealand",
      lat: -45.0312,
      lng: 168.6626,
      emoji: "🏔️",
      highlights: ["Milford Sound Cruise", "Shotover Jet Boat", "Skyline Gondola"]
    },
    {
      id: "rotorua-taupo",
      name: "Rotorua",
      country: "New Zealand",
      lat: -38.1368,
      lng: 176.2497,
      emoji: "🌋",
      highlights: ["Wai-O-Tapu Thermal Wonderland", "Mitai Maori Village", "Redwoods Treewalk"]
    },
    {
      id: "auckland",
      name: "Auckland",
      country: "New Zealand",
      lat: -36.8485,
      lng: 174.7633,
      emoji: "⛵",
      highlights: ["Sky Tower", "Waiheke Island Wine Tour", "Auckland Harbour Bridge"]
    }
  ],
  suggestions: [
    { id: "christchurch", name: "Christchurch", country: "New Zealand", emoji: "🚋" },
    { id: "wellington", name: "Wellington", country: "New Zealand", emoji: "☕" }
  ],
  startCity: "Auckland",
  travelers: 2,
  days: 10,
  budgetLevel: "moderate"
};

// 2. Override the helper methods to force it to use our mock JSON object instead of hitting the real API
openaiHelper.isConfigured = () => true; 
openaiHelper.generateTripPlan = async () => mockOpenAiResponse;

// 3. Run the test
async function runTest() {
  console.log("🚀 Starting mock test with realistic JSON object...");
  
  const req = {
    user: { userId: 123 },
    body: { description: "Plan a trip to New Zealand" }
  };
  
  const res = {
    status: (code) => {
      console.log(`\nHTTP STATUS: ${code}`);
      return res;
    },
    json: (data) => {
      console.log("\n✅ FINAL JSON RESPONSE SENT TO FRONTEND:\n");
      console.log(JSON.stringify(data, null, 2));
      return res;
    }
  };

  // This will trigger the controller, which will call our mocked OpenAI function,
  // then it will automatically call the Bookme scraper to attach the deals!
  await planTrip(req, res);
}

runTest();
