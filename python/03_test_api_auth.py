import os

import dotenv
import requests

dotenv.load_dotenv()

TOKEN = os.environ["HTTP_X_AMZN_OIDC_ACCESSTOKEN"]
API_DOMAIN = os.environ["API_DOMAIN"]

api_url = f"https://{API_DOMAIN}"
headers = {"Authorization": f"Bearer {TOKEN}"}

response = requests.get(api_url, headers=headers)
print(response.status_code)
print(response.text)
