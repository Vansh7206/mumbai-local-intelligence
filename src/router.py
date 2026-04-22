import pandas as pd
import networkx as nx

def build_graph():
    df = pd.read_csv(r"C:\Users\vchan\OneDrive\Desktop\mumbai_local\data\processed\stations_clean.csv")
    
    G = nx.DiGraph()
    
    for line in df['line'].unique():
        line_df = df[df['line'] == line].reset_index(drop=True)
        
        for i in range(len(line_df) - 1):
            src = line_df.loc[i, 'station']
            dst = line_df.loc[i+1, 'station']
            time = line_df.loc[i+1, 'travel_time_min']
            
            G.add_edge(src, dst, weight=time, line=line)
            G.add_edge(dst, src, weight=time, line=line)
    
    return G

def find_route(source, destination):
    G = build_graph()
    
    try:
        path = nx.dijkstra_path(G, source, destination, weight='weight')
        time = nx.dijkstra_path_length(G, source, destination, weight='weight')
        return path, round(time, 2)
    except nx.NetworkXNoPath:
        return None, None

if __name__ == "__main__":
    path, time = find_route("Thane", "CSMT")
    print("Route:", " → ".join(path))
    print("Total time:", time, "mins")