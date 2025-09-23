import os

import dotenv
import jwt
import requests
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from jwt import PyJWKClient

dotenv.load_dotenv()

ALB_PUBLIC_KEY_BASE_URL = os.environ["ALB_PUBLIC_KEY_BASE_URL"]
COGNITO_PUBLIC_KEY_URL = os.environ["COGNITO_PUBLIC_KEY_URL"]

HTTP_X_AMZN_OIDC_DATA = os.environ["HTTP_X_AMZN_OIDC_DATA"]
HTTP_X_AMZN_OIDC_ACCESSTOKEN = os.environ["HTTP_X_AMZN_OIDC_ACCESSTOKEN"]

alb_header = jwt.get_unverified_header(HTTP_X_AMZN_OIDC_DATA)
alb_kid = alb_header["kid"]

alb_public_key_url = f"{ALB_PUBLIC_KEY_BASE_URL}/{alb_kid}"
alb_pem = requests.get(alb_public_key_url).text
alb_public_key = serialization.load_pem_public_key(
    alb_pem.encode(), backend=default_backend()
)
alb_payload = jwt.decode(HTTP_X_AMZN_OIDC_DATA, alb_public_key, algorithms=["ES256"])
print("ALB token payload:", alb_payload)

cognito_jwk_client = PyJWKClient(COGNITO_PUBLIC_KEY_URL)
cognito_signing_key = cognito_jwk_client.get_signing_key_from_jwt(
    HTTP_X_AMZN_OIDC_ACCESSTOKEN
)

cognito_payload = jwt.decode(
    HTTP_X_AMZN_OIDC_ACCESSTOKEN, cognito_signing_key.key, algorithms=["RS256"]
)
print("Cognito access token payload:", cognito_payload)
