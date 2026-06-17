import os
import glob
import re

def robust_decode(raw_bytes):
    # Decode as latin-1 to preserve byte values 1-to-1
    text = raw_bytes.decode('latin-1', errors='ignore')
    if text.count('\x00') > 0:
        text = text.replace('\x00', '')
    return text

def read_latest_log():
    log_files = glob.glob(os.path.join("logs", "etl_*.log"))
    if not log_files:
        print("No log files found in logs/ directory.")
        return
        
    latest_log = max(log_files, key=os.path.getmtime)
    print(f"Reading latest log: {latest_log}")
    
    with open(latest_log, "rb") as f:
        raw_bytes = f.read()
        
    content = robust_decode(raw_bytes)
    
    # Clean ANSI escape sequences (colors)
    ansi_escape = re.compile(r'\x1b\[[0-9;]*[a-zA-Z]')
    cleaned_content = ansi_escape.sub('', content)
    
    # Split lines and display last 25 non-empty lines
    lines = [line.strip() for line in cleaned_content.splitlines() if line.strip()]
    
    print(f"=== Last 25 lines of {latest_log} ===")
    for line in lines[-25:]:
        print(line)
        
    # Check if pipeline has finished
    is_finished = False
    for line in lines[-15:]:
        # Standard finishes or errors
        if "Finalizando..." in line or "RESUMEN FINAL" in line or "Duracion total" in line:
            is_finished = True
            break
        if "ERROR" in line and ("Circuit" in line or "bloqueo" in line or "Falla" in line or "Critical" in line or "Traceback" in line):
            is_finished = True
            break
    print(f"\nSTATUS_FINISHED: {is_finished}")

if __name__ == '__main__':
    read_latest_log()
