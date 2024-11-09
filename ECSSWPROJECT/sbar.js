document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const loading = document.getElementById('loading');
    const noResults = document.getElementById('noResults');
    let searchTimeout;

    // Search input handler with debouncing
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            searchResults.innerHTML = '';
            return;
        }

        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 500);
    });

    // Form submit handler
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            performSearch(query);
        }
    });

    async function performSearch(query) {
        try {
            showLoading(true);
            const results = await FoodService.searchFood(query);
            displayResults(results);
        } catch (error) {
            showError('An error occurred while searching. Please try again.');
        } finally {
            showLoading(false);
        }
    }

    function displayResults(results) {
        searchResults.innerHTML = '';
        noResults.classList.toggle('d-none', results.length > 0);

        if (results.length === 0) {
            return;
        }

        const resultsHTML = results.map(food => `
            <div class="food-item card mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        ${food.image ? `
                            <div class="col-md-2">
                                <img src="${food.image}" alt="${food.name}" class="img-fluid rounded">
                            </div>
                        ` : ''}
                        <div class="col">
                            <h3 class="h5 mb-2">${food.name}</h3>
                            <p class="mb-2"><small class="text-muted">${food.category}</small></p>
                            <div class="nutrition-overview">
                                <span class="badge bg-primary me-2">Calories: ${Math.round(food.nutrients.calories)}</span>
                                <span class="badge bg-success me-2">Protein: ${Math.round(food.nutrients.protein)}g</span>
                                <span class="badge bg-info me-2">Carbs: ${Math.round(food.nutrients.carbs)}g</span>
                                <span class="badge bg-warning">Fat: ${Math.round(food.nutrients.fat)}g</span>
                            </div>
                            <button class="btn btn-outline-primary btn-sm mt-2" 
                                    onclick="showNutritionDetails('${food.id}')">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        searchResults.innerHTML = resultsHTML;
    }

    function showLoading(show) {
        loading.classList.toggle('d-none', !show);
        if (show) {
            searchResults.innerHTML = '';
            noResults.classList.add('d-none');
        }
    }

    function showError(message) {
        searchResults.innerHTML = `
            <div class="alert alert-danger" role="alert">
                ${message}
            </div>
        `;
    }

    // Add to window object for onclick handler
    window.showNutritionDetails = async (foodId) => {
        try {
            const nutritionInfo = await FoodService.getNutritionInfo(foodId);
            showNutritionModal(nutritionInfo);
        } catch (error) {
            showError('Error loading nutrition details.');
        }
    };

    function showNutritionModal(nutrition) {
        const modalHTML = `
            <div class="modal fade" id="nutritionModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Detailed Nutrition Information</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <h6>Calories: ${Math.round(nutrition.calories)}</h6>
                            <div class="nutrition-details">
                                ${Object.entries(nutrition.totalNutrients).map(([key, value]) => `
                                    <div class="nutrition-item">
                                        <span class="nutrient-name">${key}:</span>
                                        <span class="nutrient-value">
                                            ${value ? Math.round(value.quantity) + value.unit : 'N/A'}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('nutritionModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal to document
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('nutritionModal'));
        modal.show();
    }
});

// Add some CSS for the nutrition details
const style = document.createElement('style');
style.textContent = `
    .nutrition-details {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }

    .nutrition-item {
        padding: 0.5rem;
        border-radius: 4px;
        background-color: #f8f9fa;
    }

    .nutrient-name {
        font-weight: 500;
        color: #495057;
    }

    .nutrient-value {
        float: right;
        color: #6c757d;
    }
`;
document.head.appendChild(style);