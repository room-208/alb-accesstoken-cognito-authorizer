from typing import Any

import requests
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError, PyJWKClient, decode
from schemas import User
from settings import settings

jwk_client = PyJWKClient(settings.jwks_url, cache_keys=True)

bearer_scheme = HTTPBearer()


def verify_access_token(
    token: HTTPAuthorizationCredentials = Security(bearer_scheme),
) -> Any:
    try:
        signing_key = jwk_client.get_signing_key_from_jwt(token.credentials)

        payload = decode(
            token.credentials,
            signing_key.key,
            algorithms=["RS256"],
            issuer=settings.issuer,
        )
        return payload
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"JWT verification failed: {e}",
        )


def get_current_user(
    token: HTTPAuthorizationCredentials = Security(bearer_scheme),
) -> User:
    access_token = token.credentials

    headers = {"Authorization": f"Bearer {access_token}"}
    resp = requests.get(settings.userinfo_url, headers=headers)

    if resp.status_code != status.HTTP_200_OK:
        raise HTTPException(
            status_code=resp.status_code, detail="Failed to get user info"
        )

    data = resp.json()
    user = User(**data)
    return user
