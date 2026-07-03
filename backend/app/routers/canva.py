"""
FikirBiz Backend — Canva Design API Router.

Canva Connect API ilə dizayn yaratma, idxal, ixrac və siyahıya alma.
Rəsmi sənədlər: https://www.canva.dev/docs/connect/api-reference/

Endpoint-lər:
- POST /designs/create      — Yeni Canva dizaynı yaradır
- GET  /designs             — İstifadəçinin dizaynlarını siyahıya alır
- GET  /designs/{id}        — Dizayn metadata-sını alır
- POST /designs/{id}/export — Dizaynı ixrac edir
- POST /assets/upload       — Binary asset yükləyir
- POST /assets/upload-url   — URL-dən asset yükləyir
- GET  /assets/{id}/job     — Upload job statusunu yoxlayır
- GET  /assets/{id}         — Asset metadata-sını alır
- PATCH /assets/{id}        — Asset metadata-sını yeniləyir
- DELETE /assets/{id}       — Asset-i silir
"""

import logging
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_active_user, require_role, verify_token, JWTPayload
from app.models.user import User
from app.services.canva_service import (
    CanvaAPIError,
    CanvaNotConnectedError,
    canva_api_request,
    upload_asset_binary,
    upload_asset_from_url,
    get_asset_upload_job,
    get_url_asset_upload_job,
    get_asset,
    update_asset,
    delete_asset,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/canva",
    tags=["canva"],
    dependencies=[Depends(require_role("customer"))],
)

# Maksimum fayl ölçüsü (50 MB images, 500 MB videos)
MAX_IMAGE_SIZE = 50 * 1024 * 1024  # 50 MB
MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500 MB


# ─── Request/Response Schemas ──────────────────────────────────────


class CreateDesignRequest(BaseModel):
    """Dizayn yaratmaq üçün request body."""
    design_type: Optional[str] = Field(
        None,
        description="Preset design type: doc, email, presentation, whiteboard",
    )
    width: Optional[int] = Field(
        None, ge=40, le=8000,
        description="Custom design width (pixels)",
    )
    height: Optional[int] = Field(
        None, ge=40, le=8000,
        description="Custom design height (pixels)",
    )
    title: Optional[str] = Field(
        None, max_length=255, min_length=1,
        description="Design title",
    )
    asset_id: Optional[str] = Field(
        None,
        description="Asset ID to insert into the design",
    )


class ExportDesignRequest(BaseModel):
    """Dizaynı ixrac etmək üçün request body."""
    format_type: str = Field(
        ...,
        description="Export format: pdf, jpg, png, pptx, mp4, gif, csv, html_bundle, html_standalone",
        alias="format",
    )
    quality: Optional[int] = Field(
        None, ge=1, le=100,
        description="JPEG quality (1-100). Required for jpg format.",
    )
    export_quality: Optional[str] = Field(
        None,
        description="Export quality: regular or pro (for PDF/PNG/GIF/MP4)",
    )
    width: Optional[int] = Field(
        None, ge=40, le=25000,
        description="Export width in pixels (for JPG/PNG/GIF)",
    )
    height: Optional[int] = Field(
        None, ge=40, le=25000,
        description="Export height in pixels (for JPG/PNG/GIF)",
    )
    pages: Optional[list[int]] = Field(
        None,
        description="Page numbers to export (1-indexed)",
    )
    size: Optional[str] = Field(
        None,
        description="Paper size for PDF: a4, a3, letter, legal",
    )
    lossless: Optional[bool] = Field(
        None,
        description="Lossless PNG compression (requires Canva Pro)",
    )
    transparent_background: Optional[bool] = Field(
        None,
        description="Transparent PNG background (requires Canva Pro)",
    )
    as_single_image: Optional[bool] = Field(
        None,
        description="Merge multi-pages into single PNG image",
    )
    video_quality: Optional[str] = Field(
        None,
        description="Video quality for mp4: horizontal_480p, horizontal_720p, horizontal_1080p, horizontal_4k, vertical_480p, vertical_720p, vertical_1080p, vertical_4k",
    )


class URLAssetUploadRequest(BaseModel):
    """URL-dən asset yükləmək üçün request body."""
    url: str = Field(..., description="Asset URL-si")
    name: Optional[str] = Field(
        None, max_length=50,
        description="Asset adı",
    )


