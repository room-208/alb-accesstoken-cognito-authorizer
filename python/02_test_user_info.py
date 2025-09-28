import os

import dotenv
import requests

dotenv.load_dotenv()

TOKEN = os.environ["HTTP_X_AMZN_OIDC_ACCESSTOKEN"]
COGNITO_DOMAIN = os.environ["COGNITO_DOMAIN"]

headers = {"Authorization": f"Bearer {TOKEN}"}

response = requests.get(f"https://{COGNITO_DOMAIN}/oauth2/userInfo", headers=headers)

print(response.text)
# {
#    "sub": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
#    "email_verified": "true",
#    "email": "example@example.com",
#    "username": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
# }
