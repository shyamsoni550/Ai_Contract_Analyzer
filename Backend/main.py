from fastapi import FastAPI
from config import CORS_ORIGINS
from database import init_db
from routes.contracts import router as contracts_router
from routes.analysis import router as analysis_router
from fastapi.middleware.cors import CORSMiddleware
app=FastAPI(
    title="Vakeel Contract API",
    description="Vakeel Contract API",
    version="0.0.1"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.on_event("startup")
async def startup_event():
    init_db()
@app.get("/")
async def root():
    return {  
        "app":"vakeel contract API",
        "version":"0.0.1",
        "endpoints":{
            "POST /contract/upload": "upload a PDF or TXT file to analyze",
            "GET /contracts": "Rerive a list of Uploaded contracts", 
            "GET /contracts/{id}": "Rerive a list of Uploaded contracts By ID",
            "POST /analysis/analyse/{contract_id}": "Rerive a list of specific analyzed contracts By contract ID",
            "GET /analysis/{analysis_id}": "Rerive a list of specific analyzed contracts By analysis ID",
            "GET /analysis/contract/{contract_id}": "Rerive a list of all analyzed contract Uploaded contracts By ID" 
        }
}

app.include_router(contracts_router)
app.include_router(analysis_router)