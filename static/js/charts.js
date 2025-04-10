/**
 * Creates a nutrition chart for a recipe
 * @param {string} canvasId - The ID of the canvas element for the chart
 * @param {Array} nutrients - Array of nutrient objects from the Spoonacular API
 */
function createNutritionChart(canvasId, nutrients) {
    // Find the macro nutrients
    const calories = nutrients.find(n => n.name === 'Calories');
    const protein = nutrients.find(n => n.name === 'Protein');
    const fat = nutrients.find(n => n.name === 'Fat');
    const carbs = nutrients.find(n => n.name === 'Carbohydrates');
    
    // Skip if we don't have the necessary nutrients
    if (!protein || !fat || !carbs) {
        console.error('Missing required nutrients for chart');
        return;
    }
    
    // Calculate percentage of calories from each macronutrient
    // Protein: 4 calories per gram
    // Carbs: 4 calories per gram
    // Fat: 9 calories per gram
    const proteinCalories = protein.amount * 4;
    const carbsCalories = carbs.amount * 4;
    const fatCalories = fat.amount * 9;
    
    // Create the chart
    const ctx = document.getElementById(canvasId).getContext('2d');
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Protein', 'Carbs', 'Fat'],
            datasets: [{
                data: [proteinCalories, carbsCalories, fatCalories],
                backgroundColor: [
                    '#4CAF50', // Green for protein
                    '#FFC107', // Amber for carbs
                    '#FF5722'  // Deep orange for fat
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${percentage}% (${Math.round(value)} cal)`;
                        }
                    }
                }
            }
        }
    });
}
