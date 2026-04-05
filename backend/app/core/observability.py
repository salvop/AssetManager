import logging
import time
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger("asset_manager.api")


def _request_id_from_state(request: Request) -> str:
    request_id = getattr(request.state, "request_id", None)
    return str(request_id) if request_id else "unknown"


def _error_payload(*, message: str, code: str, request_id: str, detail=None) -> dict:
    payload = {
        "detail": message,
        "error": {"code": code, "message": message},
        "request_id": request_id,
    }
    if detail is not None:
        payload["error"]["detail"] = detail
    return payload


def configure_observability(app: FastAPI) -> None:
    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or uuid4().hex
        request.state.request_id = request_id
        started_at = time.perf_counter()

        response = await call_next(request)

        duration_ms = (time.perf_counter() - started_at) * 1000
        response.headers["X-Request-ID"] = request_id
        logger.info(
            "request_completed method=%s path=%s status=%s duration_ms=%.2f request_id=%s",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
            request_id,
        )
        return response

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        request_id = _request_id_from_state(request)
        message = exc.detail if isinstance(exc.detail, str) else "Request failed"
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_payload(message=message, code="http_error", request_id=request_id, detail=exc.detail),
            headers={"X-Request-ID": request_id},
        )

    @app.exception_handler(RequestValidationError)
    async def request_validation_exception_handler(request: Request, exc: RequestValidationError):
        request_id = _request_id_from_state(request)
        return JSONResponse(
            status_code=422,
            content=_error_payload(
                message="Validation failed",
                code="validation_error",
                request_id=request_id,
                detail=exc.errors(),
            ),
            headers={"X-Request-ID": request_id},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        request_id = _request_id_from_state(request)
        logger.exception("unhandled_exception request_id=%s path=%s", request_id, request.url.path)
        return JSONResponse(
            status_code=500,
            content=_error_payload(
                message="Internal server error",
                code="internal_error",
                request_id=request_id,
            ),
            headers={"X-Request-ID": request_id},
        )