class AssetUploadURLRequest(BaseModel):
    """URL asset upload job statusu üçün request body."""
    job_id: str = Field(..., description="Upload job ID")


class UpdateAssetRequest(BaseModel):
    """Asset metadata yeniləmə request body."""
    name: Optional[str] = Field(None, max_length=50, description="Yeni ad")
    tags: Optional[list[str]] = Field(None, description="Yeni tag-lar")


class DesignResponse(BaseModel):
    """Dizayn metadata response."""
    id: str
    title: str
    edit_url: str
    view_url: str
    thumbnail_url: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class DesignListResponse(BaseModel):
    """Dizayn siyahısı response."""
    items: list[DesignResponse]
    continuation: Optional[str] = None


class ExportJobResponse(BaseModel):
    """Export job response."""
    job_id: str
    status: str
    urls: Optional[list[dict]] = None


class AssetResponse(BaseModel):
    """Asset metadata response."""
    id: str
    type: str
    name: str
    tags: list[str] = []
    created_at: Optional[int] = None
    updated_at: Optional[int] = None
    thumbnail_url: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None


class AssetUploadJobResponse(BaseModel):
    """Asset upload job response."""
    job_id: str
    status: str
    asset: Optional[AssetResponse] = None
    error: Optional[dict] = None


# ─── Design Endpoints ─────────────────────────────────────────────


@router.post("/designs/create", response_model=DesignResponse)
async def create_design(
    body: CreateDesignRequest,
    payload: Annotated[JWTPayload, Depends(verify_token)],
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Yeni Canva dizaynı yaradır.

    Canva API: POST /v1/designs
    Scope: design:content:write
    """
    design_type = None
    if body.design_type:
        design_type = {
            "type": "preset",
            "name": body.design_type,
        }
    elif body.width and body.height:
        design_type = {
            "type": "custom",
            "width": body.width,
            "height": body.height,
        }

    request_body = {"type": "type_and_asset"}
    if design_type:
        request_body["design_type"] = design_type
    if body.title:
        request_body["title"] = body.title
    if body.asset_id:
        request_body["asset_id"] = body.asset_id

    try:
        result = await canva_api_request(
            method="POST",
            path="/v1/designs",
            user_id=user.id,
            db=db,
            json=request_body,
        )

        design = result.get("design", {})
        return DesignResponse(
            id=design.get("id", ""),
            title=design.get("title", ""),
            edit_url=design.get("urls", {}).get("edit_url", ""),
            view_url=design.get("urls", {}).get("view_url", ""),
            thumbnail_url=design.get("thumbnail", {}).get("url") if design.get("thumbnail") else None,
            created_at=design.get("created_at"),
            updated_at=design.get("updated_at"),
        )

    except CanvaNotConnectedError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "NOT_CONNECTED", "message": "Canva hesabı bağlı deyil"},
        )
    except CanvaAPIError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"code": e.code, "message": e.message},
        )


@router.get("/designs", response_model=DesignListResponse)
async def list_designs(
    payload: Annotated[JWTPayload, Depends(verify_token)],
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    query: Optional[str] = None,
    limit: int = 25,
    continuation: Optional[str] = None,
):
    """
    İstifadəçinin dizaynlarını siyahıya alır.

    Canva API: GET /v1/designs
    Scope: design:meta:read
    """
    params = {"limit": min(limit, 100)}
    if query:
        params["query"] = query
    if continuation:
        params["continuation"] = continuation

    try:
        result = await canva_api_request(
            method="GET",
            path="/v1/designs",
            user_id=user.id,
            db=db,
            params=params,
        )

        items = []
        for design in result.get("items", []):
            items.append(DesignResponse(
                id=design.get("id", ""),
                title=design.get("title", ""),
                edit_url=design.get("urls", {}).get("edit_url", ""),
                view_url=design.get("urls", {}).get("view_url", ""),
                thumbnail_url=design.get("thumbnail", {}).get("url") if design.get("thumbnail") else None,
                created_at=design.get("created_at"),
                updated_at=design.get("updated_at"),
            ))

        return DesignListResponse(
            items=items,
            continuation=result.get("continuation"),
        )

    except CanvaNotConnectedError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "NOT_CONNECTED", "message": "Canva hesabı bağlı deyil"},
        )
    except CanvaAPIError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"code": e.code, "message": e.message},
        )


@router.get("/designs/{design_id}", response_model=DesignResponse)
async def get_design(
    design_id: str,
    payload: Annotated[JWTPayload, Depends(verify_token)],
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Dizayn metadata-sını alır.

    Canva API: GET /v1/designs/{designId}
    Scope: design:meta:read
    """
    try:
        result = await canva_api_request(
            method="GET",
            path=f"/v1/designs/{design_id}",
            user_id=user.id,
            db=db,
        )

        design = result.get("design", {})
        return DesignResponse(
            id=design.get("id", ""),
            title=design.get("title", ""),
            edit_url=design.get("urls", {}).get("edit_url", ""),
            view_url=design.get("urls", {}).get("view_url", ""),
            thumbnail_url=design.get("thumbnail", {}).get("url") if design.get("thumbnail") else None,
            created_at=design.get("created_at"),
            updated_at=design.get("updated_at"),
        )

    except CanvaNotConnectedError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "NOT_CONNECTED", "message": "Canva hesabı bağlı deyil"},
        )
    except CanvaAPIError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"code": e.code, "message": e.message},
        )


