import os

input_file = r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\graphify-out\graph.html"
temp_file = r"d:\Proyecto2026\ACP_DWH\ACP Proyecciones\graphify-out\graph_temp.html"

# HTML block to insert before the stats line
physics_html = """  <!-- Physics Control Panel -->
  <div id="physics-panel" style="padding: 14px; border-top: 1px solid #2a2a4e; border-bottom: 1px solid #2a2a4e;">
    <h3 style="margin: 0 0 10px 0; font-size: 13px; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
      <span>⚙️</span> Reorganización
    </h3>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <button id="btn-reorganize" style="background: linear-gradient(135deg, #4e79a7 0%, #355c7d 100%); color: #fff; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px; transition: all 0.3s ease; box-shadow: 0 2px 5px rgba(0,0,0,0.2); outline: none;">
        ⚡ Reorganizar Grafo
      </button>
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; color: #aaa; user-select: none;">
          <input type="checkbox" id="physics-toggle" style="accent-color: #4e79a7; cursor: pointer;">
          Mantener física activa
        </label>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #888;">
        <span>Estado:</span>
        <span id="physics-status" style="font-weight: 600; color: #888;">Estabilizado</span>
      </div>
    </div>
  </div>
  <style>
    #btn-reorganize:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      filter: brightness(1.1);
    }
    #btn-reorganize:active {
      transform: translateY(1px);
    }
    #btn-reorganize:disabled {
      background: #333;
      color: #777;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  </style>
"""

# JS block to replace the network.once('stabilizationIterationsDone', ...) logic
physics_js = """// Variable to track stabilization progress
let isStabilizing = false;

network.on('stabilizationStart', () => {
  isStabilizing = true;
  document.getElementById('physics-status').innerText = 'Estabilizando...';
  document.getElementById('physics-status').style.color = '#e15759';
  const btn = document.getElementById('btn-reorganize');
  btn.disabled = true;
  btn.innerText = '⏳ Estabilizando...';
});

network.on('stabilizationProgress', (params) => {
  const percent = Math.round((params.iterations / params.total) * 100);
  document.getElementById('physics-status').innerText = `Estabilizando (${percent}%)`;
});

network.on('stabilizationIterationsDone', () => {
  isStabilizing = false;
  document.getElementById('physics-status').innerText = 'Estabilizado';
  document.getElementById('physics-status').style.color = '#76b7b2';
  const btn = document.getElementById('btn-reorganize');
  btn.disabled = false;
  btn.innerText = '⚡ Reorganizar Grafo';
  
  if (!document.getElementById('physics-toggle').checked) {
    network.setOptions({ physics: { enabled: false } });
  }
});

// Reorganize button handler
document.getElementById('btn-reorganize').addEventListener('click', () => {
  if (isStabilizing) return;
  network.setOptions({ physics: { enabled: true } });
  network.stabilize();
});

// Toggle physics handler
document.getElementById('physics-toggle').addEventListener('change', (e) => {
  const active = e.target.checked;
  network.setOptions({ physics: { enabled: active } });
  if (active) {
    document.getElementById('physics-status').innerText = 'Física Activa';
    document.getElementById('physics-status').style.color = '#4e79a7';
  } else {
    document.getElementById('physics-status').innerText = 'Inactivo';
    document.getElementById('physics-status').style.color = '#888';
  }
});
"""

modified_html_stats = False
modified_js = False

with open(input_file, "r", encoding="utf-8") as f_in, open(temp_file, "w", encoding="utf-8") as f_out:
    lines = list(f_in)
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Look for stats line to insert the HTML panel
        if 'id="stats"' in line and not modified_html_stats:
            f_out.write(physics_html)
            f_out.write(line)
            modified_html_stats = True
            print("Successfully inserted the Physics Control Panel HTML.")
            i += 1
            continue
        
        # Look for network.once('stabilizationIterationsDone', ...) block to replace
        if "network.once('stabilizationIterationsDone'" in line and not modified_js:
            # We skip the entire block (lines 122 to 124)
            # Find the end of this block
            block_end = i
            while block_end < len(lines) and "});" not in lines[block_end]:
                block_end += 1
            
            # Write the new JS
            f_out.write(physics_js + "\n")
            modified_js = True
            print(f"Successfully replaced JS block (lines {i+1} to {block_end+1}).")
            i = block_end + 1
            continue
            
        f_out.write(line)
        i += 1

if modified_html_stats and modified_js:
    # Rename temp to original
    os.replace(temp_file, input_file)
    print("Graph HTML file successfully updated!")
else:
    print(f"Error: modified_html_stats={modified_html_stats}, modified_js={modified_js}")
    if os.path.exists(temp_file):
        os.remove(temp_file)
