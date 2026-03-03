#!/usr/bin/env python3
"""
configure-proxy.py — Shadow API Natural Language Configurator CLI

Usage:
    python cli/configure-proxy.py "Mirror traffic from 3000 to my shadow app on 4000"
    python cli/configure-proxy.py "Route production to 8080 and mirror to 8081"
"""

import sys
import json
import urllib.request
import urllib.error
import argparse

AI_SERVICE_URL = "http://localhost:8005/api/v1/configure-proxy"

def main():
    parser = argparse.ArgumentParser(description="Configure Shadow NGINX proxy using natural language.")
    parser.add_argument("instruction", type=str, help="Natural language instruction (e.g. 'Route prod to 3000 and shadow to 4000')")
    
    args = parser.parse_args()
    
    print(f"\n🧠 Sending natural language instruction to AI Configurator...")
    print(f"👉 \"{args.instruction}\"\n")
    
    data = json.dumps({"instruction": args.instruction}).encode("utf-8")
    req = urllib.request.Request(AI_SERVICE_URL, data=data, headers={"Content-Type": "application/json"})
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print(f"✅ AI Parsed Ports:")
            print(f"   ► Production: {result['parsed_ports']['production_port']}")
            print(f"   ► Shadow:     {result['parsed_ports']['shadow_port']}")
            print(f"\n🔄 Output: {result['message']}")
            print(f"\n⚠️ Note: Remember to restart the NGINX container to apply changes.")
            print(f"   Run: docker-compose restart nginx-proxy\n")
            
    except urllib.error.HTTPError as e:
        error_info = e.read().decode()
        print(f"❌ AI Configuration Failed (HTTP {e.code}):\n{error_info}")
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"❌ Connection Failed: Is the AI service running?\n{e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
