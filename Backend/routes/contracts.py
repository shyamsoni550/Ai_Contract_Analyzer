from fastapi import APIRouter,UploadFile,File,HTTPException
import os,uuid
from config import ALLOWD_EXTENSIONS,MAX_FILE_SIZE_MB,UPLOAD_DIR
from services.document_parser import extract_text
from models import contact
from database import analysis_collection,contract_collection
router=APIRouter(
    prefix="/contracts",
    tags=["contracts"]
)

@router.post("/upload")
async def upload_contract(
    file:UploadFile=File(...)
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWD_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type")

    content = await file.read()
    size_mb=len(content)/(1024*1024 )
    
    # Reject the upload if it exceeds the configured size limit.
    if size_mb>MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=400, detail="File size is too large")
    
    # Make sure the upload folder exists.
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    # Create a unique filename so it does not overwrite another upload.
    unique_name=f"{uuid.uuid4().hex}{ext}"
    
    # Combine the upload folder and filename to get the save location.
    file_path=os.path.join(UPLOAD_DIR,unique_name)
    
    # Save the uploaded file's contents to disk.
    with open(file_path,"wb") as f:
        f.write(content)
    
    parsed=extract_text(file_path)
    
    contract_data=contact(
        filename=unique_name,
        origanl_name=file.filename or unique_name,
        text_content=parsed["text"],
        page_Count=parsed["page_count"],
        word_Count=parsed["word_count"],
    )
    
    doc=contract_data.model_dump()
    result=contract_collection.insert_one(doc)
    contract_data.id=str(result.inserted_id)
    return {
        "message":"Contract uploaded successfully",
        "contract":contract_data.model_dump(),
        "id":contract_data.id    
    }
   
@router.get("/")
async def list_contracts():
    contracts = []
    latest_analysis_ids = {}
    analyses = analysis_collection.find(
        {},
        {"_id": 1, "contract_id": 1, "analysis_date": 1},
    ).sort("analysis_date", -1)
    for analysis in analyses:
        latest_analysis_ids.setdefault(
            analysis["contract_id"],
            str(analysis["_id"]),
        )

    for doc in contract_collection.find({}, {"text_content": 0}):
        contract = contact(**doc)
        contract.id = str(doc["_id"])
        analysis_id = latest_analysis_ids.get(contract.id)
        if analysis_id:
            contract.status="Analyzed"
        contract_data = contract.model_dump()
        contract_data["analysis_id"] = analysis_id
        contracts.append(contract_data)
    return {"contracts":contracts}

@router.get("/{contract_id}")
async def get_contract(contract_id:str):
    from bson.objectid import ObjectId
    doc=contract_collection.find_one({"_id":ObjectId(contract_id)},{"text_content":0})
    if not doc:
        raise HTTPException(status_code=404,detail="Contract not found")
    
    contract=contact(**doc)
    contract.id=str(doc["_id"])
    
    return {"contract":contract.model_dump()}