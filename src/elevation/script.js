// Global variables
let map;
let currentMarker;
let geocodingTimeout;

// API Configuration
const ELEVATION_API_BASE = 'https://api.opentopodata.org/v1';
const ELEVATION_DATASET = 'aster30m'; // Global 30m resolution dataset
const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';

// CORS proxy for elevation API (fallback options)
const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://cors-anywhere.herokuapp.com/'
];

// Alternative elevation APIs
const ALTERNATIVE_APIS = [
    {
        name: 'Open Elevation',
        url: 'https://api.open-elevation.com/api/v1/lookup',
        method: 'POST'
    }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    initializeMap();
    setupEventListeners();
});

// Initialize the Leaflet map
function initializeMap() {
    // Create map centered on Phoenix, Arizona (used in the API documentation)
    map = L.map('map').setView([33.4484, -112.0740], 8); // The 4 is the zoom level, the higher the number, the closer the zoom

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
    }).addTo(map);

    // Add click event listener to map
    map.on('click', onMapClick);

    // Add initial marker
    currentMarker = L.marker([33.4484, -112.0740])
        .addTo(map)
        .bindPopup('Click anywhere on the map to get elevation data');
}

// Setup event listeners
function setupEventListeners() {
    const addressInput = document.getElementById('addressInput');
    const searchBtn = document.getElementById('searchBtn');
    const coordBtn = document.getElementById('coordBtn');
    const latInput = document.getElementById('latInput');
    const lngInput = document.getElementById('lngInput');

    // Address search
    searchBtn.addEventListener('click', searchAddress);
    addressInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            searchAddress();
        }
    });

    // Coordinate input
    coordBtn.addEventListener('click', getElevationFromCoordinates);
    latInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            getElevationFromCoordinates();
        }
    });
    lngInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            getElevationFromCoordinates();
        }
    });

    // Auto-complete for address input (debounced)
    addressInput.addEventListener('input', function () {
        clearTimeout(geocodingTimeout);
        geocodingTimeout = setTimeout(() => {
            if (addressInput.value.length > 3) {
                // Could implement address suggestions here
            }
        }, 300);
    });
}

// Handle map click events
function onMapClick(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    // Update coordinate inputs
    document.getElementById('latInput').value = lat.toFixed(6);
    document.getElementById('lngInput').value = lng.toFixed(6);

    // Move marker to clicked position
    if (currentMarker) {
        currentMarker.setLatLng(e.latlng);
    } else {
        currentMarker = L.marker(e.latlng).addTo(map);
    }

    // Get elevation for clicked location
    getElevationData(lat, lng, 'Map Click');
}

// Search for address using Nominatim API
async function searchAddress() {
    const address = document.getElementById('addressInput').value.trim();

    if (!address) {
        showError('Please enter an address to search');
        return;
    }

    showLoading();

    try {
        const response = await fetch(`${NOMINATIM_API}?format=json&q=${encodeURIComponent(address)}&limit=1`);

        if (!response.ok) {
            throw new Error('Geocoding service unavailable');
        }

        const data = await response.json();

        if (data.length === 0) {
            throw new Error('Address not found. Please try a different search term.');
        }

        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        // Update map and coordinate inputs
        map.setView([lat, lng], 15);
        document.getElementById('latInput').value = lat.toFixed(6);
        document.getElementById('lngInput').value = lng.toFixed(6);

        // Update marker
        if (currentMarker) {
            currentMarker.setLatLng([lat, lng]);
        } else {
            currentMarker = L.marker([lat, lng]).addTo(map);
        }

        // Get elevation data
        await getElevationData(lat, lng, result.display_name);

    } catch (error) {
        showError(`Address search failed: ${error.message}`);
    }
}

// Get elevation from coordinate inputs
function getElevationFromCoordinates() {
    const latInput = document.getElementById('latInput');
    const lngInput = document.getElementById('lngInput');

    const lat = parseFloat(latInput.value);
    const lng = parseFloat(lngInput.value);

    if (isNaN(lat) || isNaN(lng)) {
        showError('Please enter valid latitude and longitude values');
        return;
    }

    if (lat < -90 || lat > 90) {
        showError('Latitude must be between -90 and 90 degrees');
        return;
    }

    if (lng < -180 || lng > 180) {
        showError('Longitude must be between -180 and 180 degrees');
        return;
    }

    // Update map view and marker
    map.setView([lat, lng], 15);

    if (currentMarker) {
        currentMarker.setLatLng([lat, lng]);
    } else {
        currentMarker = L.marker([lat, lng]).addTo(map);
    }

    // Get elevation data
    getElevationData(lat, lng, 'Manual Coordinates');
}

