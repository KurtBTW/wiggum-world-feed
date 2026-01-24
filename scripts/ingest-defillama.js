require('dotenv').config();

async function main() {
  console.log('Importing modules...');
  
  const { ingestAllDeFiLlamaData } = require('../src/services/defillama');
  
  console.log('Starting DeFiLlama ingestion...');
  
  const results = await ingestAllDeFiLlamaData();
  
  console.log('Results:', results);
}

main()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
