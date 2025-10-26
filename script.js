// Multi-API Dashboard - Discovery Challenge
// Explore API authentication, integration patterns, and data orchestration!

// API Configuration - Study these endpoint patterns
const API_ENDPOINTS = {
    superhero: 'https://superheroapi.com/api',
    nasa: 'https://api.nasa.gov',
    giphy: 'https://api.giphy.com/v1/gifs',
    tmdb: 'https://api.themoviedb.org/3'
};

// Global state
let currentPanel = 'nasa';
let apiKeys = {
    superhero: '',
    // Get your free key at https://api.nasa.gov/ (1000 requests/hour vs DEMO_KEY's 30/hour)
    // Replace 'DEMO_KEY' below with your personal key once you get it
    nasa: 'DEMO_KEY',
    giphy: '',
    tmdb: ''
};

// DOM Elements
const apiTabs = document.querySelectorAll('.api-tab');
const apiPanels = document.querySelectorAll('.api-panel');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingMessage = document.getElementById('loadingMessage');
const errorToast = document.getElementById('errorToast');
const errorMessage = document.getElementById('errorMessage');
const configStatus = document.getElementById('configStatus');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupTabNavigation();
    loadSavedKeys();
    updateConfigStatus();
    setTodaysDate();
    // Default to NASA panel for this exercise
    switchToPanel('nasa');
});

// Tab Navigation
function setupTabNavigation() {
    apiTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const apiName = tab.dataset.api;
            switchToPanel(apiName);
        });
    });
}

function switchToPanel(panelName) {
    // Update tabs
    apiTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.api === panelName) {
            tab.classList.add('active');
        }
    });

    // Update panels
    apiPanels.forEach(panel => {
        panel.classList.remove('active');
        if (panel.id === `${panelName}-panel`) {
            panel.classList.add('active');
        }
    });

    currentPanel = panelName;
}

// API Key Management
function loadSavedKeys() {
    // Load API keys from localStorage
    const saved = localStorage.getItem('multiapi-keys');
    if (saved) {
        const parsed = JSON.parse(saved);
        apiKeys = { ...apiKeys, ...parsed };
    } else {
        // Persist defaults (including hardcoded NASA key) on first run
        localStorage.setItem('multiapi-keys', JSON.stringify(apiKeys));
    }

    // Populate the input fields from current apiKeys
    document.getElementById('superheroKey').value = apiKeys.superhero;
    document.getElementById('nasaKey').value = apiKeys.nasa;
    document.getElementById('giphyKey').value = apiKeys.giphy;
    document.getElementById('tmdbKey').value = apiKeys.tmdb;
}

function saveKeys() {
    // Save current API keys to localStorage
    apiKeys.superhero = document.getElementById('superheroKey').value;
    apiKeys.nasa = document.getElementById('nasaKey').value || 'DEMO_KEY';
    apiKeys.giphy = document.getElementById('giphyKey').value;
    apiKeys.tmdb = document.getElementById('tmdbKey').value;

    localStorage.setItem('multiapi-keys', JSON.stringify(apiKeys));
    updateConfigStatus();
}

function updateConfigStatus() {
    const configured = Object.values(apiKeys).filter(key => key && key !== '').length;
    const total = Object.keys(apiKeys).length;

    configStatus.innerHTML = `
        <p>API Configuration: ${configured}/${total} APIs configured</p>
        <div style="background: #e2e8f0; border-radius: 4px; height: 8px; margin-top: 0.5rem;">
            <div style="background: #48bb78; height: 100%; width: ${(configured/total)*100}%; border-radius: 4px; transition: width 0.3s ease;"></div>
        </div>
    `;
}

// Utility Functions
function showLoading(message = 'Loading API data...') {
    loadingMessage.textContent = message;
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    errorToast.classList.remove('hidden');
    setTimeout(() => hideErrorToast(), 5000);
}

function hideErrorToast() {
    errorToast.classList.add('hidden');
}

function setTodaysDate() {
    const today = new Date().toISOString().split('T')[0];
    const el = document.getElementById('nasaDate');
    el.value = today;
    el.setAttribute('max', today);
}

