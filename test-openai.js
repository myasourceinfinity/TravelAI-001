require('dotenv').config();
const { generateTripPlan } = require('./server/utils/openaiHelper');

async function test() {
  try {
    const plan = await generateTripPlan('Plan a trip to Europe for 2 persons with 5000 NZD budget and 10 days schedule.');
    console.log('Success:', JSON.stringify(plan, null, 2));
  } catch (err) {
    console.error('Error occurred:', err);
  }
}

test();
