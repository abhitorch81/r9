"""Local FieldTrip host and fixed-destination model proxy. No external packages."""
import json
import os
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ROOT = Path(__file__).resolve().parent / 'dist'
PROVIDER = os.getenv('FIELDTRIP_PROVIDER', 'ollama')
MODEL_URL = os.getenv('FIELDTRIP_MODEL_URL', 'http://127.0.0.1:11434').rstrip('/')
API_KEY = os.getenv('FIELDTRIP_API_KEY', '')
MODEL = os.getenv('FIELDTRIP_MODEL', '')

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_POST(self):
        if self.path != '/api/generate':
            self.send_error(404)
            return
        # Local-only host with same-origin browser requests.
        origin = self.headers.get('Origin')
        if origin and origin not in ('http://localhost:8765', 'http://127.0.0.1:8765'):
            self.send_error(403)
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 50000:
                self.send_error(413)
                return
            data = json.loads(self.rfile.read(length))
            headers = {'Content-Type': 'application/json'}
            if PROVIDER == 'openai':
                if not API_KEY or not MODEL:
                    raise ValueError('Set FIELDTRIP_API_KEY and FIELDTRIP_MODEL.')
                headers['Authorization'] = 'Bearer ' + API_KEY
                payload = {'model': MODEL, 'messages': [{'role': 'user', 'content': data['prompt']}],
                           'temperature': 0.15, 'max_tokens': 1000}
                if data.get('format'):
                    payload['messages'].insert(0, {'role': 'system', 'content':
                        'Return only valid JSON matching this schema: ' + json.dumps(data['format'])})
                request = Request(MODEL_URL + '/chat/completions',
                                  json.dumps(payload).encode(), headers)
            else:
                payload = {k: data[k] for k in ('model','prompt','format','options') if k in data}
                payload['stream'] = False
                if MODEL:
                    payload['model'] = MODEL
                request = Request(MODEL_URL + '/api/generate',
                                  json.dumps(payload).encode(), headers)
            with urlopen(request, timeout=85) as response:
                output = json.load(response)
            if PROVIDER == 'openai':
                output = {'response': output['choices'][0]['message']['content']}
            body = json.dumps(output).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except (ValueError, KeyError, HTTPError, URLError, TimeoutError) as exc:
            # Do not expose upstream bodies, credentials or user prompts.
            body = json.dumps({'error': type(exc).__name__,
                               'message': 'Check server model settings and availability.'}).encode()
            self.send_response(502)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(body)

if __name__ == '__main__':
    print('FieldTrip: http://localhost:8765')
    print('In Connect Gemma, set endpoint to http://localhost:8765')
    ThreadingHTTPServer(('127.0.0.1', 8765), Handler).serve_forever()