// SECURITY BEST PRACTICES (for learning/demo only)
// - Why protect API keys? Keys grant access to your quota and data. If exposed in client code,
//   anyone can copy them, causing abuse, quota drain, or unexpected charges.
// - If someone steals your key: they can make requests as you, hit rate limits, and potentially
//   get your key revoked. Always rotate compromised keys.
// - Real-world solution to hide keys: never ship keys to the browser. Put them on a backend
//   (serverless function or server) and have your frontend call your backend, which then calls
//   the third-party API with the secret. Optionally add caching and additional auth/ratelimiting.
// - Note: This project stores keys in localStorage for convenience in a local demo only.
//   Do not do this in production.
//
// Security helpers
function validateApiKey(key, { allowDemo = false } = {}) {
    if (!key) throw new Error('API key is required');
    if (!allowDemo && key === 'DEMO_KEY') throw new Error('Replace DEMO_KEY with your NASA API key');
    if (key.length < 4) throw new Error('API key appears to be too short');
    return true;
}

class APIRateLimiter {
    constructor(maxRequests = 60, timeWindow = 60000) {
        this.requests = [];
        this.maxRequests = maxRequests;
        this.timeWindow = timeWindow;
    }
    canMakeRequest() {
        const now = Date.now();
        this.requests = this.requests.filter(t => now - t < this.timeWindow);
        if (this.requests.length >= this.maxRequests) return false;
        this.requests.push(now);
        return true;
    }
}

const rateLimiter = new APIRateLimiter(30, 60000);

async function makeSecureAPICall(url) {
    const res = await fetch(url);
    if (res.status === 401) { const e = new Error('Invalid API key. Please check your credentials.'); e.status = 401; throw e; }
    if (res.status === 429) { const e = new Error('Rate limit exceeded. Please wait before trying again.'); e.status = 429; throw e; }
    if (res.status === 403) { const e = new Error('Access forbidden. Check your API key permissions.'); e.status = 403; throw e; }
    if (!res.ok) {
        let details = '';
        try { details = await res.text(); } catch {}
        const e = new Error(`API error: ${res.status} ${res.statusText}${details ? ` - ${details}` : ''}`);
        e.status = res.status;
        throw e;
    }
    return res.json();
}

// DISCOVERY CHALLENGE 1: API Authentication Patterns
// Research Question: How do different APIs handle authentication?
// Goal: Implement API key-based authentication and validation

async function testSuperheroAPI() {
    const key = document.getElementById('superheroKey').value;
    if (!key) {
        showError('Please enter your Superhero API key first!');
        return;
    }

    try {
        // AUTHENTICATION RESEARCH:
        // 1. How do API keys work for authorization?
        // 2. Where do you typically place API keys in requests?
        // 3. How do you validate if an API key is working?
        // CONCEPT: API Security and Authentication
        // LEARNING GOAL: Understanding different authentication methods across APIs
        // DEBUGGING TIP: Invalid API keys usually return 401 Unauthorized status
        // WATCH OUT: Never expose API keys in client-side code in production

        // INVESTIGATION STEPS:
        // - Study the API_ENDPOINTS.superhero pattern
        // - Research superhero API documentation
        // - Experiment with the endpoint structure: /${key}/search/batman
        // - Learn about API response status codes
        // HINT: This API embeds the key directly in the URL path
        // Common mistake: Confusing path-based vs header-based authentication
        // Think about: What are the security implications of different auth methods?

        // YOUR DISCOVERY:
        // - Make a test request to verify the API key
        // - Handle success/failure appropriately
        // - Update the UI to show connection status
        // CONCEPT: API Health Checking
        // DEBUGGING TIP: Test with a simple, known endpoint first
        // UX PRINCIPLE: Always give users feedback about connection status

        // YOUR CODE HERE:

        console.log('🔐 CHALLENGE: Master API authentication patterns!');
        console.log('🔍 Research: API keys, authentication, status validation');
        console.log('💡 TIP: Try a simple search request to test your API key');
        showError('🚀 Auth challenge awaits! Implement testSuperheroAPI in script.js!');

    } catch (error) {
        console.error('Superhero API test failed:', error);
        showError('Superhero API test failed. Check your API key.');
    }
}