@router.post("/designs/{design_id}/export", response_model=ExportJobResponse)
async def export_design(
    design_id: str,
    body: ExportDesignRequest,
    payload: Annotated[JWTPayload, Depends(verify_token)],
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Dizaynı ixrac edir.

    Canva API: POST /v1/exports
    Scope: design:content:read

    NOTE: Bu async job API-dır. İlk sorğu {job: {id, status: "in_progress"}} qaytarır.
    Statusu yoxlamaq üçün GET /v1/exports/{jobId} istifadə edin.
    """
    format_config = {"type": body.format_type}

    # JPG formatı üçün quality tələb olunur
    if body.format_type == "jpg":
        if body.quality is not None:
            format_config["quality"] = body.quality
        else:
            # Default quality
            format_config["quality"] = 80
    # PDF formatı üçün size
    elif body.format_type == "pdf":
        if body.size:
            format_config["size"] = body.size
    # MP4 formatı üçün quality tələb olunur
    elif body.format_type == "mp4":
        if body.video_quality:
            format_config["quality"] = body.video_quality
        else:
            format_config["quality"] = "horizontal_1080p"

    # Ümumi parametrlər
    if body.export_quality:
        format_config["export_quality"] = body.export_quality
    if body.width:
        format_config["width"] = body.width
    if body.height:
        format_config["height"] = body.height
    if body.pages:
        format_config["pages"] = body.pages

    # PNG xüsusi parametrlər
    if body.format_type == "png":
        if body.lossless is not None:
            format_config["lossless"] = body.lossless
        if body.transparent_background is not None:
            format_config["transparent_background"] = body.transparent_background
        if body.as_single_image is not None:
            format_config["as_single_image"] = body.as_single_image

    request_body = {
        "design_id": design_id,
        "format": format_config,
    }

    try:
        result = await canva_api_request(
            method="POST",
            path="/v1/exports",
            user_id=user.id,
            db=db,
            json=request_body,
        )

        job = result.get("job", {})
        return ExportJobResponse(
            job_id=job.get("id", ""),
            status=job.get("status", "in_progress"),
            urls=job.get("urls"),
        )

    except CanvaNotConnectedError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "NOT_CONNECTED", "message": "Canva hesabı bağlı deyil"},
        )
    except CanvaAPIError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"code": e.code, "message": e.message},
        )


@router.get("/exports/{job_id}", response_model=ExportJobResponse)
async def get_export_job(
    job_id: str,
    payload: Annotated[JWTPayload, Depends(verify_token)],
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Export job statusunu alır.

    Canva API: GET /v1/exports/{jobId}
    Scope: design:content:read

    Async job polling üçün istifadə edin.
    """
    try:
        result = await canva_api_request(
            method="GET",
            path=f"/v1/exports/{job_id}",
            user_id=user.id,
            db=db,
        )

        job = result.get("job", {})
        return ExportJobResponse(
            job_id=job.get("id", ""),
            status=job.get("status", "in_progress"),
            urls=job.get("urls"),
        )

    except CanvaNotConnectedError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "NOT_CONNECTED", "message": "Canva hesabı bağlı deyil"},
        )
    except CanvaAPIError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"code": e.code, "message": e.message},
        )


