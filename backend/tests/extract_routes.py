import urllib.request
import re

url = 'https://botkeep.cloud/assets/index-c6e57b166e9f-vre5b09f7d135b-vcdf683b1113b0.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
data = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')

routes = set(re.findall(r'/api/v1/[a-zA-Z0-9_\-\/]+', data))
print(f"Found {len(routes)} /api/v1 routes in main index bundle:")
for r in sorted(routes):
    print(" ", r)
