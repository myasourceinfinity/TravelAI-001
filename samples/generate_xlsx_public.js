const path = require('path');
const xlsx = require('../server/node_modules/xlsx');

const headers = [
  'provider_id', 'provider_type', 'destination_name', 'package_name', 'package_type', 
  'travel_mode', 'summary', 'description', 'duration_days', 'duration_nights', 
  'base_price', 'currency_code', 'platform_service_fee_type', 'platform_service_fee_value', 
  'min_travelers', 'max_travelers', 'is_customizable', 'status', 'is_active'
];

const data = [
  [
    3, 'Agent', 'Queenstown', 'Queenstown Ski Explorer Package', 'leisure', 
    'flight', '5-day adventure in Queenstown', 'Skiing and Gondola ride with hotel included', 5, 4, 
    1500.00, 'NZD', 'fixed', 50.00, 
    1, 4, true, 'active', true
  ],
  [
    3, 'Agent', 'Rotorua', 'Rotorua Thermal Splendour', 'family', 
    'car', 'Relax in mud pools', 'Thermal springs family tour and spa inclusions', 3, 2, 
    650.00, 'NZD', 'percentage', 5.00, 
    2, 6, false, 'draft', true
  ]
];

const ws_data = [headers, ...data];
const wb = xlsx.utils.book_new();
const ws = xlsx.utils.aoa_to_sheet(ws_data);
xlsx.utils.book_append_sheet(wb, ws, "Packages");

const outPath = path.join(__dirname, '../client/public/samples/packages_sample.xlsx');
xlsx.writeFile(wb, outPath);
console.log('Successfully generated packages_sample.xlsx in public/samples!');
