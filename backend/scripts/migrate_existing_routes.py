"""Script to help migrate existing routes to use auth"""

import re
from pathlib import Path


def add_auth_to_route(route_content: str) -> str:
    """Add authentication to route functions"""
    pattern = r'(@router\.(get|post|put|delete|patch).*\n)async def (\w+)\((.*?)\):'

    def replace_func(match):
        decorator = match.group(1)
        params = match.group(4)
        if 'current_user' in params or 'Depends(get_current_user' in params:
            return match.group(0)
        if params.strip():
            new_params = f"{params},\n    current_user: Annotated[UserContext, Depends(get_current_user)] = None"
        else:
            new_params = "\n    current_user: Annotated[UserContext, Depends(get_current_user)] = None"
        return f"{decorator}async def {match.group(3)}({new_params}):"

    return re.sub(pattern, replace_func, route_content, flags=re.MULTILINE | re.DOTALL)


def migrate_route_file(filepath: Path):
    content = filepath.read_text()
    if 'from domain.auth import UserContext' not in content:
        import_section = 'from typing import List, Annotated\nfrom domain.auth import UserContext\nfrom core.auth_dependencies import get_current_user, get_current_user_id\n'
        content = import_section + content
    content = add_auth_to_route(content)
    content = content.replace('user_id = 1', 'user_id = current_user.user_id')
    filepath.write_text(content)
    print(f"\u2713 Migrated {filepath}")


if __name__ == "__main__":
    routes_dir = Path("backend/api/routes")
    for route_file in routes_dir.glob("*.py"):
        if route_file.name not in ["__init__.py", "auth.py"]:
            migrate_route_file(route_file)