# ─── Asset Endpoints ─────────────────────────────────────────────


@router.post("/assets/upload", response_model=AssetUploadJobResponse)
async def upload_asset(
    payload: Annotated[JWTPayload, Depends(verify_token)],
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(...),
):
    """
    Binary faylı Canva-ya yükləyir.

    Canva API: POST /v1/asset-uploads
    Scope: asset:write

    Dəstəklənən formatlar:
    - Şəkillər: JPEG, PNG, HEIC, GIF (tək frame), TIFF, WEBP (≤50 MB)
    - Videolar: M4V, MKV, MP4, MPEG, QuickTime, WebM (≤500 MB)
    """
    # Fayl ölçüsünü yoxla
    content = await file.read()
    file_size = len(content)

    # Şəkil və ya video formatını təyin et
    is_video = file.content_type and file.content_type.startswith("video/")
    max_size = MAX_VIDEO_SIZE if is_video else MAX_IMAGE_SIZE

    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={
                "code": "FILE_TOO_BIG",
                "message": f"Fayl ölçüsü {max_size // (1024*1024)} MB limitini aşır",
            },
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "EMPTY_FILE", "message": "Fayl boşdur"},
        )

    # Asset adını təyin et (filename və ya content_type-dan)
    asset_name = file.filename or f"upload_{user.id}"

    try:
        result = await upload_asset_binary(
            user_id=user.id,
            db=db,
            file_bytes=content,
            name=asset_name,
        )

        job = result.get("job", {})
        asset_data = job.get("asset")

        asset_response = None
        if asset_data:
            thumbnail = asset_data.get("thumbnail", {})
            metadata = asset_data.get("metadata", {})
            asset_response = AssetResponse(
                id=asset_data.get("id", ""),
                type=asset_data.get("type", ""),
                name=asset_data.get("name", ""),
                tags=asset_data.get("tags", []),
                created_at=asset_data.get("created_at"),
                updated_at=asset_data.get("updated_at"),
                thumbnail_url=thumbnail.get("url"),
                width=metadata.get("width"),
                height=metadata.get("height"),
            )

        return AssetUploadJobResponse(
            job_id=job.get("id", ""),
            status=job.get("status", "in_progress"),
            asset=asset_response,
            error=job.get("error"),
        )

    except CanvaNotConnectedError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "NOT_CONNECTED", "message": "Canva hesabı bağlı deyil"},
        )
    except CanvaAPIError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"code": e.code, "message": e.message},
        )


@router.post("/assets/upload-url", response_model=AssetUploadJobResponse)
async def upload_asset_from_url_endpoint(
    body: URLAssetUploadRequest,
    payload: Annotated[JWTPayload, Depends(verify_token)],
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    URL-dən faylı Canva-ya yükləyir.

    Canva API: POST /v1/url-asset-uploads (Preview API)
    Scope: asset:write

    NOTE: Bu preview API-dır. Public inteqrasiyalarda istifadə edilməməlidir.
    """
    try:
        result = await upload_asset_from_url(
            user_id=user.id,
            db=db,
            url=body.url,
            name=body.name,
        )

        job = result.get("job", {})
        asset_data = job.get("asset")

        asset_response = None
        if asset_data:
            thumbnail = asset_data.get("thumbnail", {})
            metadata = asset_data.get("metadata", {})
            asset_response = AssetResponse(
                id=asset_data.get("id", ""),
                type=asset_data.get("type", ""),
                name=asset_data.get("name", ""),
                tags=asset_data.get("tags", []),
                created_at=asset_data.get("created_at"),
                updated_at=asset_data.get("updated_at"),
                thumbnail_url=thumbnail.get("url"),
                width=metadata.get("width"),
                height=metadata.get("height"),
            )

        return AssetUploadJobResponse(
            job_id=job.get("id", ""),
            status=job.get("status", "in_progress"),
            asset=asset_response,
            error=job.get("error"),
        )

    except CanvaNotConnectedError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "NOT_CONNECTED", "message": "Canva hesabı bağlı deyil"},
        )
    except CanvaAPIError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"code": e.code, "message": e.message},
        )


@router.get("/assets/job/{job_id}", response_model=AssetUploadJobResponse)
async def get_upload_job_status(
    job_id: str,
    payload: Annotated[JWTPayload, Depends(verify_token)],
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Asset upload job statusunu yoxlayır.

    Canva API: GET /v1/asset-uploads/{jobId}
    Scope: asset:read

    Async job polling üçün istifadə edin. Job bitənə qədər polling edin.
    """
    try:
        result = await get_asset_upload_job(user.id, db, job_id)

        job = result.get("job", {})
        asset_data = job.get("asset")

        asset_response = None
        if asset_data:
            thumbnail = asset_data.get("thumbnail", {})
            metadata = asset_data.get("metadata", {})
            asset_response = AssetResponse(
                id=asset_data.get("id", ""),
                type=asset_data.get("type", ""),
                name=asset_data.get("name", ""),
                tags=asset_data.get("tags", []),
                created_at=asset_data.get("created_at"),
                updated_at=asset_data.get("updated_at"),
                thumbnail_url=thumbnail.get("url"),
                width=metadata.get("width"),
                height=metadata.get("height"),
            )

        return AssetUploadJobResponse(
            job_id=job.get("id", ""),
            status=job.get("status", "in_progress"),
            asset=asset_response,
            error=job.get("error"),
        )

    except CanvaNotConnectedError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "NOT_CONNECTED", "message": "Canva hesabı bağlı deyil"},
        )
    except CanvaAPIError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"code": e.code, "message": e.message},
        )


