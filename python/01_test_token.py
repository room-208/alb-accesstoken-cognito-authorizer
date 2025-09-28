import os

import dotenv
import jwt
import requests
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from jwt import PyJWKClient

dotenv.load_dotenv()

REGION = os.environ["REGION"]

COGNITO_USER_POOL_ID = os.environ["COGNITO_USER_POOL_ID"]

HTTP_X_AMZN_OIDC_DATA = os.environ["HTTP_X_AMZN_OIDC_DATA"]
HTTP_X_AMZN_OIDC_ACCESSTOKEN = os.environ["HTTP_X_AMZN_OIDC_ACCESSTOKEN"]

alb_public_key_base_url = f"https://public-keys.auth.elb.{REGION}.amazonaws.com"
cognito_public_key_url = f"https://cognito-idp.{REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"

# verify x-amzn-oidc-data
alb_header = jwt.get_unverified_header(HTTP_X_AMZN_OIDC_DATA)
alb_kid = alb_header["kid"]
alb_public_key_url = f"{alb_public_key_base_url}/{alb_kid}"
alb_pem = requests.get(alb_public_key_url).text
alb_public_key = serialization.load_pem_public_key(
    alb_pem.encode(), backend=default_backend()
)
alb_payload = jwt.decode(HTTP_X_AMZN_OIDC_DATA, alb_public_key, algorithms=["ES256"])

print(alb_payload)
# {
#    "sub": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
#    "email_verified": "true",
#    "email": "example@example.com",
#    "username": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
#    "exp": 1759073152,
#    "iss": "https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_XXXXXXXXX",
# }

# verify x-amzn-oidc-accesstoken
cognito_jwk_client = PyJWKClient(cognito_public_key_url)
cognito_signing_key = cognito_jwk_client.get_signing_key_from_jwt(
    HTTP_X_AMZN_OIDC_ACCESSTOKEN
)
cognito_payload = jwt.decode(
    HTTP_X_AMZN_OIDC_ACCESSTOKEN, cognito_signing_key.key, algorithms=["RS256"]
)

print(cognito_payload)
# {
#    "sub": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
#    "iss": "https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_XXXXXXXXX",
#    "version": 2,
#    "client_id": "xxxxxxxxxxxxxxxxxxxxxxxxxx",
#    "origin_jti": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
#    "event_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
#    "token_use": "access",
#    "scope": "openid example.com/api:all",
#    "auth_time": 1759073032,
#    "exp": 1759076632,
#    "iat": 1759073032,
#    "jti": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
#    "username": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
# }