async function searchSuperhero() {
    const query = document.getElementById('superheroSearch').value.trim();
    if (!query) {
        showError('Please enter a superhero name to search!');
        return;
    }

    // SEARCH IMPLEMENTATION CHALLENGE:
    // 1. How do you build URLs with user input?
    // 2. What happens when searches return multiple results?
    // 3. How do you handle "no results found" scenarios?

    // RESEARCH OBJECTIVES:
    // - Learn URL construction with dynamic parameters
    // - Investigate search result data structures
    // - Discover result filtering and display strategies

    // YOUR CODE HERE:

    console.log('🔍 CHALLENGE: Build dynamic search functionality!');
    console.log('📊 Research: URL construction, search results, data presentation');
    showError('🎯 Search challenge ready! Implement searchSuperhero in script.js!');
}

async function getRandomSuperhero() {
    // RANDOMIZATION CHALLENGE:
    // 1. How do you generate random numbers within a specific range?
    // 2. What happens when you request an invalid superhero ID?
    // 3. How do you handle API endpoints that use IDs vs names?

    // RESEARCH EXPLORATION:
    // - Learn about the superhero API ID system (1-731)
    // - Investigate Math.random() for API usage
    // - Discover error handling for invalid IDs
    // - Compare ID-based vs search-based endpoints

    // YOUR CODE HERE:

    console.log('🎲 CHALLENGE: Master random data generation!');
    console.log('📊 Research: Random numbers, ID validation, endpoint patterns');
    showError('🧿 Random challenge ready! Implement getRandomSuperhero in script.js!');
}

// DISCOVERY CHALLENGE 2: Query Parameter Authentication
// Research Question: How do different APIs structure their requests?
// Goal: Master query parameter-based authentication and data fetching

async function testNASAAPI() {
    const key = (document.getElementById('nasaKey').value || 'DEMO_KEY').trim();

    try {
        validateApiKey(key, { allowDemo: true });
        if (!rateLimiter.canMakeRequest()) {
            showError('Rate limit reached. Please wait before making another request.');
            return;
        }
        showLoading('Testing NASA APOD...');
        const url = `${API_ENDPOINTS.nasa}/planetary/apod?api_key=${encodeURIComponent(key)}`;
        console.log('GET', url);
        const data = await makeSecureAPICall(url);
        console.log('NASA APOD test data:', data);
        displayNASAImage(data);
        hideLoading();
    } catch (error) {
        console.error('NASA API test failed:', error);
        hideLoading();
        showError(error.message || 'NASA API test failed. Using DEMO_KEY might have rate limits.');
    }
}

async function getNASAImage() {
    const date = document.getElementById('nasaDate').value;
    const key = (document.getElementById('nasaKey').value || 'DEMO_KEY').trim();

    if (!date) {
        showError('Please select a date!');
        return;
    }

    try {
        validateApiKey(key, { allowDemo: true });
        const today = new Date().toISOString().split('T')[0];
        if (date > today) {
            showError('Selected date is in the future. Please choose a valid date.');
            return;
        }
        if (!rateLimiter.canMakeRequest()) {
            showError('Rate limit reached. Please wait before making another request.');
            return;
        }
        showLoading('Fetching NASA image...');
        const url = `${API_ENDPOINTS.nasa}/planetary/apod?api_key=${encodeURIComponent(key)}&date=${encodeURIComponent(date)}`;
        console.log('GET', url);
        const data = await makeSecureAPICall(url);
        console.log('NASA APOD data:', data);
        displayNASAImage(data);
        hideLoading();
    } catch (error) {
        console.error('Error fetching NASA image:', error);
        // Fallback: if APOD not found (404), try up to 2 previous days
        if (error.status === 404 || (error.message || '').includes('404')) {
            try {
                let attempts = 0;
                let prev = new Date(date);
                while (attempts < 2) {
                    prev.setDate(prev.getDate() - 1);
                    const prevStr = prev.toISOString().split('T')[0];
                    showLoading(`Retrying ${prevStr}...`);
                    const fallbackUrl = `${API_ENDPOINTS.nasa}/planetary/apod?api_key=${encodeURIComponent(key)}&date=${encodeURIComponent(prevStr)}`;
                    console.log('GET (fallback)', fallbackUrl);
                    try {
                        const data2 = await makeSecureAPICall(fallbackUrl);
                        console.log('NASA APOD data (fallback):', data2);
                        displayNASAImage(data2);
                        hideLoading();
                        return;
                    } catch (inner) {
                        if (!(inner.status === 404 || (inner.message || '').includes('404'))) throw inner;
                        attempts++;
                        continue;
                    }
                }
            } catch (e2) {
                console.error('Fallback APOD fetch failed:', e2);
            }
        }
        hideLoading();
        showError(error.message || 'No image available for this date.');
    }
}

