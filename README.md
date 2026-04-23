# 🚉 Mumbai Local Train Network Intelligence System

An end-to-end ML system that predicts train delays and finds optimal routes across Mumbai's suburban rail network — served through a Flask web app with an interactive map.

---

## What It Does

Enter a source station, a destination, and your travel hour. The system:
- Finds the fastest route using **Dijkstra's algorithm** across the Western, Central, and Harbour lines
- Predicts **delay in minutes at each stop** using a trained **XGBoost model**
- Renders the full route on an **interactive map** with delay annotations per station

---

## The Problem

Mumbai Local carries 7+ million passengers daily. Train delay data is fragmented, there's no usable public API, and commuters have no tool to predict delays on a specific route at a specific time. This project builds that — from raw data to a working web application.

---

## Pipeline Overview
Web Scraping Attempt → Manual Station Dataset → Synthetic Timetable Generation
→ EDA → Feature Engineering → XGBoost Training → Dijkstra Router → Flask API

---

## Dataset

Built from scratch — no Kaggle, no ready-made CSV.

- **202 stations** scraped and documented across 9 lines
- Filtered to **139 stations** on the 3 main operational lines:
  - Western (37 stations) · Central 1 (40) · Central 2 (37) · Harbour (25)
- Each station includes: code, line, platforms, tracks, year of opening, nearby attractions, inter-station distance and travel time
- **11,730 synthetic timetable rows** generated with realistic delay distributions by time of day

### Why Synthetic?

Historical delay data for Mumbai locals is not publicly available. Delays were generated with statistical distributions calibrated to real-world behavior — higher variance during peak hours (8–10 AM, 6–8 PM), lower during off-peak. This preserves ML validity while enabling the full pipeline.

---

## Model — Delay Prediction

**Algorithm:** XGBoost Regressor

**Features:**
| Feature | Description |
|---|---|
| `hour` | Hour extracted from arrival time |
| `is_peak` | 1 if 8–10 AM or 6–8 PM, else 0 |
| `line_encoded` | Railway line as numeric category |
| `station_encoded` | Station as numeric category |
| `stop_number` | Position of station in train's journey |

**Results:**
| Metric | Value |
|---|---|
| MAE | **1.16 minutes** |
| R² Score | **0.82** |

---

## Routing — Dijkstra's Algorithm

The network is modeled as a weighted graph where nodes = stations and edge weights = travel time in minutes. `router.py` implements Dijkstra's algorithm to return the minimum-time path between any two stations on the network.

---

## Flask API

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Serves the frontend map UI |
| `/stations` | GET | Returns all stations with coordinates and line |
| `/predict` | POST | Accepts source, destination, hour → returns route + delay predictions |

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

`Python` · `Pandas` · `NumPy` · `XGBoost` · `Scikit-learn` · `Flask` · `BeautifulSoup` · `Dijkstra's Algorithm`

---

## Project Structure
mumbai-local-intelligence/

├── data/   
│   ├── raw/                        # Original station dataset
│   └── processed/              # Cleaned stations, timetable with delays
├── notebooks/
│   ├── 01_data_cleaning.ipynb
│   ├── 02_timetable_scraper.ipynb
│   ├── 03_synthetic_timetable.ipynb
│   ├── 04_eda.ipynb
│   └── 05_model.ipynb
├── models/
│   └── delay_model.pkl         # Trained XGBoost model
├── src/
│   └── router.py               # Dijkstra routing engine
├── app.py                      # Flask application
└── templates/
└── index.html              # Frontend map UI

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