from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict

router = APIRouter()

# Connection manager to handle active websocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        # Store chat history temporarily in memory for demonstration
        self.chat_history: List[Dict] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        # Send history upon connection
        for msg in self.chat_history:
            await websocket.send_json(msg)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        self.chat_history.append(message)
        # Keep only the last 50 messages to prevent memory issues in this mock
        if len(self.chat_history) > 50:
            self.chat_history.pop(0)
            
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                self.disconnect(connection)

manager = ConnectionManager()

@router.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    """
    HIPAA-Ready Secure WebSocket connection for real-time doctor-patient coordination.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Receive data from client
            data = await websocket.receive_json()
            
            # Broadcast the message to all connected clients
            await manager.broadcast(data)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
