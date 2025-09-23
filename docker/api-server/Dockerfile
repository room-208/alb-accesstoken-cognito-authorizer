FROM public.ecr.aws/docker/library/python:3.8.12-slim-buster
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter

ENV PORT=8000
WORKDIR /var/task

COPY requirements.txt ./
RUN python -m pip install -r requirements.txt

COPY src/ ./
CMD exec uvicorn --host 0.0.0.0 --port=$PORT main:app