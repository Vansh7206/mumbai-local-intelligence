from flask import Flask, render_template, request, jsonify
import pickle
import pandas as pd
import numpy as np
import sys, os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from router import find_route

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model = pickle.load(open(os.path.join(BASE_DIR, "..", "models", "delay_model.pkl"), "rb"))
df = pd.read_csv(os.path.join(BASE_DIR, "..", "data", "processed", "stations_with_coords.csv"))
df = df.dropna(subset=['lat', 'lng'])

station_encoded = {s: i for i, s in enumerate(sorted(df['station'].unique()))}
line_encoded = {l: i for i, l in enumerate(sorted(df['line'].unique()))}

stations_json = df[['station', 'line', 'lat', 'lng']].drop_duplicates('station').to_dict(orient='records')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/stations')
def stations():
    return jsonify(stations_json)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    source = data['source']
    destination = data['destination']
    hour = int(data['hour'])

    path, total_time = find_route(source, destination)

    if not path:
        return jsonify({'error': 'No route found'}), 400

    is_peak = 1 if (8 <= hour <= 10 or 18 <= hour <= 20) else 0
    route_details = []

    for i, station in enumerate(path):
        row = df[df['station'] == station]
        if row.empty:
            continue
        row = row.iloc[0]
        line = row['line']

        features = [[
            hour,
            is_peak,
            line_encoded.get(line, 0),
            station_encoded.get(station, 0),
            i + 1
        ]]

        delay = round(float(model.predict(features)[0]), 1)
        route_details.append({
            'station': str(station),
            'line': str(line),
            'lat': float(row['lat']),
            'lng': float(row['lng']),
            'delay': float(delay)
        })
    max_delay = round(max(s['delay'] for s in route_details), 1)

    return jsonify({
        'path': route_details,
        'total_time': float(total_time),
        'max_delay': float(max_delay)
    })

if __name__ == '__main__':
    app.run(debug=True)