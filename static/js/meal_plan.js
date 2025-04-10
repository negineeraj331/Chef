document.addEventListener('DOMContentLoaded', function() {
    const mealPlanForm = document.getElementById('mealPlanForm');
    const mealPlanContainer = document.getElementById('mealPlanContainer');
    const loadingOverlay = document.querySelector('.loading-overlay');
    const saveToShoppingListBtn = document.getElementById('saveToShoppingListBtn');
    const printMealPlanBtn = document.getElementById('printMealPlanBtn');
    const targetCalories = document.getElementById('targetCalories');
    const calorieValue = document.getElementById('calorieValue');
    const mealPlanResult = document.getElementById('mealPlanResult');
    
    // Update calorie value display
    if (targetCalories && calorieValue) {
        targetCalories.addEventListener('input', function() {
            calorieValue.textContent = `${this.value} cal`;
        });
    }
    
    // Event listener for form submission
    mealPlanForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const timeFrame = document.getElementById('timeFrame').value;
        const calories = targetCalories.value;
        const diet = document.getElementById('diet').value;
        const exclude = document.getElementById('exclude').value;
        
        // Quick meal filter options
        const quickMeals = document.getElementById('quickMeals').checked;
        const budgetFriendly = document.getElementById('budgetFriendly').checked;
        const familyFriendly = document.getElementById('familyFriendly').checked;
        
        let excludeArray = [];
        if (exclude.trim()) {
            excludeArray = exclude.split(',').map(item => item.trim());
        }
        
        if (quickMeals) excludeArray.push('time-consuming');
        if (budgetFriendly) excludeArray.push('expensive ingredients');
        if (familyFriendly) excludeArray.push('spicy');
        
        // Show loading overlay
        loadingOverlay.classList.remove('d-none');
        
        // Remove any previous error alerts
        const previousAlerts = document.querySelectorAll('.alert');
        previousAlerts.forEach(alert => alert.remove());
        
        // Call API to generate meal plan
        fetch('/api/meal-plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                timeFrame: timeFrame,
                targetCalories: calories,
                diet: diet,
                exclude: excludeArray.join(',')
            })
        })
        .then(response => response.json())
        .then(data => {
            // Hide loading overlay
            loadingOverlay.classList.add('d-none');
            
            if (data.error) {
                // Create and show error alert
                const errorAlert = document.createElement('div');
                errorAlert.className = 'alert alert-warning alert-dismissible fade show mb-4';
                errorAlert.setAttribute('role', 'alert');
                errorAlert.innerHTML = `
                    <i class="fas fa-exclamation-triangle me-2"></i> ${data.error}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                `;
                
                // Insert the alert at the top of the form
                mealPlanForm.parentNode.insertBefore(errorAlert, mealPlanForm);
                
                // Scroll to the error
                errorAlert.scrollIntoView({ behavior: 'smooth' });
                return;
            }
            
            // Display meal plan
            displayMealPlan(data, timeFrame);
            
            // Show result
            mealPlanResult.classList.remove('d-none');
            
            // Scroll to result
            mealPlanResult.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => {
            // Hide loading overlay
            loadingOverlay.classList.add('d-none');
            
            console.error('Error:', error);
            
            // Create and show error alert
            const errorAlert = document.createElement('div');
            errorAlert.className = 'alert alert-danger alert-dismissible fade show mb-4';
            errorAlert.setAttribute('role', 'alert');
            errorAlert.innerHTML = `
                <i class="fas fa-exclamation-circle me-2"></i> Failed to generate meal plan. Please try again later.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            
            // Insert the alert at the top of the form
            mealPlanForm.parentNode.insertBefore(errorAlert, mealPlanForm);
            
            // Scroll to the error
            errorAlert.scrollIntoView({ behavior: 'smooth' });
        });
    });
    
    // Display meal plan
    function displayMealPlan(data, timeFrame) {
        mealPlanContainer.innerHTML = '';
        
        if (timeFrame === 'day') {
            // Day meal plan
            if (data.meals && data.nutrients) {
                // Create a card for the nutrients
                const nutrientsCard = document.createElement('div');
                nutrientsCard.className = 'col-12 mb-4';
                nutrientsCard.innerHTML = `
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title mb-0">Daily Nutrition Summary</h3>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-3 mb-3">
                                    <div class="d-flex flex-column align-items-center">
                                        <div class="fs-1 fw-bold text-primary">${Math.round(data.nutrients.calories)}</div>
                                        <div class="text-muted">Calories</div>
                                    </div>
                                </div>
                                <div class="col-md-3 mb-3">
                                    <div class="d-flex flex-column align-items-center">
                                        <div class="fs-1 fw-bold text-success">${Math.round(data.nutrients.protein)}g</div>
                                        <div class="text-muted">Protein</div>
                                    </div>
                                </div>
                                <div class="col-md-3 mb-3">
                                    <div class="d-flex flex-column align-items-center">
                                        <div class="fs-1 fw-bold text-info">${Math.round(data.nutrients.carbohydrates)}g</div>
                                        <div class="text-muted">Carbs</div>
                                    </div>
                                </div>
                                <div class="col-md-3 mb-3">
                                    <div class="d-flex flex-column align-items-center">
                                        <div class="fs-1 fw-bold text-warning">${Math.round(data.nutrients.fat)}g</div>
                                        <div class="text-muted">Fat</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                mealPlanContainer.appendChild(nutrientsCard);
                
                // Create a heading for the meals
                const mealsHeading = document.createElement('div');
                mealsHeading.className = 'col-12 mb-3';
                mealsHeading.innerHTML = `<h3>Today's Meals</h3>`;
                mealPlanContainer.appendChild(mealsHeading);
                
                // Create a row for the meals
                const mealsRow = document.createElement('div');
                mealsRow.className = 'row g-4';
                mealPlanContainer.appendChild(mealsRow);
                
                // Add each meal
                data.meals.forEach(meal => {
                    const mealCard = createMealCard(meal);
                    const mealCol = document.createElement('div');
                    mealCol.className = 'col-md-4';
                    mealCol.appendChild(mealCard);
                    mealsRow.appendChild(mealCol);
                });
            }
        } else {
            // Week meal plan
            if (data.week) {
                const week = data.week;
                const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                
                daysOfWeek.forEach((day, index) => {
                    const dayKey = day.toLowerCase();
                    const dayData = week[dayKey];
                    
                    if (dayData) {
                        const dayCard = document.createElement('div');
                        dayCard.className = 'col-12 mb-4';
                        dayCard.innerHTML = `
                            <div class="card">
                                <div class="card-header">
                                    <h3 class="card-title mb-0">${day}</h3>
                                    <div class="d-flex justify-content-between mt-2">
                                        <span class="badge bg-primary">Calories: ${Math.round(dayData.nutrients.calories)}</span>
                                        <span class="badge bg-success">Protein: ${Math.round(dayData.nutrients.protein)}g</span>
                                        <span class="badge bg-info">Carbs: ${Math.round(dayData.nutrients.carbohydrates)}g</span>
                                        <span class="badge bg-warning">Fat: ${Math.round(dayData.nutrients.fat)}g</span>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <div class="row g-4" id="day-${index}"></div>
                                </div>
                            </div>
                        `;
                        mealPlanContainer.appendChild(dayCard);
                        
                        const dayMealsContainer = document.getElementById(`day-${index}`);
                        dayData.meals.forEach(meal => {
                            const mealCard = createMealCard(meal);
                            const mealCol = document.createElement('div');
                            mealCol.className = 'col-md-4';
                            mealCol.appendChild(mealCard);
                            dayMealsContainer.appendChild(mealCol);
                        });
                    }
                });
            }
        }
    }
    
    // Create a meal card
    function createMealCard(meal) {
        const card = document.createElement('div');
        card.className = 'card h-100 meal-card';
        card.dataset.recipeId = meal.id;
        
        let imageUrl = meal.image;
        if (!imageUrl) {
            // If no image, use a placeholder
            imageUrl = 'https://via.placeholder.com/300x200?text=No+Image+Available';
        } else if (!imageUrl.startsWith('http')) {
            // If relative URL, prefix with base URL
            imageUrl = `https://spoonacular.com/recipeImages/${imageUrl}`;
        }
        
        card.innerHTML = `
            <img src="${imageUrl}" class="card-img-top" alt="${meal.title}" style="height: 140px; object-fit: cover;">
            <div class="card-body">
                <h5 class="card-title">${meal.title}</h5>
                ${meal.readyInMinutes ? `<p class="card-text small mb-0">Ready in ${meal.readyInMinutes} minutes</p>` : ''}
                ${meal.servings ? `<p class="card-text small">${meal.servings} servings</p>` : ''}
            </div>
            <div class="card-footer bg-transparent d-flex justify-content-between">
                <a href="/recipe/${meal.id}" class="btn btn-sm btn-outline-primary">
                    <i class="fas fa-eye"></i> View Recipe
                </a>
                <button class="btn btn-sm btn-outline-success add-to-shopping-list" data-recipe-id="${meal.id}">
                    <i class="fas fa-cart-plus"></i>
                </button>
            </div>
        `;
        
        // Add event listener to the "Add to Shopping List" button
        const addButton = card.querySelector('.add-to-shopping-list');
        if (addButton) {
            addButton.addEventListener('click', function() {
                const recipeId = this.getAttribute('data-recipe-id');
                
                // Call API to add recipe to shopping list
                fetch('/api/add-to-shopping-list', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        recipe_id: recipeId
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        alert(`Error: ${data.error}`);
                        return;
                    }
                    
                    // Show success message
                    this.innerHTML = '<i class="fas fa-check"></i>';
                    this.classList.remove('btn-outline-success');
                    this.classList.add('btn-success');
                    this.disabled = true;
                    
                    // Update shopping list count in navbar if the function exists
                    if (typeof updateShoppingListCount === 'function') {
                        updateShoppingListCount();
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Failed to add recipe to shopping list. Please try again.');
                });
            });
        }
        
        return card;
    }
    
    // Handle "Save to Shopping List" button
    if (saveToShoppingListBtn) {
        saveToShoppingListBtn.addEventListener('click', function() {
            // Get all recipe IDs from meal plan
            const recipeIds = Array.from(mealPlanContainer.querySelectorAll('.add-to-shopping-list'))
                .map(button => button.getAttribute('data-recipe-id'));
            
            if (recipeIds.length === 0) {
                alert('No recipes in the meal plan.');
                return;
            }
            
            // Show loading overlay
            loadingOverlay.classList.remove('d-none');
            
            // Call API for each recipe
            const promises = recipeIds.map(recipeId => 
                fetch('/api/add-to-shopping-list', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        recipe_id: recipeId
                    })
                }).then(response => response.json())
            );
            
            Promise.all(promises)
                .then(results => {
                    // Hide loading overlay
                    loadingOverlay.classList.add('d-none');
                    
                    // Check if all were successful
                    const errors = results.filter(result => result.error);
                    if (errors.length > 0) {
                        alert(`Some recipes could not be added (${errors.length} errors). Please try again.`);
                    } else {
                        alert('All recipes added to shopping list successfully!');
                        
                        // Update the buttons
                        mealPlanContainer.querySelectorAll('.add-to-shopping-list').forEach(button => {
                            button.innerHTML = '<i class="fas fa-check"></i>';
                            button.classList.remove('btn-outline-success');
                            button.classList.add('btn-success');
                            button.disabled = true;
                        });
                    }
                    
                    // Update shopping list count in navbar if the function exists
                    if (typeof updateShoppingListCount === 'function') {
                        updateShoppingListCount();
                    }
                })
                .catch(error => {
                    // Hide loading overlay
                    loadingOverlay.classList.add('d-none');
                    
                    console.error('Error:', error);
                    alert('Failed to add recipes to shopping list. Please try again.');
                });
        });
    }
    
    // Handle print button
    if (printMealPlanBtn) {
        printMealPlanBtn.addEventListener('click', function() {
            window.print();
        });
    }
});
