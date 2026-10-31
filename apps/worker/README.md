# Worker

Celery worker + beat for scheduled check runs. Task code lives in `apps/api/vciso_api/tasks.py`
so the worker and API share one code base and one image.

    celery -A vciso_api.tasks worker --loglevel=INFO
    celery -A vciso_api.tasks beat   --loglevel=INFO

Daily schedule: 02:00 UTC for every organisation with at least one integration.
