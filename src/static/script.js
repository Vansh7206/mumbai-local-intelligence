// ─── STATE ───────────────────────────────────────
let allStations = [];
let selectedSrc = '';
let selectedDst = '';
let routeLayer = null;
let routeMarkers = [];

// ─── MAP INIT ────────────────────────────────────
const map = L.map('map', { center: [19.07, 72.87], zoom: 11 });

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors', maxZoom: 18
}).addTo(map);

const lineColors = { Western: '#1a73e8', 'Central 1': '#ea4335', Harbour: '#34a853', 'Central 2': '#f9ab00' };

// ─── LOAD STATIONS FROM FLASK ─────────────────────
async function loadStations() {
    const res = await fetch('/stations');
    allStations = await res.json();

    // Draw station dots on map
    allStations.forEach(s => {
        const color = lineColors[s.line] || '#5f6368';
        L.circleMarker([s.lat, s.lng], {
            radius: 4, color: color,
            fillColor: 'white', fillOpacity: 1, weight: 2
        }).bindTooltip(s.station, { direction: 'top' }).addTo(map);
    });

    buildDropdown('srcInput', 'srcDropdown', v => selectedSrc = v);
    buildDropdown('dstInput', 'dstDropdown', v => selectedDst = v);
}

// ─── SEARCHABLE DROPDOWN ──────────────────────────
function buildDropdown(inputId, dropdownId, onSelect) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);

    function render(query) {
        dropdown.innerHTML = '';
        const matches = allStations
            .map(s => s.station)
            .filter((s, i, arr) => arr.indexOf(s) === i)
            .filter(s => s.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 30);

        matches.forEach(s => {
            const div = document.createElement('div');
            div.className = 'dropdown-item';
            div.innerHTML = `🚉 ${s}`;
            div.addEventListener('mousedown', e => {
                e.preventDefault();
                input.value = s;
                dropdown.classList.remove('open');
                onSelect(s);
            });
            dropdown.appendChild(div);
        });

        dropdown.classList.toggle('open', matches.length > 0);
    }

    input.addEventListener('focus', () => render(input.value));
    input.addEventListener('input', () => render(input.value));
    document.addEventListener('click', e => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('open');
        }
    });
}

// ─── PLAN ROUTE ───────────────────────────────────
async function planRoute() {
    const src = selectedSrc || document.getElementById('srcInput').value.trim();
    const dst = selectedDst || document.getElementById('dstInput').value.trim();
    const hour = parseInt(document.getElementById('hourInput').value) || 8;

    if (!src || !dst) { alert('Please select both stations.'); return; }
    if (src === dst) { alert('Source and destination cannot be the same.'); return; }

    // Show loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('result').style.display = 'none';
    document.getElementById('planBtn').disabled = true;

    try {
        const res = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source: src, destination: dst, hour: hour })
        });

        const data = await res.json();

        if (data.error) {
            alert(data.error);
            return;
        }

        drawRoute(data.path);
        renderResult(data);

    } catch (err) {
        alert('Something went wrong. Please try again.');
        console.error(err);
    } finally {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('planBtn').disabled = false;
    }
}

// ─── DRAW ROUTE ON MAP ────────────────────────────
function drawRoute(path) {
    if (routeLayer) map.removeLayer(routeLayer);
    routeMarkers.forEach(m => map.removeLayer(m));
    routeMarkers = [];

    const coords = path
        .filter(s => s.lat && s.lng)
        .map(s => [s.lat, s.lng]);

    if (coords.length < 2) return;

    routeLayer = L.polyline(coords, {
        color: '#ff6d00', weight: 6,
        opacity: 0.9, lineCap: 'round'
    }).addTo(map);

    path.forEach((s, i) => {
        if (!s.lat || !s.lng) return;
        const isFirst = i === 0;
        const isLast = i === path.length - 1;
        const color = isFirst ? '#1a73e8' : isLast ? '#ea4335' : '#ff6d00';
        const radius = (isFirst || isLast) ? 9 : 5;

        const m = L.circleMarker([s.lat, s.lng], {
            radius, color, fillColor: 'white',
            fillOpacity: 1, weight: 3
        }).bindPopup(`<b>${s.station}</b><br>${s.line}<br>Delay: +${s.delay} min`).addTo(map);

        routeMarkers.push(m);
    });

    map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });
}

// ─── RENDER RESULT PANEL ──────────────────────────
function renderResult(data) {
    const panel = document.getElementById('result');
    panel.style.display = 'block';

    document.getElementById('routeTitle').textContent =
        `${data.path[0].station} → ${data.path[data.path.length - 1].station}`;
    document.getElementById('statStops').textContent = data.path.length;
    document.getElementById('statTime').textContent = `${data.total_time} min`;
    document.getElementById('statDelay').textContent = `${data.max_delay} min`;

    const stopsContainer = document.getElementById('stopsContainer');
    stopsContainer.innerHTML = '';

    data.path.forEach((s, i) => {
        const isFirst = i === 0;
        const isLast = i === data.path.length - 1;
        const dotClass = isFirst ? 'first' : isLast ? 'last' : '';
        const delayClass = s.delay <= 3 ? 'd-low' : s.delay <= 7 ? 'd-mid' : 'd-high';

        stopsContainer.innerHTML += `
            <div class="stop">
                <div class="stop-dot ${dotClass}"></div>
                <div style="flex:1">
                    <div class="stop-name">${s.station}</div>
                    <div class="stop-line-tag">${s.line}</div>
                </div>
                <div class="delay-pill ${delayClass}">+${s.delay} min</div>
            </div>
        `;
    });
}

// ─── HOUR CHIPS ───────────────────────────────────
function setHour(h, el) {
    document.getElementById('hourInput').value = h;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
}

// ─── INIT ─────────────────────────────────────────
loadStations();