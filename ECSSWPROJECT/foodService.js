// foodService.js
class FoodService {
    static async analyzeRecipe(recipeData) {
        try {
            const requestBody = {
                title: recipeData.title || '',
                ingr: recipeData.ingredients || [],
                url: recipeData.url || '',
                summary: recipeData.summary || '',
                yield: recipeData.yield || '',
                time: recipeData.time || '',
                img: recipeData.img || '',
                prep: recipeData.prep || []
            };

            const response = await fetch(`${EDAMAM_API_URL}/api/nutrition-details`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'app_id': EDAMAM_APP_ID,
                    'app_key': EDAMAM_APP_KEY
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            return this.processNutritionData(data);
        } catch (error) {
            console.error('Error analyzing recipe:', error);
            throw error;
        }
    }

    static processNutritionData(data) {
        return {
            recipeName: data.label,
            yield: data.yield,
            calories: data.calories,
            totalWeight: data.totalWeight,
            dietLabels: data.dietLabels || [],
            healthLabels: data.healthLabels || [],
            cautions: data.cautions || [],
            nutrients: this.processNutrients(data.totalNutrients),
            dailyValues: this.processNutrients(data.totalDaily),
            ingredients: data.ingredientLines || [],
            cuisineType: data.cuisineType || [],
            mealType: data.mealType || [],
            dishType: data.dishType || [],
            glycemicIndex: data.glycemicIndex,
            co2EmissionsClass: data.co2EmissionsClass
        };
    }

    static processNutrients(nutrientsData) {
        const processed = {};
        
        for (const [key, value] of Object.entries(nutrientsData)) {
            if (Array.isArray(value) && value.length > 0) {
                processed[key] = {
                    label: value[0].label,
                    quantity: value[0].quantity,
                    unit: value[0].unit
                };
            }
        }
        
        return processed;
    }
}

// sbar.js (Frontend Integration)
document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const loading = document.getElementById('loading');
    const noResults = document.getElementById('noResults');
    const errorMessage = document.getElementById('errorMessage');

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const ingredients = searchInput.value.trim().split('\n').filter(i => i);
        
        if (ingredients.length === 0) {
            showError('Please enter at least one ingredient');
            return;
        }

        try {
            showLoading(true);
            const recipeData = {
                title: "User Recipe",
                ingr: ingredients,
                yield: "1 serving"
            };

            const nutritionData = await FoodService.analyzeRecipe(recipeData);
            displayResults(nutritionData);
        } catch (error) {
            showError('Failed to analyze recipe. Please try again.');
        } finally {
            showLoading(false);
        }
    });

    function displayResults(nutrition) {
        searchResults.innerHTML = `
            <div class="nutrition-result card">
                <div class="card-header">
                    <h2 class="h4 mb-0">Nutrition Analysis</h2>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h3 class="h5">Basic Information</h3>
                            <ul class="list-unstyled">
                                <li><strong>Calories:</strong> ${Math.round(nutrition.calories)} kcal</li>
                                <li><strong>Yield:</strong> ${nutrition.yield} servings</li>
                                <li><strong>Total Weight:</strong> ${Math.round(nutrition.totalWeight)}g</li>
                            </ul>

                            ${nutrition.dietLabels.length > 0 ? `
                                <h4 class="h6">Diet Labels</h4>
                                <div class="mb-3">
                                    ${nutrition.dietLabels.map(label => 
                                        `<span class="badge bg-success me-2">${label}</span>`
                                    ).join('')}
                                </div>
                            ` : ''}

                            ${nutrition.healthLabels.length > 0 ? `
                                <h4 class="h6">Health Labels</h4>
                                <div class="mb-3">
                                    ${nutrition.healthLabels.map(label => 
                                        `<span class="badge bg-info me-2">${label}</span>`
                                    ).join('')}
                                </div>
                            ` : ''}
                        </div>

                        <div class="col-md-6">
                            <h3 class="h5">Nutrients</h3>
                            <div class="nutrients-grid">
                                ${Object.entries(nutrition.nutrients).map(([key, value]) => `
                                    <div class="nutrient-item">
                                        <span class="nutrient-label">${value.label}:</span>
                                        <span class="nutrient-value">
                                            ${Math.round(value.quantity)}${value.unit}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    ${nutrition.cautions.length > 0 ? `
                        <div class="mt-3">
                            <h4 class="h6">Cautions</h4>
                            <div class="cautions">
                                ${nutrition.cautions.map(caution => 
                                    `<span class="badge bg-warning text-dark me-2">${caution}</span>`
                                ).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${nutrition.co2EmissionsClass ? `
                        <div class="mt-3">
                            <h4 class="h6">Environmental Impact</h4>
                            <span class="badge bg-${getCO2ClassColor(nutrition.co2EmissionsClass)}">
                                CO2 Emissions Class: ${nutrition.co2EmissionsClass}
                            </span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    function getCO2ClassColor(co2Class) {
        const colors = {
            'A+': 'success',
            'A': 'success',
            'B': 'info',
            'C': 'warning',
            'D': 'warning',
            'E': 'danger'
        };
        return colors[co2Class] || 'secondary';
    }

    function showLoading(show) {
        loading.classList.toggle('d-none', !show);
        searchResults.innerHTML = '';
        errorMessage.classList.add('d-none');
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
        searchResults.innerHTML = '';
    }
});

// Add some CSS for better presentation
const style = document.createElement('style');
style.textContent = `
    .nutrients-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 0.5rem;
    }

    .nutrient-item {
        padding: 0.5rem;
        background-color: #f8f9fa;
        border-radius: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .nutrient-label {
        font-weight: 500;
        color: #495057;
    }

    .nutrient-value {
        color: #6c757d;
    }

    .nutrition-result {
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
`;
document.head.appendChild(style);