async function getTodaysNASAImage() {
    const key = (document.getElementById('nasaKey').value || 'DEMO_KEY').trim();
    try {
        validateApiKey(key, { allowDemo: true });
        if (!rateLimiter.canMakeRequest()) {
            showError('Rate limit reached. Please wait before making another request.');
            return;
        }
        showLoading("Fetching today's NASA image...");
        const url = `${API_ENDPOINTS.nasa}/planetary/apod?api_key=${encodeURIComponent(key)}`;
        const data = await makeSecureAPICall(url);
        console.log("Today's NASA APOD:", data);
        displayNASAImage(data);
        hideLoading();
    } catch (error) {
        console.error('Error fetching today\'s NASA image:', error);
        // Fallback: try up to 2 previous days if 404
        if (error.status === 404 || (error.message || '').includes('404')) {
            try {
                let attempts = 0;
                let prev = new Date();
                while (attempts < 2) {
                    prev.setDate(prev.getDate() - 1);
                    const prevStr = prev.toISOString().split('T')[0];
                    showLoading(`Retrying ${prevStr}...`);
                    const fallbackUrl = `${API_ENDPOINTS.nasa}/planetary/apod?api_key=${encodeURIComponent(key)}&date=${encodeURIComponent(prevStr)}`;
                    console.log('GET (fallback)', fallbackUrl);
                    try {
                        const data2 = await makeSecureAPICall(fallbackUrl);
                        console.log(`NASA APOD ${prevStr}:`, data2);
                        displayNASAImage(data2);
                        hideLoading();
                        return;
                    } catch (inner) {
                        if (!(inner.status === 404 || (inner.message || '').includes('404'))) throw inner;
                        attempts++;
                        continue;
                    }
                }
            } catch (e2) {
                console.error('Fallback APOD today->previous days failed:', e2);
            }
        }
        hideLoading();
        showError(error.message || 'Could not fetch today\'s image.');
    }
}

async function getMarsPhotos() {
    const key = (document.getElementById('nasaKey').value || 'DEMO_KEY').trim();

    try {
        validateApiKey(key, { allowDemo: true });
        if (!rateLimiter.canMakeRequest()) {
            showError('Rate limit reached. Please wait before making another request.');
            return;
        }
        showLoading('Fetching Mars rover photos...');
        const url = `${API_ENDPOINTS.nasa}/mars-photos/api/v1/rovers/curiosity/photos?sol=1000&api_key=${encodeURIComponent(key)}&page=1`;
        console.log('GET', url);
        const data = await makeSecureAPICall(url);
        console.log('Mars photos:', data);
        const photos = data.photos?.slice(0, 12) || [];
        const results = document.getElementById('nasaResults');
        if (photos.length === 0) {
            results.innerHTML = '<p>No Mars photos available for this sol.</p>';
        } else {
            const photoHTML = photos.map(p => `
                <div class="mars-photo">
                    <img src="${p.img_src}" alt="Mars - ${p.camera?.full_name || ''}" class="card-image"/>
                    <div class="photo-meta">
                        <p><strong>Rover:</strong> ${p.rover?.name} | <strong>Camera:</strong> ${p.camera?.name}</p>
                        <p><strong>Earth Date:</strong> ${p.earth_date}</p>
                    </div>
                </div>
            `).join('');
            results.innerHTML = `
                <div>
                    <h3>🚀 Mars Rover Photos (Curiosity)</h3>
                    <div class="gif-grid">${photoHTML}</div>
                </div>
            `;
        }
        hideLoading();
    } catch (error) {
        console.error('Error fetching Mars photos:', error);
        hideLoading();
        showError(error.message || 'Could not fetch Mars photos.');
    }
}

// DISCOVERY CHALLENGE 3: Media API Integration
// Research Question: How do you handle media-rich API responses?
// Goal: Master media APIs and content filtering