@router.get("/assets/{asset_id}", response_model=AssetResponse)
async def get_asset_endpoint(
    asset_id: str,
    payload: Annotated[JWTPayload, Depends(verify_token)],
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Asset metadata-sını alır.

    Canva API: GET /v1/assets/{assetId}
    Scope: asset:read
    """
    try:
        result = await get_asset(user.id, db, asset_id)

        asset_data = result.get("asset", {})
        thumbnail = asset_data.get("thumbnail", {})
        metadata = asset_data.get("metadata", {})

        return AssetResponse(
            id=asset_data.get("id", ""),
            type=asset_data.get("type", ""),
            name=asset_data.get("name", ""),
            tags=asset_data.get("tags", []),
            created_at=asset_data.get("created_at"),
            updated_at=asset_data.get("updated_at"),
            thumbnail_url=thumbnail.get("url"),
            width=metadata.get("width"),
            height=metadata.get("height"),
        )

    except CanvaNotConnectedError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "NOT_CONNECTED", "message": "Canva hesabı bağlı deyil"},
        )
    except CanvaAPIError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"code": e.code, "message": e.message},
        )


@router.patch("/assets/{asset_id}", response_model=AssetResponse)
async def update_asset_endpoint(
    asset_id: str,
    body: UpdateAssetRequest,
    payload: Annotated[JWTPayload, Depends(verify_token)],
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Asset metadata-sını yeniləyir.

    Canva API: PATCH /v1/assets/{assetId}
    Scope: asset:write
    """
    try:
        result = await update_asset(
            user.id, db, asset_id,
            name=body.name,
            tags=body.tags,
        )

        asset_data = result.get("asset", {})
        thumbnail = asset_data.get("thumbnail", {})
        metadata = asset_data.get("metadata", {})

        return AssetResponse(
            id=asset_data.get("id", ""),
            type=asset_data.get("type", ""),
            name=asset_data.get("name", ""),
            tags=asset_data.get("tags", []),
            created_at=asset_data.get("created_at"),
            updated_at=asset_data.get("updated_at"),
            thumbnail_url=thumbnail.get("url"),
            width=metadata.get("width"),
            height=metadata.get("height"),
        )

    except CanvaNotConnectedError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "NOT_CONNECTED", "message": "Canva hesabı bağlı deyil"},
        )
    except CanvaAPIError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"code": e.code, "message": e.message},
        )


@router.delete("/assets/{asset_id}")
async def delete_asset_endpoint(
    asset_id: str,
    payload: Annotated[JWTPayload, Depends(verify_token)],
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Asset-i silir.

    Canva API: DELETE /v1/assets/{assetId}
    Scope: asset:write
    """
    try:
        await delete_asset(user.id, db, asset_id)
        return {"message": "Asset uğurla silindi"}

    except CanvaNotConnectedError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "NOT_CONNECTED", "message": "Canva hesabı bağlı deyil"},
        )
    except CanvaAPIError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"code": e.code, "message": e.message},
        )
