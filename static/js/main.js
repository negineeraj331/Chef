// General site-wide functionality
document.addEventListener('DOMContentLoaded', function() {
    // Enable tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Enable popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Handle form validation styles for all forms
    var forms = document.querySelectorAll('.needs-validation');
    
    Array.prototype.slice.call(forms).forEach(function (form) {
        form.addEventListener('submit', function (event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            form.classList.add('was-validated');
        }, false);
    });
    
    // Back to top button functionality
    var backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        window.onscroll = function() {
            if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
                backToTopBtn.style.display = "block";
            } else {
                backToTopBtn.style.display = "none";
            }
        };
        
        backToTopBtn.addEventListener('click', function() {
            document.body.scrollTop = 0; // For Safari
            document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
        });
    }
    
    // Shopping List Functionality
    const addToShoppingListBtn = document.getElementById('addToShoppingListBtn');
    const shoppingListCount = document.getElementById('shoppingListCount');
    
    // Update the shopping list count in navbar
    function updateShoppingListCount() {
        // Get from session storage first to avoid API call
        const shoppingList = sessionStorage.getItem('shopping_list_count');
        if (shoppingList && shoppingListCount) {
            const count = parseInt(shoppingList);
            if (count > 0) {
                shoppingListCount.textContent = count;
                shoppingListCount.style.display = 'inline-block';
            } else {
                shoppingListCount.style.display = 'none';
            }
            return;
        }

        // Fallback to API call if not in session storage
        fetch('/api/get-shopping-list')
            .then(response => response.json())
            .then(data => {
                // For handling both items array and aisles array
                const count = data.items ? data.items.length : 
                             (data.aisles ? data.aisles.reduce((total, aisle) => total + aisle.items.length, 0) : 0);
                
                // Store in session storage
                sessionStorage.setItem('shopping_list_count', count.toString());
                
                if (shoppingListCount) {
                    if (count > 0) {
                        shoppingListCount.textContent = count;
                        shoppingListCount.style.display = 'inline-block';
                    } else {
                        shoppingListCount.style.display = 'none';
                    }
                }
            })
            .catch(error => {
                console.error('Error updating shopping list count:', error);
            });
    }
    
    // Add to shopping list functionality
    if (addToShoppingListBtn) {
        addToShoppingListBtn.addEventListener('click', function() {
            const recipeId = this.getAttribute('data-recipe-id');
            const feedback = document.getElementById('shoppingListFeedback');
            
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
                    console.error('Error:', data.error);
                    return;
                }
                
                // Show feedback
                if (feedback) {
                    feedback.classList.remove('d-none');
                    setTimeout(() => {
                        feedback.classList.add('d-none');
                    }, 3000);
                }
                
                // Update shopping list count
                updateShoppingListCount();
            })
            .catch(error => {
                console.error('Error adding to shopping list:', error);
            });
        });
    }
    
    // Update shopping list count on page load
    if (shoppingListCount) {
        updateShoppingListCount();
    }
    
    // Enhanced Nutritional Information
    function enhanceNutritionVisuals() {
        const nutrientBars = document.querySelectorAll('.progress-bar');
        
        nutrientBars.forEach(bar => {
            const value = parseFloat(bar.getAttribute('aria-valuenow'));
            
            // Highlight high values for unhealthy nutrients
            if (bar.closest('.nutrient-item')) {
                const nutrientName = bar.closest('.nutrient-item').querySelector('.d-flex span:first-child').textContent;
                
                if (['Fat', 'Saturated Fat', 'Sodium', 'Cholesterol', 'Sugar'].includes(nutrientName)) {
                    if (value > 50) {
                        bar.classList.add('bg-danger');
                    } else if (value > 25) {
                        bar.classList.add('bg-warning');
                    }
                }
                
                // Highlight good values for healthy nutrients
                if (['Protein', 'Fiber', 'Vitamin'].includes(nutrientName) || nutrientName.startsWith('Vitamin')) {
                    if (value > 50) {
                        bar.classList.add('bg-success');
                    } else if (value > 25) {
                        bar.classList.add('bg-info');
                    }
                }
            }
        });
    }
    
    // Call enhanceNutritionVisuals if we're on a recipe page
    if (document.querySelector('.nutrient-item')) {
        enhanceNutritionVisuals();
    }
    
    // YouTube Video Integration
    const recipeVideoSection = document.getElementById('recipeVideoSection');
    if (recipeVideoSection) {
        const recipeTitle = document.querySelector('h1').textContent;
        
        fetch(`/api/recipe-videos/${encodeURIComponent(recipeTitle)}`)
            .then(response => response.json())
            .then(data => {
                if (data.error || !data.videos || data.videos.length === 0) {
                    recipeVideoSection.classList.add('d-none');
                    return;
                }
                
                const videoContainer = document.getElementById('recipeVideos');
                if (videoContainer) {
                    videoContainer.innerHTML = '';
                    
                    data.videos.forEach(video => {
                        const videoCard = document.createElement('div');
                        videoCard.className = 'col-md-4';
                        
                        videoCard.innerHTML = `
                            <div class="card h-100">
                                <div class="ratio ratio-16x9">
                                    <iframe src="https://www.youtube.com/embed/${video.youTubeId}" 
                                            title="${video.title}" allowfullscreen></iframe>
                                </div>
                                <div class="card-body">
                                    <h5 class="card-title">${video.title}</h5>
                                    <p class="text-muted small">${video.views} views</p>
                                </div>
                            </div>
                        `;
                        
                        videoContainer.appendChild(videoCard);
                    });
                    
                    recipeVideoSection.classList.remove('d-none');
                }
            })
            .catch(error => {
                console.error('Error loading videos:', error);
                recipeVideoSection.classList.add('d-none');
            });
    }
});
