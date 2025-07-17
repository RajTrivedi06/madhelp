from typing import Any, Dict, Optional

class UserCache:
    def __init__(self):
        self._cache: Dict[int, Dict[str, Any]] = {}

    def get(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get cached data for a user."""
        return self._cache.get(user_id)

    def set(self, user_id: int, data: Dict[str, Any]) -> None:
        """Cache data for a user."""
        self._cache[user_id] = data

    def delete(self, user_id: int) -> None:
        """Remove cached data for a user."""
        self._cache.pop(user_id, None)

    def clear(self) -> None:
        """Clear all cached data."""
        self._cache.clear()

# Create a singleton instance
user_cache = UserCache() 