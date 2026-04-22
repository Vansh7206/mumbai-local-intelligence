import pandas as pd
import networkx as nx

def build_graph():
    df = pd.read_csv(r"C:\Users\vchan\OneDrive\Desktop\mumbai_local\data\processed\stations_clean.csv")
    
    G = nx.DiGraph()    #Creating the Network base
    
    for line in df['line'].unique():            #Choosing the Line for travel(W,C,H)
        line_df = df[df['line'] == line].reset_index(drop=True)         #Iterating through stations of that particular line
        
        for i in range(len(line_df) - 1):
            src = line_df.loc[i, 'station']         #Source Station
            dst = line_df.loc[i+1, 'station']       #Destination
            time = line_df.loc[i+1, 'travel_time_min']      #Minimum travel time
            
            G.add_edge(src, dst, weight=time, line=line)            #Source -> Destination
            G.add_edge(dst, src, weight=time, line=line)            #Destination -> Source both of these should be same
    
    return G        #Return the network 

def find_route(source, destination):
    G = build_graph()           #We build graph to find best route using Dijkstra
    
    try:
        path = nx.dijkstra_path(G, source, destination, weight='weight')
        time = nx.dijkstra_path_length(G, source, destination, weight='weight')
        return path, round(time, 2)
    except nx.NetworkXNoPath:           #Exception
        return None, None

if __name__ == "__main__":
    path, time = find_route("Kurla", "CSMT")            #Example testing
    print("Route:", " → ".join(path))
    print("Total time:", time, "mins")