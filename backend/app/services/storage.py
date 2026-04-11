import boto3
import uuid
from app.core.config import settings


def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url or None,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
    )


def upload_file(file_bytes: bytes, filename: str, bucket: str) -> str:
    s3 = get_s3_client()
    key = f"{uuid.uuid4()}/{filename}"
    s3.put_object(Bucket=bucket, Key=key, Body=file_bytes)
    endpoint = settings.s3_endpoint_url or "https://s3.amazonaws.com"
    return f"{endpoint}/{bucket}/{key}"
