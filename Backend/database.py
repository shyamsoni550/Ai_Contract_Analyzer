from pymongo import MongoClient
from config import MONGODB_URI

client = MongoClient(MONGODB_URI)
db=client['vakeel']
#collections
contract_collection=db['contracts']
analysis_collection=db['analysis']

def init_db():
    contract_collection.create_index("filename", unique=True)
    analysis_collection.create_index("contract_id", unique=True)

