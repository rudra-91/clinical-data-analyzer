import os
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

KNOWLEDGE_BASE = os.path.join(os.path.dirname(__file__), "knowledge_base")
CHROMA_DB = os.path.join(os.path.dirname(__file__), "chroma_db")
MODEL_NAME = "BAAI/bge-small-en-v1.5"

docs = []
for filename in os.listdir(KNOWLEDGE_BASE):
    if filename.endswith(".md"):
        loader = TextLoader(os.path.join(KNOWLEDGE_BASE, filename))
        docs.extend(loader.load())

splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=20)
chunks = splitter.split_documents(docs)

embeddings = HuggingFaceEmbeddings(model_name=MODEL_NAME)
Chroma.from_documents(chunks, embeddings, persist_directory=CHROMA_DB)
print(f"Indexed {len(chunks)} chunks from {len(docs)} documents.")
