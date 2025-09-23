import os

import dotenv
import requests

dotenv.load_dotenv()

TOKEN = os.environ["HTTP_X_AMZN_OIDC_ACCESSTOKEN"]
API_BASE_URL = os.environ["API_BASE_URL"]

headers = {"Authorization": f"Bearer {TOKEN}"}

response = requests.get(API_BASE_URL, headers=headers)
print(response.status_code)
print(response.text)

response = requests.get(f"{API_BASE_URL}/verify", headers=headers)
print(response.status_code)
print(response.text)

response = requests.get(f"{API_BASE_URL}/users", headers=headers)
print(response.status_code)
print(response.text)
