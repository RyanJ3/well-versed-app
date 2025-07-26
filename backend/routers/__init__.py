# backend/routers/__init__.py
"""API routers package

This package used to import every router module eagerly which caused circular
import problems during application start-up. Now the package simply exposes the
module names via ``__all__`` without importing them automatically. Routers can
be imported lazily as needed.
"""

__all__ = [
    "user_verses",
    "feature_requests",
    "courses",
    "atlas",
    "config",
    "bibles",
    "monitoring",
]

