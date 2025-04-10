// Theme Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    const themeToggleBtn = document.getElementById('themeToggle');
    const themeIcon = themeToggleBtn.querySelector('i');
    
    // Check for saved theme preference or default to 'light'
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // Apply the saved theme
    applyTheme(savedTheme);
    
    // Update the toggle button icon
    updateThemeToggleIcon(savedTheme);
    
    // Add click event listener to the theme toggle button
    themeToggleBtn.addEventListener('click', function() {
        // Get the current theme
        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        
        // Toggle the theme
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // Apply the new theme with transition effect
        applyTheme(newTheme);
        
        // Update the toggle button icon
        updateThemeToggleIcon(newTheme);
        
        // Save the theme preference
        localStorage.setItem('theme', newTheme);
        
        // Run additional theme-specific adjustments
        adjustThemeSpecifics(newTheme);
    });
    
    // Function to apply theme
    function applyTheme(theme) {
        // Add transition class to enable smooth transition
        document.body.classList.add('theme-transition');
        
        // Set the theme attribute
        document.documentElement.setAttribute('data-bs-theme', theme);
        
        // Remove transition class after transition completes
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 500); // Match this duration with the CSS transition duration
    }
    
    // Function to update theme toggle icon
    function updateThemeToggleIcon(theme) {
        if (theme === 'dark') {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
            themeToggleBtn.setAttribute('title', 'Switch to Light Mode');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
            themeToggleBtn.setAttribute('title', 'Switch to Dark Mode');
        }
    }
    
    // Function for additional theme-specific adjustments
    function adjustThemeSpecifics(theme) {
        // Adjust chart colors if charts exist
        if (typeof Chart !== 'undefined') {
            const charts = Chart.instances;
            for (let key in charts) {
                const chart = charts[key];
                if (chart.options.plugins && chart.options.plugins.colors) {
                    chart.options.plugins.colors.enabled = theme === 'dark';
                    chart.update();
                }
            }
        }
        
        // Adjust any other theme-specific elements
        const nutrientBars = document.querySelectorAll('.progress-bar');
        if (nutrientBars.length > 0) {
            if (theme === 'dark') {
                // Brighten colors slightly in dark mode for better contrast
                nutrientBars.forEach(bar => {
                    if (bar.classList.contains('bg-success')) {
                        bar.style.backgroundColor = '#2ecc71';
                    }
                    if (bar.classList.contains('bg-danger')) {
                        bar.style.backgroundColor = '#e74c3c';
                    }
                    if (bar.classList.contains('bg-warning')) {
                        bar.style.backgroundColor = '#f39c12';
                    }
                    if (bar.classList.contains('bg-info')) {
                        bar.style.backgroundColor = '#3498db';
                    }
                });
            } else {
                // Reset to default in light mode
                nutrientBars.forEach(bar => {
                    bar.style.backgroundColor = '';
                });
            }
        }
    }
    
    // Run theme specifics on initial load
    adjustThemeSpecifics(savedTheme);
});