async function testGiphyAPI() {
    const key = document.getElementById('giphyKey').value;
    if (!key) {
        showError('Please enter your GIPHY API key first!');
        return;
    }

    try {
        // MEDIA API EXPLORATION:
        // 1. How do media APIs differ from data APIs?
        // 2. What are query parameters like 'limit' used for?
        // 3. How do you handle large media file responses?
        // CONCEPT: Media Content APIs and Performance
        // LEARNING GOAL: Working with image/video APIs and optimization
        // DEBUGGING TIP: Check image URLs in browser to verify they work
        // WATCH OUT: Media files can be large - consider bandwidth and loading times

        // RESEARCH OBJECTIVES:
        // - Learn about content filtering and limits
        // - Investigate GIPHY's response data structure
        // - Discover different image quality options
        // - Explore rating/content filtering systems
        // HINT: GIPHY returns multiple image sizes - choose appropriate ones
        // Common mistake: Loading full-size GIFs when thumbnails would work
        // Think about: How does content filtering protect users and comply with policies?

        // YOUR DISCOVERY:
        // - Build the search endpoint with proper parameters
        // - Handle the GIPHY response format
        // - Implement content validation
        // CONCEPT: API Response Pagination and Limits
        // DEBUGGING TIP: Start with small limits to understand the data structure
        // UX PRINCIPLE: Limit results to prevent overwhelming users

        // YOUR CODE HERE:

        console.log('🎨 CHALLENGE: Master media API integration!');
        console.log('🗺 Research: Media APIs, content filtering, response handling');
        console.log('💡 TIP: Use limit parameter to control response size');
        showError('🎉 Media challenge awaits! Implement testGiphyAPI in script.js!');

    } catch (error) {
        console.error('GIPHY API test failed:', error);
        showError('GIPHY API test failed. Check your API key.');
    }
}

async function searchGIFs() {
    const query = document.getElementById('giphySearch').value.trim();
    const key = document.getElementById('giphyKey').value;

    if (!query) {
        showError('Please enter a search term for GIFs!');
        return;
    }

    if (!key) {
        showError('Please configure your GIPHY API key first!');
        return;
    }

    // TODO: Search for GIFs
    // Endpoint: `${API_ENDPOINTS.giphy}/search?api_key=${key}&q=${query}&limit=12&rating=g`

    console.log('TODO: Implement searchGIFs function');
    showError('searchGIFs function not implemented yet. Check script.js TODO 3!');
}

async function getTrendingGIFs() {
    // TODO: Get trending GIFs
    // Endpoint: `${API_ENDPOINTS.giphy}/trending?api_key=${key}&limit=12&rating=g`

    console.log('TODO: Implement getTrendingGIFs function');
    showError('getTrendingGIFs function not implemented yet. Check script.js TODO 3!');
}

async function getRandomGIF() {
    // TODO: Get a random GIF
    // Endpoint: `${API_ENDPOINTS.giphy}/random?api_key=${key}&rating=g`

    console.log('TODO: Implement getRandomGIF function');
    showError('getRandomGIF function not implemented yet. Check script.js TODO 3!');
}

// TODO 4: Complete TMDB (Movie) API Integration
async function testTMDBAPI() {
    const key = document.getElementById('tmdbKey').value;
    if (!key) {
        showError('Please enter your TMDB API key first!');
        return;
    }

    try {
        // TODO: Test TMDB API
        // Endpoint: `${API_ENDPOINTS.tmdb}/movie/popular?api_key=${key}&page=1`

        console.log('TODO: Implement testTMDBAPI function');
        showError('testTMDBAPI function not implemented yet. Check script.js TODO 4!');

    } catch (error) {
        console.error('TMDB API test failed:', error);
        showError('TMDB API test failed. Check your API key.');
    }
}

async function searchMovies() {
    const query = document.getElementById('tmdbSearch').value.trim();
    const key = document.getElementById('tmdbKey').value;

    if (!query) {
        showError('Please enter a movie title to search!');
        return;
    }

    if (!key) {
        showError('Please configure your TMDB API key first!');
        return;
    }

    // TODO: Search for movies
    // Endpoint: `${API_ENDPOINTS.tmdb}/search/movie?api_key=${key}&query=${query}`

    console.log('TODO: Implement searchMovies function');
    showError('searchMovies function not implemented yet. Check script.js TODO 4!');
}

