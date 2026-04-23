# 🚉 Mumbai Local Train Network Intelligence System

> End-to-end ML pipeline for delay prediction and optimal route planning across Mumbai's suburban rail network — with a Power BI analytics dashboard and a Flask web app with an interactive map.

---

## What It Does

Enter a source station, a destination, and your travel hour. The system:
- Finds the **fastest route** across the Western, Central, and Harbour lines using **Dijkstra's algorithm**
- Predicts **delay in minutes at each stop** using a trained **XGBoost Regressor**
- Renders the full route on an **interactive map** with per-station delay annotations
- Visualizes network-wide insights through a **Power BI dashboard** (delay trends, train status, line distribution, busiest stations)

---

## The Problem

Mumbai Local carries **7+ million passengers daily**. Train delay data is fragmented and inaccessible — no public API exists, no structured dataset, no commuter-facing delay prediction tool. This project builds the entire pipeline from scratch: raw data → cleaned dataset → synthetic timetable → ML model → routing engine → web application.

---

## Pipeline Overview

```
Web Scraping Attempt (erail.in)
        ↓
Manual Station Dataset (202 stations, 9 lines)
        ↓
Data Cleaning & Filtering (139 stations, 4 main lines)
        ↓
Coordinate Geocoding (06_Maps.ipynb → stations_with_coords.csv)
        ↓
Synthetic Timetable Generation (11,730 rows with delay simulation)
        ↓
EDA (7 analytical plots across delay, infrastructure, peak hours)
        ↓
Feature Engineering + XGBoost Training (MAE: 1.16 min, R²: 0.82)
        ↓
Dijkstra Router (router.py)
        ↓
Flask API + Interactive Map Frontend
        ↓
Power BI Dashboard (Mumbai Local Analysis)
```

---

## Dataset

Built entirely from scratch — no Kaggle, no pre-existing CSV.

| Attribute | Value |
|---|---|
| Total stations documented | 202 |
| Lines covered | 9 |
| Stations used (main lines) | 139 |
| Timetable rows generated | 11,730 |

**Lines in scope:**
- Western — 37 stations (Churchgate → Dahanu Road)
- Central 1 — 40 stations (CSMT → Kasara / Khopoli)
- Central 2 — 37 stations
- Harbour — 25 stations (CSMT → Panvel)

**Per-station metadata:** station code · line · platforms · tracks · year of opening · nearby attractions · inter-station distance (km) · travel time (min)

**Coordinates:** Geocoded in `06_Maps.ipynb` and saved to `stations_with_coords.csv`, used by the Flask app to render the route map.

### Why Synthetic Delays?

Historical delay data for Mumbai locals is not publicly available in any structured format. Delays were simulated using statistical distributions calibrated to real-world behavior — elevated variance during peak windows (8–10 AM, 6–8 PM) and lower baseline delays off-peak. This approach preserves ML validity while enabling the full end-to-end pipeline.

---

## Exploratory Data Analysis

7 plots generated and saved under `img/`:

| File | What It Shows |
|---|---|
| `eda_01_top_stations.png` | Stations with highest average delay |
| `eda_02_line_delay.png` | Average delay comparison across lines |
| `eda_03_busy_stations.png` | Stations with highest train frequency |
| `eda_04_peak_normal_ni....png` | Peak vs. off-peak delay distribution |
| `eda_05_hourly.png` | Average delay by hour of day (24h) |
| `eda_06_distribution.png` | Delay distribution histogram |
| `eda_07_infra.png` | Infrastructure comparison (platforms/tracks per station) |

---

## Model — Delay Prediction

**Algorithm:** XGBoost Regressor

**Features:**

| Feature | Description |
|---|---|
| `hour` | Hour of day extracted from arrival time |
| `is_peak` | 1 if 8–10 AM or 6–8 PM, else 0 |
| `line_encoded` | Railway line as numeric category |
| `station_encoded` | Station as numeric category |
| `stop_number` | Position of this station in the train's journey |

**Results:**

| Metric | Value |
|---|---|
| MAE | **1.16 minutes** |
| R² Score | **0.82** |

An R² of 0.82 means the model explains 82% of delay variance, with an average prediction error under 90 seconds — precise enough for commuter-facing use.

