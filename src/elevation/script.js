let map;
let marker;

function init() {
    map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    marker = L.marker([20, 0], { draggable: true }).addTo(map);

    map.on('click', (e) => {
        fetchElevation(e.latlng.lat, e.latlng.lng);
    });

    marker.on('dragend', () => {
        const pos = marker.getLatLng();
        fetchElevation(pos.lat, pos.lng);
    });

    document.getElementById('addressForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const address = document.getElementById('addressInput').value.trim();
        if (!address) return;
        try {
            const { lat, lng } = await geocodeAddress(address);
            fetchElevation(lat, lng);
        } catch (err) {
            showError('Address not found');
        }
    });

    document.getElementById('coordBtn').addEventListener('click', () => {
        const lat = parseFloat(document.getElementById('latInput').value);
        const lng = parseFloat(document.getElementById('lngInput').value);
        if (isNaN(lat) || isNaN(lng)) {
            showError('Invalid coordinates');
            return;
        }
        fetchElevation(lat, lng);
    });
}

async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    if (!data.length) throw new Error('No results');
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

async function getElevation(lat, lng) {
    const url = `https://api.opentopodata.org/v1/mapzen?locations=${lat},${lng}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Elevation failed');
    const data = await res.json();
    if (!data.results || !data.results[0]) throw new Error('No elevation data');
    return data.results[0].elevation;
}

async function fetchElevation(lat, lng) {
    try {
        const elevation = await getElevation(lat, lng);
        updateUI(lat, lng, elevation);
    } catch (err) {
        showError(err.message);
    }
}

function updateUI(lat, lng, elevation) {
    marker.setLatLng([lat, lng]);
    map.setView([lat, lng], map.getZoom());
    document.getElementById('latValue').textContent = lat.toFixed(5);
    document.getElementById('lngValue').textContent = lng.toFixed(5);
    document.getElementById('elevationValue').textContent = elevation;
    document.getElementById('errorMsg').textContent = '';
}

function showError(msg) {
    document.getElementById('errorMsg').textContent = msg;
}

document.addEventListener('DOMContentLoaded', init);
