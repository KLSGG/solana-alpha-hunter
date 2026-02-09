const fs = require('fs');
const modelsData = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const freeModels = [];
const lowCostModels = [];

for (const model of modelsData.data) {
  const promptPrice = parseFloat(model.pricing.prompt);
  const completionPrice = parseFloat(model.pricing.completion);

  if (promptPrice === 0 && completionPrice === 0) {
    freeModels.push({
      id: model.id,
      name: model.name,
      description: model.description,
      context_length: model.context_length
    });
  } else if (promptPrice !== 0 || completionPrice !== 0) {
    // Calculate cost for 1 million tokens (example)
    const costPerMillionPrompt = promptPrice * 1000000;
    const costPerMillionCompletion = completionPrice * 1000000;

    // A rough estimate for "around $1" for 1 million tokens combined
    if (costPerMillionPrompt + costPerMillionCompletion <= 1) { // total cost less than or equal to $1 for 1 million tokens
      lowCostModels.push({
        id: model.id,
        name: model.name,
        description: model.description,
        context_length: model.context_length,
        prompt_cost_per_million: costPerMillionPrompt,
        completion_cost_per_million: costPerMillionCompletion
      });
    }
  }
}

console.log("Free Models:", JSON.stringify(freeModels, null, 2));
console.log("Low Cost Models:", JSON.stringify(lowCostModels, null, 2));