Model saved as `models/delay_model.pkl`.

---

## Power BI Dashboard

**File:** `dashboard/Mumbai_Local.pbix`

A dark-themed analytics dashboard titled **"Mumbai Local Analysis"** with the following panels:

| Panel | Insight |
|---|---|
| KPI Cards | 345 total trains · 3 lines active · 97 stations covered · Avg delay: 4 min |
| Trips by Line (Donut) | Central 39.22% · Western 36.27% · Harbour 24.51% |
| Train Status (Donut) | 54.48% Delayed · 45.52% On Time |
| Avg Delay by Hour of Day | Sharp peaks at 9 AM (~10 min) and 8 PM (~8 min) |
| Delay Distribution (Histogram) | Right-skewed: majority of delays under 5 minutes |
| Avg Delay by Station (Bar) | Andheri, Bandra, Borivali, Kurla, Thane as top delay stations |

Line-level filter slicers (Central / Harbour / Western) allow interactive drill-down.

---

## Routing Engine

**File:** `src/router.py`

The Mumbai local network is modeled as a weighted graph:
- **Nodes** = stations
- **Edges** = direct connections between adjacent stations
- **Weights** = travel time in minutes

Dijkstra's algorithm finds the minimum-time path between any source and destination across all 4 lines.

---

## Flask API

**File:** `app.py`

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Serves the interactive map frontend |
| `/stations` | GET | Returns all stations with coordinates and line |
| `/predict` | POST | Source + destination + hour → route + per-station delay predictions |

**Sample `/predict` response:**
```json
{
  "path": [
    {"station": "Dadar", "line": "Western", "lat": 19.018, "lng": 72.843, "delay": 2.3},
    {"station": "Bandra", "line": "Western", "lat": 19.054, "lng": 72.840, "delay": 1.8}
  ],
  "total_time": 14.0,
  "max_delay": 2.3
}
```

---

## Tech Stack

| Layer | Tools |
|---|---|
| Data & EDA | Python · Pandas · NumPy · Matplotlib · Seaborn |
| Web Scraping | BeautifulSoup · Requests |
| Geocoding | Geopy / Manual (06_Maps.ipynb) |
| Machine Learning | XGBoost · Scikit-learn |
| Routing | Dijkstra's Algorithm (custom implementation) |
| Backend | Flask |
| Dashboard | Power BI |

---

## Project Structure

```
mumbai-local-intelligence/
│
├── dashboard/
│   └── Mumbai_Local.pbix           # Power BI dashboard
│
├── data/
│   ├── processed/
│   │   ├── stations_clean.csv
│   │   ├── stations_with_coords.csv
│   │   ├── timetable_with_delays.csv
│   │   └── timetable.csv
│   └── raw/
│       └── Mumbai Local Train Da... # Raw station dataset
│
├── img/
│   ├── eda_01_top_stations.png
│   ├── eda_02_line_delay.png
│   ├── eda_03_busy_stations.png
│   ├── eda_04_peak_normal_ni.png
│   ├── eda_05_hourly.png
│   ├── eda_06_distribution.png
│   └── eda_07_infra.png
│
├── models/
│   └── delay_model.pkl             # Trained XGBoost model
│
├── notebooks/
│   ├── 01_data_cleaning.ipynb
│   ├── 02_timetable_scraper.ipynb
│   ├── 03_synthetic_timetable.ipynb
│   ├── 04_eda.ipynb
│   ├── 05_model.ipynb
│   └── 06_Maps.ipynb               # Geocoding → stations_with_coords.csv
│
├── reports/
│   └── MumbaiLocal_Project.pdf
│
├── src/
│   ├── static/
│   ├── templates/
│   └── router.py                   # Dijkstra routing engine
│
├── app.py                          # Flask application
├── requirements.txt
├── LICENSE
└── README.md
```

---

## Local Setup

```bash
git clone https://github.com/Vansh7206/mumbai-local-intelligence.git
cd mumbai-local-intelligence
pip install -r requirements.txt
python app.py
```

Visit `http://localhost:5000`

---

## Built By

**Vansh Chandan**
[LinkedIn](https://linkedin.com/in/your-link) · [Portfolio](https://your-portfolio.com)