#!/usr/bin/env python3
import requests
import time
import sys

def main():
    print("🚀 Triggering demo traffic to Shadow Platform...")
    base_url = "http://localhost:8080/api"
    
    endpoints = ["/users", "/products", "/health"]
    
    for i in range(10):
        for endpoint in endpoints:
            url = base_url + endpoint
            try:
                resp = requests.get(url, timeout=2)
                status = resp.status_code
            except Exception as e:
                status = f"Error: {e}"
            print(f"[{i+1}/10] GET {url} -> {status}")
            time.sleep(0.5)

if __name__ == "__main__":
    main()