// Get elevation data from Open Topo Data API
async function getElevationData(lat, lng, locationName = 'Unknown Location') {
    showLoading();

    // Try Open Topo Data API first (with CORS proxy if needed)
    try {
        const result = await tryOpenTopoData(lat, lng);
        if (result) {
            showResults({
                location: locationName,
                latitude: result.location.lat,
                longitude: result.location.lng,
                elevation: result.elevation,
                dataset: result.dataset
            });
            updateMarkerPopup(lat, lng, result.elevation);
            return;
        }
    } catch (error) {
        console.warn('Open Topo Data failed:', error.message);
    }

    // Try alternative APIs
    try {
        const result = await tryAlternativeAPIs(lat, lng);
        if (result) {
            showResults({
                location: locationName,
                latitude: lat,
                longitude: lng,
                elevation: result.elevation,
                dataset: result.source || 'Alternative API'
            });
            updateMarkerPopup(lat, lng, result.elevation);
            return;
        }
    } catch (error) {
        console.warn('Alternative APIs failed:', error.message);
    }

    // If all APIs fail, show error
    showError('Unable to get elevation data. This may be due to API limitations or network issues. Please try again later.');
    updateMarkerPopup(lat, lng, null);
}

// Try Open Topo Data API with multiple approaches
async function tryOpenTopoData(lat, lng) {
    const url = `${ELEVATION_API_BASE}/${ELEVATION_DATASET}?locations=${lat},${lng}`;

    // Try direct request first
    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (data.status === 'OK' && data.results && data.results.length > 0) {
                return data.results[0];
            }
        }
    } catch (error) {
        console.warn('Direct API call failed:', error.message);
    }

    // Try with CORS proxies
    for (const proxy of CORS_PROXIES) {
        try {
            const proxiedUrl = proxy + encodeURIComponent(url);
            const response = await fetch(proxiedUrl);

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'OK' && data.results && data.results.length > 0) {
                    return data.results[0];
                }
            }
        } catch (error) {
            console.warn(`CORS proxy ${proxy} failed:`, error.message);
            continue;
        }
    }

    return null;
}

// Try alternative elevation APIs
async function tryAlternativeAPIs(lat, lng) {
    // Try Open Elevation API
    try {
        const response = await fetch('https://api.open-elevation.com/api/v1/lookup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                locations: [{ latitude: lat, longitude: lng }]
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                return {
                    elevation: data.results[0].elevation,
                    source: 'Open Elevation API'
                };
            }
        }
    } catch (error) {
        console.warn('Open Elevation API failed:', error.message);
    }

    return null;
}

// Update marker popup with elevation data
function updateMarkerPopup(lat, lng, elevation) {
    if (!currentMarker) return;

    const elevationText = elevation !== null && elevation !== undefined ?
        `${elevation.toFixed(1)}m` :
        'No data available';

    currentMarker.bindPopup(`
        <div class="elevation-popup">
            <div><strong>Elevation</strong></div>
            <div class="elevation-value">${elevationText}</div>
            <div class="coords">${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
        </div>
    `).openPopup();
}

// Show loading state
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');
    document.getElementById('error').classList.add('hidden');
}

// Show results
function showResults(data) {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('error').classList.add('hidden');

    const resultsDiv = document.getElementById('results');
    document.getElementById('resultLocation').textContent = data.location;
    document.getElementById('resultCoords').textContent = `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`;

    const elevationText = data.elevation !== null ?
        `${data.elevation.toFixed(1)} meters (${(data.elevation * 3.28084).toFixed(1)} feet)` :
        'No data available';
    document.getElementById('resultElevation').textContent = elevationText;
    document.getElementById('resultDataset').textContent = data.dataset;

    resultsDiv.classList.remove('hidden');
}

// Show error message
function showError(message) {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('results').classList.add('hidden');

    document.getElementById('errorMessage').textContent = message;
    document.getElementById('error').classList.remove('hidden');
}

// Utility function to debounce function calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
