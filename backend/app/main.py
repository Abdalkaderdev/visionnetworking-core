from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import (
    auth, users, buildings, companies, brands,
    items, prices, clients, boqs, contacts,
)

app = FastAPI(title="VisionNetworking API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in [
    auth.router, users.router, buildings.router, companies.router,
    brands.router, items.router, prices.router,
    clients.router, boqs.router, contacts.router,
]:
    app.include_router(r)


@app.get("/health")
def health():
    return {"status": "ok"}
