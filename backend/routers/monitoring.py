from fastapi import APIRouter, Depends
from typing import Dict, Any
from database import DatabaseConnection
import db_pool
from utils.performance import get_performance_report, reset_performance_tracking
import psutil
import os

router = APIRouter(tags=["monitoring"])

def get_db():
    return DatabaseConnection(db_pool.db_pool)

@router.get("/performance/report")
async def get_performance_metrics() -> Dict[str, Any]:
    report = get_performance_report()
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    return {
        "query_performance": report,
        "system_metrics": {
            "memory_usage_mb": round(memory_info.rss / 1024 / 1024, 2),
            "cpu_percent": process.cpu_percent(interval=0.1),
            "num_threads": process.num_threads(),
        },
        "recommendations": _generate_recommendations(report)
    }

@router.post("/performance/reset")
async def reset_performance_metrics():
    reset_performance_tracking()
    return {"message": "Performance tracking reset"}

@router.get("/performance/slow-queries")
async def get_slow_queries(threshold_ms: int = 100, db: DatabaseConnection = Depends(get_db)) -> Dict[str, Any]:
    query = """
        SELECT 
            query,
            calls,
            total_time,
            mean_time,
            max_time
        FROM pg_stat_statements
        WHERE mean_time > %s
        ORDER BY mean_time DESC
        LIMIT 20
    """
    try:
        slow_queries = db.fetch_all(query, (threshold_ms,))
        return {
            "threshold_ms": threshold_ms,
            "slow_queries": slow_queries
        }
    except Exception as e:
        return {
            "error": "pg_stat_statements extension may not be enabled",
            "details": str(e)
        }

def _generate_recommendations(report: Dict[str, Dict]) -> list:
    recommendations = []
    for method, stats in report.items():
        if stats["exceeded_percentage"] > 10:
            recommendations.append({
                "method": method,
                "issue": "Frequently exceeds query limit",
                "current_avg": stats["avg_queries_per_call"],
                "recommendation": "Review query optimization or increase cache usage"
            })
        if stats["avg_execution_time"] > 0.5:
            recommendations.append({
                "method": method,
                "issue": "Slow execution time",
                "avg_time_seconds": stats["avg_execution_time"],
                "recommendation": "Consider adding database indexes or query optimization"
            })
    return recommendations