async function getPopularMovies() {
    // TODO: Get popular movies
    // Endpoint: `${API_ENDPOINTS.tmdb}/movie/popular?api_key=${key}&page=1`

    console.log('TODO: Implement getPopularMovies function');
    showError('getPopularMovies function not implemented yet. Check script.js TODO 4!');
}

async function getNowPlaying() {
    // TODO: Get now playing movies
    // Endpoint: `${API_ENDPOINTS.tmdb}/movie/now_playing?api_key=${key}&page=1`

    console.log('TODO: Implement getNowPlaying function');
    showError('getNowPlaying function not implemented yet. Check script.js TODO 4!');
}

// TODO 5: Complete Multi-API Dashboard Features
async function createRandomDashboard() {
    showLoading('Creating awesome multi-API dashboard...');

    try {
        // TODO: Fetch data from multiple APIs simultaneously using Promise.all()
        // Combine superhero, NASA image, random GIF, and popular movie
        // Display them in a dashboard grid

        console.log('TODO: Implement createRandomDashboard function');
        hideLoading();
        showError('createRandomDashboard function not implemented yet. Check script.js TODO 5!');

    } catch (error) {
        console.error('Dashboard creation failed:', error);
        hideLoading();
        showError('Could not create dashboard. Check your API keys.');
    }
}

async function createThemedDashboard() {
    const theme = prompt('Enter a theme (e.g., space, action, comedy):');
    if (!theme) return;

    showLoading(`Creating ${theme}-themed dashboard...`);

    try {
        // TODO: Create themed content by searching APIs with the theme
        // Search superhero by theme, get NASA image, search themed GIFs, search themed movies

        console.log('TODO: Implement createThemedDashboard function');
        hideLoading();
        showError('createThemedDashboard function not implemented yet. Check script.js TODO 5!');

    } catch (error) {
        console.error('Themed dashboard creation failed:', error);
        hideLoading();
        showError('Could not create themed dashboard.');
    }
}

function clearDashboard() {
    document.getElementById('dashboardResults').innerHTML = `
        <div class="dashboard-placeholder">
            <h3>🎯 Multi-API Integration</h3>
            <p>This dashboard combines data from all APIs to create rich, integrated experiences!</p>
            <div class="features-grid">
                <div class="feature-card">
                    <h4>🔄 Data Fusion</h4>
                    <p>Combine superhero and movie data</p>
                </div>
                <div class="feature-card">
                    <h4>🎨 Rich Media</h4>
                    <p>Mix images, GIFs, and text</p>
                </div>
                <div class="feature-card">
                    <h4>⚡ Parallel Loading</h4>
                    <p>Fetch multiple APIs simultaneously</p>
                </div>
                <div class="feature-card">
                    <h4>🎪 Interactive</h4>
                    <p>Click to explore connections</p>
                </div>
            </div>
        </div>
    `;
}

