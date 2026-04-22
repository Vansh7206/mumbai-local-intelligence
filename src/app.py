from flask import Flask, render_template, request
import pickle
import pandas as pd
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from router import find_route, build_graph

app = Flask(__name__)

model = pickle.load(open(r"C:\Users\vchan\OneDrive\Desktop\mumbai_local\models\delay_model.pkl", "rb"))

stations_df = pd.read_csv(r"C:\Users\vchan\OneDrive\Desktop\mumbai_local\data\processed\stations_clean.csv")
station_list = sorted(stations_df['station'].drop_duplicates().tolist())

station_encoded = {s: i for i, s in enumerate(sorted(stations_df['station'].unique()))}
line_encoded = {l: i for i, l in enumerate(sorted(stations_df['line'].unique()))}

@app.route('/', methods=['GET', 'POST'])
def index():
    result = None
    if request.method == 'POST':
        source = request.form['source']
        destination = request.form['destination']
        hour = int(request.form['hour'])

        path, total_time = find_route(source, destination)

        if path:
            route_details = []
            for i, station in enumerate(path):
                row = stations_df[stations_df['station'] == station].iloc[0]
                line = row['line']
                is_peak = 1 if (8 <= hour <= 10 or 18 <= hour <= 20) else 0

                features = [[
                    hour,
                    is_peak,
                    line_encoded.get(line, 0),
                    station_encoded.get(station, 0),
                    i + 1
                ]]

                delay = model.predict(features)[0]
                route_details.append({
                    'station': station,
                    'line': line,
                    'delay': round(delay, 1)
                })

            result = {
                'path': route_details,
                'total_time': total_time,
                'total_delay': round(max(r['delay'] for r in route_details), 1)
            }

    return render_template('index.html', stations=station_list, result=result)

if __name__ == '__main__':
    app.run(debug=True)