// TODO 6: Helper Functions for Display
function displaySuperhero(hero) {
    const results = document.getElementById('superheroResults');

    // TODO: Create and display superhero card with image, stats, biography

    results.innerHTML = `
        <div class="superhero-card">
            <div class="card-header">
                <h3>${hero.name}</h3>
                <img src="${hero.image?.url || 'https://via.placeholder.com/200?text=No+Image'}" class="card-image" alt="${hero.name}">
            </div>
            <div class="card-content">
                <div>
                    <h4>Biography</h4>
                    <p><strong>Full Name:</strong> ${hero.biography?.['full-name'] || 'Unknown'}</p>
                    <p><strong>Publisher:</strong> ${hero.biography?.publisher || 'Unknown'}</p>
                    <p><strong>First Appearance:</strong> ${hero.biography?.['first-appearance'] || 'Unknown'}</p>
                </div>
                <div>
                    <h4>Power Stats</h4>
                    <div class="stat-grid">
                        <div class="stat-item">
                            <h4>Intelligence</h4>
                            <p>${hero.powerstats?.intelligence || '?'}</p>
                        </div>
                        <div class="stat-item">
                            <h4>Strength</h4>
                            <p>${hero.powerstats?.strength || '?'}</p>
                        </div>
                        <div class="stat-item">
                            <h4>Speed</h4>
                            <p>${hero.powerstats?.speed || '?'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function displayNASAImage(data) {
    const results = document.getElementById('nasaResults');

    const media = data.media_type === 'video'
        ? `<div class="video-wrapper"><iframe src="${data.url}" frameborder="0" allowfullscreen class="card-image" style="aspect-ratio:16/9;width:100%"></iframe></div>`
        : `<img src="${data.url}" class="card-image" alt="${data.title}">`;

    results.innerHTML = `
        <div class="nasa-card">
            <div class="card-header">
                <h3>${data.title}</h3>
                ${media}
            </div>
            <div class="card-content">
                <div>
                    <h4>Description</h4>
                    <p>${data.explanation}</p>
                </div>
                <div>
                    <h4>Details</h4>
                    <p><strong>Date:</strong> ${data.date}</p>
                    <p><strong>Media Type:</strong> ${data.media_type}</p>
                    ${data.copyright ? `<p><strong>Copyright:</strong> ${data.copyright}</p>` : ''}
                </div>
            </div>
        </div>
    `;
}

function displayGIFs(gifs) {
    const results = document.getElementById('giphyResults');

    const gifHTML = gifs.map(gif => `
        <div class="gif-item">
            <img src="${gif.images.fixed_height.url}" alt="${gif.title}">
        </div>
    `).join('');

    results.innerHTML = `
        <div>
            <h3>🎬 GIF Results</h3>
            <div class="gif-grid">
                ${gifHTML}
            </div>
        </div>
    `;
}

function displayMovies(movies) {
    const results = document.getElementById('tmdbResults');

    const movieHTML = movies.slice(0, 12).map(movie => `
        <div class="movie-item">
            <img src="https://image.tmdb.org/t/p/w300${movie.poster_path}" class="movie-poster" alt="${movie.title}">
            <div class="movie-info">
                <h4>${movie.title}</h4>
                <p>${movie.overview?.substring(0, 100)}...</p>
                <span class="movie-rating">⭐ ${movie.vote_average.toFixed(1)}</span>
            </div>
        </div>
    `).join('');

    results.innerHTML = `
        <div>
            <h3>🍿 Movie Results</h3>
            <div class="movie-grid">
                ${movieHTML}
            </div>
        </div>
    `;
}

// Event listeners for saving API keys
document.getElementById('superheroKey').addEventListener('change', saveKeys);
document.getElementById('nasaKey').addEventListener('change', saveKeys);
document.getElementById('giphyKey').addEventListener('change', saveKeys);
document.getElementById('tmdbKey').addEventListener('change', saveKeys);

/*
STUDENT INSTRUCTIONS:

🚀 MULTI-API INTEGRATION CHALLENGE

This is the most advanced template in the series! You'll integrate 4 different APIs
with authentication, error handling, and create a combined dashboard.

PHASE 1: API SETUP (TODOs 1-4)
1. Get API keys from:
   - Superhero API: https://superheroapi.com/ (free)
   - NASA API: https://api.nasa.gov/ (free, instant)
   - GIPHY: https://developers.giphy.com/ (free)
   - TMDB: https://www.themoviedb.org/settings/api (free)

2. Complete each API integration:
   - TODO 1: Superhero API (search heroes, get random hero)
   - TODO 2: NASA API (space images, Mars photos)
   - TODO 3: GIPHY API (search GIFs, trending, random)
   - TODO 4: TMDB API (search movies, popular, now playing)

PHASE 2: MULTI-API DASHBOARD (TODO 5)
- Combine data from multiple APIs
- Use Promise.all() for parallel requests
- Create rich, interactive displays
- Handle mixed success/failure scenarios

KEY CONCEPTS TO MASTER:
✅ API authentication with keys
✅ Error handling and user feedback
✅ Multiple API coordination
✅ Data transformation and display
✅ Local storage for API keys
✅ Promise.all() for parallel requests

DEBUGGING TIPS:
- Use Network tab to inspect API requests
- Check API documentation for exact endpoints
- Test one API at a time before combining
- Handle CORS issues with proper error messages
- Use console.log() to debug API responses

SUCCESS CRITERIA:
- All 4 APIs work individually
- API keys are saved and loaded properly
- Dashboard combines multiple API data
- Error handling works gracefully
- Mobile responsive design works

This project teaches real-world API integration skills! 🎯
*/